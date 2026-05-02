// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {_packValidationData} from "@account-abstraction/contracts/core/Helpers.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ISmartWallet} from "./ISmartWallet.sol";
import {IComplianceRegistry} from "./IComplianceRegistry.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Smart Wallet
 * @author zion Livingstone
 * @notice ERC-4337 compliant smart account. Supports native ETH and ERC-20 stablecoin transfers.
 *         Records encrypted compliance metadata directly to the on-chain ComplianceRegistry.
 * @custom:security-contact zionlivingstone4@gmail.com
 */
contract SmartWallet is IAccount, ISmartWallet, ReentrancyGuard, Initializable {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice Represents a call to make.
    struct Call {
        address target;
        uint256 value;
        bytes data;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Account owner address. Signer of UserOperations.
    address public sOwner;

    /// @notice Intent registry authorized to trigger scheduled transfers.
    address public immutable INTENT_REGISTRY;

    /// @notice On-chain compliance registry on Ethereum Sepolia.
    address public immutable COMPLIANCE_REGISTRY;

    /// @notice Amount of funds committed to intents (locked) per token.
    /// @dev address(0) is used for native ETH.
    mapping(address token => uint256 amount) public sCommittedFunds;

    /// @notice EIP-1271 magic return value for valid signatures.
    bytes4 internal constant _EIP1271_MAGICVALUE = 0x1626ba7e;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event CommitmentIncreased(address indexed token, uint256 amount, uint256 newTotal);
    event CommitmentDecreased(address indexed token, uint256 amount, uint256 newTotal);

    event TransferFailed(
        bytes32 indexed intentId,
        uint256 indexed transactionCount,
        address indexed recipient,
        uint256 amount
    );

    event Executed(address indexed target, uint256 value, bytes data);
    event ExecutedBatch(uint256 indexed batchSize, uint256 totalValue);

    event WalletAction(
        address indexed initiator,
        address indexed target,
        uint256 value,
        bytes4 indexed selector,
        bool success,
        bytes32 actionType
    );

    event IntentBatchTransferExecuted(
        bytes32 indexed intentId,
        uint256 indexed transactionCount,
        uint256 recipientCount,
        uint256 totalValue,
        uint256 failedAmount
    );

    event IntentTransferSuccess(
        bytes32 indexed intentId,
        uint256 indexed transactionCount,
        address indexed recipient,
        uint256 amount
    );

    /// @notice Emitted when an ERC-20 token transfer is executed.
    event ERC20Transferred(address indexed token, address indexed to, uint256 amount);

    /// @notice Emitted when a compliance record is stored on-chain.
    event ComplianceRecorded(bytes32 indexed txHash);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error SmartWallet__NotFromEntryPoint();
    error SmartWallet__Unauthorized();
    error SmartWallet__OwnerIsZeroAddress();
    error SmartWallet__IntentRegistryZeroAddress();
    error SmartWallet__ComplianceRegistryZeroAddress();
    error SmartWallet__InvalidBatchInput();
    error SmartWallet__InsufficientUncommittedFunds();
    error SmartWallet__NotFromRegistry();
    error SmartWallet__InvalidCommitmentDecrease();

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyEntryPoint() {
        if (msg.sender != entryPoint()) revert SmartWallet__NotFromEntryPoint();
        _;
    }

    modifier onlyEntryPointOrOwner() {
        if (msg.sender != entryPoint() && msg.sender != sOwner && msg.sender != address(this)) revert SmartWallet__Unauthorized();
        _;
    }

    modifier onlyRegistry() {
        if (msg.sender != INTENT_REGISTRY) revert SmartWallet__NotFromRegistry();
        _;
    }

    modifier payPrefund(uint256 missingAccountFunds) {
        _;
        assembly ("memory-safe") {
            if missingAccountFunds {
                pop(call(gas(), caller(), missingAccountFunds, codesize(), 0x00, codesize(), 0x00))
            }
        }
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Initializes immutable addresses. Disables proxy initialization.
     * @param registry    The IntentRegistry address.
     * @param complianceRegistry The on-chain ComplianceRegistry on Ethereum Sepolia.
     */
    constructor(address registry, address complianceRegistry) {
        if (registry == address(0)) revert SmartWallet__IntentRegistryZeroAddress();
        if (complianceRegistry == address(0)) revert SmartWallet__ComplianceRegistryZeroAddress();
        INTENT_REGISTRY = registry;
        COMPLIANCE_REGISTRY = complianceRegistry;
        _disableInitializers();
    }

    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert SmartWallet__OwnerIsZeroAddress();
        sOwner = _owner;
    }

    /*//////////////////////////////////////////////////////////////
                         ERC-4337 VALIDATION
    //////////////////////////////////////////////////////////////*/

    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        override
        onlyEntryPoint
        payPrefund(missingAccountFunds)
        returns (uint256 validationData)
    {
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(ethSignedMessageHash, userOp.signature);
        if (err != ECDSA.RecoverError.NoError) return _packValidationData(true, 0, 0);
        if (signer != sOwner) return _packValidationData(true, 0, 0);
        return _packValidationData(false, 0, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        COMMITMENT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function increaseCommitment(address token, uint256 amount) external onlyRegistry {
        sCommittedFunds[token] += amount;
        emit CommitmentIncreased(token, amount, sCommittedFunds[token]);
    }

    function decreaseCommitment(address token, uint256 amount) external onlyRegistry {
        if (amount > sCommittedFunds[token]) revert SmartWallet__InvalidCommitmentDecrease();
        sCommittedFunds[token] -= amount;
        emit CommitmentDecreased(token, amount, sCommittedFunds[token]);
    }

    /*//////////////////////////////////////////////////////////////
                          NATIVE TOKEN TRANSFERS
    //////////////////////////////////////////////////////////////*/

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

    function executeBatch(Call[] calldata calls) external payable nonReentrant onlyEntryPointOrOwner {
        uint256 totalValue = 0;
        for (uint256 i; i < calls.length; i++) totalValue += calls[i].value;
        _checkCommitment(address(0), totalValue);
        for (uint256 i; i < calls.length; i++) {
            bytes4 selector = calls[i].data.length >= 4 ? bytes4(calls[i].data[:4]) : bytes4(0);
            _call(calls[i].target, calls[i].value, calls[i].data);
            emit WalletAction(msg.sender, calls[i].target, calls[i].value, selector, true, "BATCH");
        }
        emit ExecutedBatch(calls.length, totalValue);
    }

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external payable nonReentrant onlyEntryPointOrOwner {
        if (targets.length == 0 || targets.length != values.length || targets.length != datas.length) {
            revert SmartWallet__InvalidBatchInput();
        }
        uint256 totalValue = 0;
        for (uint256 i; i < values.length; i++) totalValue += values[i];
        _checkCommitment(address(0), totalValue);

        for (uint256 i; i < targets.length; i++) {
            bytes4 selector = datas[i].length >= 4 ? bytes4(datas[i][:4]) : bytes4(0);
            _call(targets[i], values[i], datas[i]);
            emit WalletAction(msg.sender, targets[i], values[i], selector, true, "BATCH");
        }
        emit ExecutedBatch(targets.length, totalValue);
    }

    function executeBatchIntentTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 intentId,
        uint256 transactionCount
    ) external nonReentrant onlyRegistry returns (uint256 failedAmount) {
        if (recipients.length == 0 || recipients.length != amounts.length) revert SmartWallet__InvalidBatchInput();
        uint256 totalValue = 0;
        uint256 totalFailed = 0;
        for (uint256 i; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];
            if (recipient == address(0) || amount == 0) revert SmartWallet__InvalidBatchInput();
            totalValue += amount;

            if (token == address(0)) {
                (bool success,) = recipient.call{value: amount}("");
                if (!success) {
                    totalFailed += amount;
                    emit TransferFailed(intentId, transactionCount, recipient, amount);
                } else {
                    emit IntentTransferSuccess(intentId, transactionCount, recipient, amount);
                }
            } else {
                try IERC20(token).transfer(recipient, amount) {
                    emit IntentTransferSuccess(intentId, transactionCount, recipient, amount);
                    emit ERC20Transferred(token, recipient, amount);
                } catch {
                    totalFailed += amount;
                    emit TransferFailed(intentId, transactionCount, recipient, amount);
                }
            }
        }
        emit IntentBatchTransferExecuted(intentId, transactionCount, recipients.length, totalValue, totalFailed);
        return totalFailed;
    }

    /*//////////////////////////////////////////////////////////////
                        ERC-20 STABLECOIN TRANSFERS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Transfers ERC-20 tokens (USDC / USDT) to a single recipient.
     * @param token   The ERC-20 token contract address.
     * @param to      The recipient address.
     * @param amount  The amount in token's smallest unit.
     */
    function transferERC20(address token, address to, uint256 amount)
        external
        nonReentrant
        onlyEntryPointOrOwner
    {
        _checkCommitment(token, amount);
        IERC20(token).safeTransfer(to, amount);
        emit ERC20Transferred(token, to, amount);
    }

    /**
     * @notice Batch transfers ERC-20 tokens to multiple recipients in a single tx.
     * @param token      The ERC-20 token contract address.
     * @param recipients Recipient addresses.
     * @param amounts    Amounts per recipient (smallest unit).
     */
    function batchTransferERC20(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external nonReentrant onlyEntryPointOrOwner {
        if (recipients.length == 0 || recipients.length != amounts.length) revert SmartWallet__InvalidBatchInput();
        uint256 totalAmount = 0;
        for (uint256 i; i < amounts.length; i++) totalAmount += amounts[i];
        _checkCommitment(token, totalAmount);

        for (uint256 i; i < recipients.length; i++) {
            IERC20(token).safeTransfer(recipients[i], amounts[i]);
            emit ERC20Transferred(token, recipients[i], amounts[i]);
        }
    }

    /*//////////////////////////////////////////////////////////////
                     ON-CHAIN COMPLIANCE RECORDING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Records an AES-256 encrypted compliance payload directly on Ethereum Sepolia.
     * @dev The payload bytes are opaque to the chain — encrypted client-side before submission.
     *      The txHash links this record deterministically to the payment transaction.
     * @param txHash        Deterministic hash of the payment tx or intent ID.
     * @param recipients    Recipient addresses (plaintext — already public from payment).
     * @param amounts       Amounts per recipient (plaintext).
     * @param encryptedPayload  AES-256 ciphertext of the compliance metadata (categories + jurisdictions + reference IDs).
     */
    function recordCompliance(
        bytes32 txHash,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes calldata encryptedPayload
    ) external onlyEntryPointOrOwner {
        IComplianceRegistry(COMPLIANCE_REGISTRY).recordTransaction(
            txHash,
            address(this),
            recipients,
            amounts,
            encryptedPayload
        );
        emit ComplianceRecorded(txHash);
    }

    /*//////////////////////////////////////////////////////////////
                              VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getAvailableBalance(address token) public view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance - sCommittedFunds[address(0)];
        } else {
            return IERC20(token).balanceOf(address(this)) - sCommittedFunds[token];
        }
    }

    /**
     * @notice Returns the address of the EntryPoint v0.7.
     */
    function entryPoint() public pure returns (address) {
        return 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    }

    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4) {
        address recovered = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(hash), signature);
        if (recovered == sOwner) return _EIP1271_MAGICVALUE;
        return bytes4(0);
    }

    /*//////////////////////////////////////////////////////////////
                            INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    function _checkCommitment(address token, uint256 value) internal view {
        if (value > 0) {
            if (token == address(0)) {
                uint256 preExistingBalance = address(this).balance - msg.value;
                if (value > msg.value) {
                    uint256 neededFromWallet = value - msg.value;
                    if (neededFromWallet > preExistingBalance - sCommittedFunds[address(0)]) {
                        revert SmartWallet__InsufficientUncommittedFunds();
                    }
                }
            } else {
                if (value > IERC20(token).balanceOf(address(this)) - sCommittedFunds[token]) {
                    revert SmartWallet__InsufficientUncommittedFunds();
                }
            }
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly ("memory-safe") {
                revert(add(result, 32), mload(result))
            }
        }
    }

    receive() external payable {}
    fallback() external payable {}
}
