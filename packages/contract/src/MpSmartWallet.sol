// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {_packValidationData} from "@account-abstraction/contracts/core/Helpers.sol";
import {IMpSmartWallet} from "./IMpSmartWallet.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Mp Smart Wallet
 * @author stoneybro
 * @notice A smart contract wallet implementation compliant with ERC-4337.
 * @dev Implements IAccount from account-abstraction. Supports Mp Intent Registry for automated payments.
 * @custom:security-contact stoneybrocrypto@gmail.com
 */
contract MpSmartWallet is IAccount, IMpSmartWallet, ReentrancyGuard, Initializable {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice Represents a call to make.
    struct Call {
        /// @dev The address to call.
        address target;
        /// @dev The value to send when making the call.
        uint256 value;
        /// @dev The data of the call.
        bytes data;
    }

    /// @notice ComplianceMetadata is defined in IMpSmartWallet interface

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Account owner address. Signer of UserOperations.
    address public s_owner;

    /// @notice Mp intent registry authorized to trigger scheduled transfers.
    address public immutable intentRegistry;

    /// @notice Amount of funds committed to intents per token (locked)
    /// @dev address(0) represents ETH, other addresses represent ERC20 tokens
    mapping(address => uint256) public s_committedFunds;

    /// @notice EIP-1271 magic return value for valid signatures.
    bytes4 internal constant _EIP1271_MAGICVALUE = 0x1626ba7e;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Emitted when the committed funds are increased.
    event CommitmentIncreased(address indexed token, uint256 amount, uint256 newTotal);

    /// @notice Emitted when the committed funds are decreased.
    event CommitmentDecreased(address indexed token, uint256 amount, uint256 newTotal);

    /// @notice Emitted when a transfer fails during intent execution.
    event TransferFailed(
        bytes32 indexed intentId,
        uint256 indexed transactionCount,
        address indexed recipient,
        address token,
        uint256 amount
    );

    /// @notice Emitted when a single execute is performed
    event Executed(address indexed target, uint256 value, bytes data);

    /// @notice Emitted when a batch execute is performed
    event ExecutedBatch(uint256 indexed batchSize, uint256 totalValue);

    /// @notice Emitted when a transaction includes compliance metadata
    event ComplianceExecuted(
        bytes32 indexed txType,
        string[] entityIds,
        IMpSmartWallet.Jurisdiction[] jurisdictions,
        IMpSmartWallet.Category[] categories,
        string referenceId
    );

    /// @notice The event emitted when a wallet action is performed
    event WalletAction(
        address indexed initiator,
        address indexed target,
        uint256 value,
        bytes4 indexed selector,
        bool success,
        bytes32 actionType
    );

    /// @notice Emitted when an intent batch transfer is executed
    event IntentBatchTransferExecuted(
        bytes32 indexed intentId,
        uint256 indexed transactionCount,
        address indexed token,
        uint256 recipientCount,
        uint256 totalValue,
        uint256 failedAmount
    );

    /// @notice Emitted for each successful transfer in an intent batch
    event IntentTransferSuccess(
        bytes32 indexed intentId,
        uint256 indexed transactionCount,
        address indexed recipient,
        address token,
        uint256 amount
    );

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when caller is not the EntryPoint.
    error MpSmartWallet__NotFromEntryPoint();

    /// @notice Thrown when caller is neither EntryPoint nor owner.
    error MpSmartWallet__Unauthorized();

    /// @notice Thrown when owner is zero address.
    error MpSmartWallet__OwnerIsZeroAddress();

    /// @notice Thrown when registry address is zero.
    error MpSmartWallet__IntentRegistryZeroAddress();

    /// @notice Thrown when batch inputs are invalid.
    error MpSmartWallet__InvalidBatchInput();

    /// @notice Thrown when a transfer fails.
    error MpSmartWallet__TransferFailed(address recipient, address token, uint256 amount);

    /// @notice Thrown when there are insufficient uncommitted funds.
    error MpSmartWallet__InsufficientUncommittedFunds();

    /// @notice Thrown when caller is not the registry.
    error MpSmartWallet__NotFromRegistry();

    /// @notice commitment decrease is more than commited balance
    error MpSmartWallet__InvalidCommitmentDecrease();

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Reverts if the caller is not the EntryPoint.
    modifier onlyEntryPoint() {
        if (msg.sender != entryPoint()) {
            revert MpSmartWallet__NotFromEntryPoint();
        }
        _;
    }

    /// @notice Reverts if the caller is neither the EntryPoint nor the owner.
    modifier onlyEntryPointOrOwner() {
        if (msg.sender != entryPoint() && msg.sender != s_owner) {
            revert MpSmartWallet__Unauthorized();
        }
        _;
    }

    /// @notice Reverts if the caller is not the registry.
    modifier onlyRegistry() {
        if (msg.sender != intentRegistry) {
            revert MpSmartWallet__NotFromRegistry();
        }
        _;
    }

    /**
     * @notice Sends to the EntryPoint (i.e. `msg.sender`) the missing funds for this transaction.
     *
     * @dev Subclass MAY override this modifier for better funds management (e.g. send to the
     *  EntryPoint more than the minimum required, so that in future transactions it will not
     *   be required to send again).
     *
     * @param missingAccountFunds The minimum value this modifier should send the EntryPoint which
     *  MAY be zero, in case there is enough deposit, or the userOp has a
     *  paymaster.
     */
    modifier payPrefund(uint256 missingAccountFunds) {
        _;

        assembly ("memory-safe") {
            if missingAccountFunds {
                // Ignore failure (it's EntryPoint's job to verify, not the account's).
                pop(call(gas(), caller(), missingAccountFunds, codesize(), 0x00, codesize(), 0x00))
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /// @notice Constructor prevents initialization of implementation contract.
    constructor(address registry) {
        if (registry == address(0)) revert MpSmartWallet__IntentRegistryZeroAddress();
        intentRegistry = registry;
        _disableInitializers();
    }

    /**
     * @notice Initializes the account with the owner.
     *
     * @dev Reverts if the account has already been initialized.
     *
     * @param _owner Address that will own this account and sign UserOperations.
     */
    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert MpSmartWallet__OwnerIsZeroAddress();
        s_owner = _owner;
    }

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @inheritdoc IAccount
     *
     * @notice ERC-4337 `validateUserOp` method. The EntryPoint will call this to validate
     *  the UserOperation before execution.
     *
     * @dev Signature failure should be reported by returning 1. This allows making a "simulation call"
     *  without a valid signature. Other failures should still revert.
     *
     * @param userOp The `UserOperation` to validate.
     * @param userOpHash  The hash of the `UserOperation`, computed by EntryPoint.
     * @param missingAccountFunds The missing account funds that must be deposited on the EntryPoint.
     *
     * @return validationData The encoded `ValidationData` structure:
     *  `(uint256(validAfter) << (160 + 48)) | (uint256(validUntil) << 160) | (success ? 0 : 1)`
     *
     */
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        override
        onlyEntryPoint
        payPrefund(missingAccountFunds)
        returns (uint256 validationData)
    {
        // Apply EIP-191 prefix to match how wallets sign messages
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(ethSignedMessageHash, userOp.signature);

        if (err != ECDSA.RecoverError.NoError) {
            return _packValidationData(true, 0, 0);
        }

        if (signer != s_owner) {
            return _packValidationData(true, 0, 0);
        }

        return _packValidationData(false, 0, 0);
    }

    /**
     * @notice Increases the committed funds for intents.
     * @dev Only callable by the registry.
     * @param token The token address (address(0) for ETH).
     * @param amount The amount to add to committed funds.
     */
    function increaseCommitment(address token, uint256 amount) external onlyRegistry {
        s_committedFunds[token] += amount;
        emit CommitmentIncreased(token, amount, s_committedFunds[token]);
    }

    /**
     * @notice Decreases the committed funds after intent execution/cancellation.
     * @dev Only callable by the registry.
     * @param token The token address (address(0) for ETH).
     * @param amount The amount to subtract from committed funds.
     */
    function decreaseCommitment(address token, uint256 amount) external onlyRegistry {
        if (amount > s_committedFunds[token]) {
            revert MpSmartWallet__InvalidCommitmentDecrease();
        }
        s_committedFunds[token] -= amount;
        emit CommitmentDecreased(token, amount, s_committedFunds[token]);
    }

    /**
     * @notice Executes a single call from this account.
     *
     * @dev Can only be called by the EntryPoint or the owner of this account.
     *  For ETH transfers, checks uncommitted funds. For token approvals/transfers,
     *  commitment checking happens at intent execution level.
     *
     * @param target The address to call.
     * @param value  The value to send with the call.
     * @param data   The data of the call.
     */
    function execute(address target, uint256 value, bytes calldata data)
        external
        payable
        nonReentrant
        onlyEntryPointOrOwner
    {
        _checkCommitment(address(0), value);
        bytes4 selector = data.length >= 4 ? bytes4(data[:4]) : bytes4(0);
        _call(target, value, data);
        emit WalletAction(msg.sender, target, value, selector, true, "EXECUTE");
        emit Executed(target, value, data);
    }

    /**
     * @notice Executes a single call with compliance metadata.
     * @dev Can only be called by the EntryPoint or the owner of this account.
     * @param target The address to call.
     * @param value  The value to send with the call.
     * @param data   The data of the call.
     * @param compliance Compliance metadata for tracking.
     */
    function executeWithCompliance(
        address target,
        uint256 value,
        bytes calldata data,
        IMpSmartWallet.ComplianceMetadata calldata compliance
    ) external payable nonReentrant onlyEntryPointOrOwner {
        _checkCommitment(address(0), value);
        bytes4 selector = data.length >= 4 ? bytes4(data[:4]) : bytes4(0);
        _call(target, value, data);
        emit WalletAction(msg.sender, target, value, selector, true, "EXECUTE");
        emit Executed(target, value, data);
        emit ComplianceExecuted(
            "SINGLE", compliance.entityIds, compliance.jurisdictions, compliance.categories, compliance.referenceId
        );
    }

    /**
     * @notice Executes a batch of calls from this account.
     *
     * @dev Can only be called by the EntryPoint or the owner of this account.
     *
     * @param calls The list of `Call`s to execute.
     */
    function executeBatch(Call[] calldata calls) external payable nonReentrant onlyEntryPointOrOwner {
        uint256 totalValue = 0;
        for (uint256 i; i < calls.length; i++) {
            totalValue += calls[i].value;
        }

        _checkCommitment(address(0), totalValue);

        for (uint256 i; i < calls.length; i++) {
            bytes4 selector = calls[i].data.length >= 4 ? bytes4(calls[i].data[:4]) : bytes4(0);
            _call(calls[i].target, calls[i].value, calls[i].data);
            emit WalletAction(msg.sender, calls[i].target, calls[i].value, selector, true, "BATCH");
        }
        emit ExecutedBatch(calls.length, totalValue);
    }

    /**
     * @notice Executes a batch of calls with compliance metadata.
     * @dev Can only be called by the EntryPoint or the owner of this account.
     * @param calls The list of `Call`s to execute.
     * @param compliance Compliance metadata for tracking.
     */
    function executeBatchWithCompliance(Call[] calldata calls, IMpSmartWallet.ComplianceMetadata calldata compliance)
        external
        payable
        nonReentrant
        onlyEntryPointOrOwner
    {
        uint256 totalValue = 0;
        for (uint256 i; i < calls.length; i++) {
            totalValue += calls[i].value;
        }

        _checkCommitment(address(0), totalValue);

        for (uint256 i; i < calls.length; i++) {
            bytes4 selector = calls[i].data.length >= 4 ? bytes4(calls[i].data[:4]) : bytes4(0);
            _call(calls[i].target, calls[i].value, calls[i].data);
            emit WalletAction(msg.sender, calls[i].target, calls[i].value, selector, true, "BATCH");
        }
        emit ExecutedBatch(calls.length, totalValue);
        emit ComplianceExecuted(
            "BATCH", compliance.entityIds, compliance.jurisdictions, compliance.categories, compliance.referenceId
        );
    }

    /**
     * @notice Executes a batch of transfers as part of an Mp intent.
     *
     * @param token The token address (address(0) for ETH, token address for ERC20).
     * @param recipients The array of recipient addresses.
     * @param amounts The array of amounts corresponding to each recipient.
     * @param intentId The unique identifier for the intent being executed.
     * @param transactionCount The current transaction number within the intent.
     * @param revertOnFailure Whether to revert entire transaction on any failure (true) or skip failed transfers (false).
     * @param compliance Compliance metadata for tracking.
     *
     * @return failedAmount The total amount that failed to transfer (only in skip mode)
     */
    function executeBatchIntentTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 intentId,
        uint256 transactionCount,
        bool revertOnFailure,
        IMpSmartWallet.ComplianceMetadata calldata compliance
    ) external nonReentrant onlyRegistry returns (uint256 failedAmount) {
        if (recipients.length == 0 || recipients.length != amounts.length) {
            revert MpSmartWallet__InvalidBatchInput();
        }
        uint256 totalValue = 0;
        uint256 totalFailed = 0;

        for (uint256 i; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];

            if (recipient == address(0) || amount == 0) {
                revert MpSmartWallet__InvalidBatchInput();
            }

            totalValue += amount;

            bool success;
            if (token == address(0)) {
                // ETH transfer
                (success,) = recipient.call{value: amount}("");
            } else {
                // ERC20 token transfer
                try IERC20(token).transfer(recipient, amount) returns (bool result) {
                    success = result;
                } catch {
                    success = false;
                }
            }

            if (!success) {
                totalFailed += amount;
                emit TransferFailed(intentId, transactionCount, recipient, token, amount);

                if (revertOnFailure) {
                    // Atomic mode: revert entire transaction on any failure
                    revert MpSmartWallet__TransferFailed(recipient, token, amount);
                }
                // Skip mode: continue to next recipient
            } else {
                // Emit success event for tracking
                emit IntentTransferSuccess(intentId, transactionCount, recipient, token, amount);
            }
        }

        emit IntentBatchTransferExecuted(intentId, transactionCount, token, recipients.length, totalValue, totalFailed);

        // Emit compliance event if categories are provided
        if (compliance.categories.length > 0) {
            emit ComplianceExecuted(
                "INTENT", compliance.entityIds, compliance.jurisdictions, compliance.categories, compliance.referenceId
            );
        }

        return totalFailed;
    }

    /**
     * @notice Returns the available (uncommitted) balance for a specific token.
     *
     * @param token The token address (address(0) for ETH, token address for ERC20).
     *
     * @return The available balance.
     */
    function getAvailableBalance(address token) external view returns (uint256) {
        if (token == address(0)) {
            // ETH balance
            return address(this).balance - s_committedFunds[address(0)];
        } else {
            // ERC20 token balance
            return IERC20(token).balanceOf(address(this)) - s_committedFunds[token];
        }
    }

    /**
     * @notice Returns the address of the EntryPoint v0.7.
     *
     * @return The address of the EntryPoint v0.7.
     */
    function entryPoint() public pure returns (address) {
        return 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    }

    /**
     * @notice EIP-1271 signature validation for contract signatures and off-chain tooling.
     *
     * @dev Supports EIP-191 (`eth_sign`) prefix for message hashing.
     *
     * @param hash      The hash that was signed.
     * @param signature The signature bytes.
     *
     * @return magicValue `_EIP1271_MAGICVALUE` (0x1626ba7e) if valid, 0x00000000 otherwise.
     */
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4) {
        address recovered = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(hash), signature);

        if (recovered == s_owner) {
            return _EIP1271_MAGICVALUE;
        }

        return bytes4(0);
    }

    /**
     * @notice Checks if a transfer value would exceed uncommitted funds for a specific token.
     *
     * @param token The token address (address(0) for ETH).
     * @param value The value to check.
     */
    function _checkCommitment(address token, uint256 value) internal view {
        if (value > 0) {
            uint256 availableBalance;
            if (token == address(0)) {
                availableBalance = address(this).balance - s_committedFunds[address(0)];
            } else {
                availableBalance = IERC20(token).balanceOf(address(this)) - s_committedFunds[token];
            }

            if (value > availableBalance) {
                revert MpSmartWallet__InsufficientUncommittedFunds();
            }
        }
    }

    /**
     * @notice Executes a call from this account.
     *
     * @dev Reverts with the original error if the call fails.
     *
     * @param target The address to call.
     * @param value  The value to send with the call.
     * @param data   The calldata to send.
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly ("memory-safe") {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /// @notice Allows the contract to receive ETH.
    receive() external payable {}

    /// @notice Fallback function to receive ETH.
    fallback() external payable {}
}
