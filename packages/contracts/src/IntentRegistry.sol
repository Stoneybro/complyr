// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ISmartWallet} from "./ISmartWallet.sol";
import {IAuditRegistry} from "./IAuditRegistry.sol";

import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import "encrypted-types/EncryptedTypes.sol";

/**
 * @title Intent Registry
 * @author zion Livingstone
 * @notice Central registry for managing automated payment intents across all wallets.
 * @dev Integrates with Chainlink Automation for decentralized intent execution. Supports ERC-20 tokens.
 * @custom:security-contact zionlivingstone4@gmail.com
 */
contract IntentRegistry is ReentrancyGuard, AutomationCompatibleInterface {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/
    struct Intent {
        /// @notice The unique identifier for this intent
        bytes32 id;
        /// @notice The wallet that owns this intent
        address wallet;
        /// @notice The name of the intent
        string name;
        /// @notice The token to transfer (address(0) for native ETH)
        address token;
        /// @notice The recipients of the intent
        address[] recipients;
        /// @notice The amounts per recipient per transaction
        uint256[] amounts;
        /// @notice The current transaction count
        uint256 transactionCount;
        /// @notice The final total transaction count
        uint256 totalTransactionCount;
        /// @notice The interval between transactions in seconds
        uint256 interval;
        /// @notice The start time of the transaction schedule
        uint256 transactionStartTime;
        /// @notice The end time of the transaction schedule
        uint256 transactionEndTime;
        /// @notice The latest transaction execution time
        uint256 latestTransactionTime;
        /// @notice Whether the intent is active
        bool active;
        /// @notice Total amount that failed to transfer (for recovery)
        uint256 failedAmount;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The owner for admin functions
    address public owner;

    /// @notice Address of the AuditRegistry for logging
    address public auditRegistry;

    /// @notice The list of registered wallets
    address[] public registeredWallets;

    /// @notice Whether the wallet is registered
    mapping(address => bool) public isWalletRegistered;

    /// @notice The intents per wallet
    mapping(address => mapping(bytes32 => Intent)) public walletIntents;

    /// @notice The active intent ids per wallet
    mapping(address => bytes32[]) public walletActiveIntentIds;

    /// @notice A counter used to generate unique intent ids
    uint256 public intentCounter;

    /// @notice Maximum number of recipients allowed per intent
    uint256 public constant MAX_RECIPIENTS = 10;

    /// @notice Minimum interval between transactions (30 seconds)
    uint256 public constant MIN_INTERVAL = 30;

    /// @notice Maximum intent duration (1 year in seconds)
    uint256 public constant MAX_DURATION = 365 days;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice The event emitted when an intent is created
    event IntentCreated(
        address indexed wallet,
        bytes32 indexed intentId,
        string name,
        address indexed token,
        uint256 totalCommitment,
        uint256 totalTransactionCount,
        uint256 interval,
        uint256 duration,
        uint256 transactionStartTime,
        uint256 transactionEndTime,
        address[] recipients,
        uint256[] amounts
    );

    /// @notice The event emitted when an intent is executed
    event IntentExecuted(
        address indexed wallet, bytes32 indexed intentId, string name, uint256 transactionCount, uint256 totalAmount
    );

    /// @notice The event emitted when an intent is cancelled
    event IntentCancelled(
        address indexed wallet,
        bytes32 indexed intentId,
        string name,
        uint256 amountRefunded,
        uint256 failedAmountRecovered
    );

    /// @notice The event emitted when a wallet is registered
    event WalletRegistered(address indexed wallet);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when no recipients are provided
    error IntentRegistry__NoRecipients();

    /// @notice Thrown when a recipient address is zero
    error IntentRegistry__InvalidRecipient();

    /// @notice Thrown when recipients and amounts arrays have different lengths
    error IntentRegistry__ArrayLengthMismatch();

    /// @notice Thrown when number of recipients exceeds maximum allowed
    error IntentRegistry__TooManyRecipients();

    /// @notice Thrown when duration is zero or exceeds maximum
    error IntentRegistry__InvalidDuration();

    /// @notice Thrown when interval is below minimum
    error IntentRegistry__InvalidInterval();

    /// @notice Thrown when an amount is zero or negative
    error IntentRegistry__InvalidAmount();

    /// @notice Thrown when total transaction count is zero
    error IntentRegistry__InvalidTotalTransactionCount();

    /// @notice Thrown when wallet has insufficient funds
    error IntentRegistry__InsufficientFunds();

    /// @notice Thrown when trying to execute an inactive intent
    error IntentRegistry__IntentNotActive();

    /// @notice Thrown when intent conditions are not met for execution
    error IntentRegistry__IntentNotExecutable();

    /// @notice Thrown when the caller is not the wallet owner
    error IntentRegistry__Unauthorized();

    /// @notice Thrown when transaction start time is in the past
    error IntentRegistry__StartTimeInPast();

    /// @notice Thrown when intent not found for wallet
    error IntentRegistry__IntentNotFound();

    /// @notice Thrown when required audit metadata is missing
    error IntentRegistry__MissingAuditInfo();

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    constructor(address _initialOwner) {
        owner = _initialOwner;
    }

    function setAuditRegistry(address _registry) external {
        if (msg.sender != owner) revert IntentRegistry__Unauthorized();
        auditRegistry = _registry;
    }

    /// @notice Receive native funds from proxy accounts.
    receive() external payable {}

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new multi-recipient intent for the sender/wallet.
     * @param name The name of the intent
     * @param token The token address (address(0) for native ETH)
     * @param recipients The array of recipient addresses
     * @param amounts The array of amounts corresponding to each recipient
     * @param duration The total duration of the intent in seconds
     * @param interval The interval between transactions in seconds
     * @param transactionStartTime The start time of the transaction (0 for immediate start)
     * @return intentId The unique identifier for the created intent
     */
    function createIntent(
        string memory name,
        address token,
        address[] memory recipients,
        uint256[] memory amounts,
        uint256 duration,
        uint256 interval,
        uint256 transactionStartTime,
        externalEuint128[] calldata encryptedAmountHandles,
        bytes[] calldata encryptedAmountProofs,
        externalEuint8[] calldata encryptedCategoryHandles,
        bytes[] calldata encryptedCategoryProofs,
        externalEuint8[] calldata encryptedJurisdictionHandles,
        bytes[] calldata encryptedJurisdictionProofs,
        string[] calldata referenceIds
    ) external returns (bytes32) {
        address wallet = msg.sender;

        ///@notice When a wallet tries to create an intent for the first time, it is registered
        if (!isWalletRegistered[wallet]) {
            registeredWallets.push(wallet);
            isWalletRegistered[wallet] = true;
            emit WalletRegistered(wallet);
        }

        ///@notice Validate recipients and amounts arrays
        if (recipients.length == 0) revert IntentRegistry__NoRecipients();
        if (recipients.length != amounts.length) revert IntentRegistry__ArrayLengthMismatch();
        if (recipients.length > MAX_RECIPIENTS) revert IntentRegistry__TooManyRecipients();

        if (
            recipients.length != encryptedAmountHandles.length || recipients.length != encryptedAmountProofs.length
                || recipients.length != encryptedCategoryHandles.length || recipients.length != encryptedCategoryProofs.length
                || recipients.length != encryptedJurisdictionHandles.length
                || recipients.length != encryptedJurisdictionProofs.length || recipients.length != referenceIds.length
        ) revert IntentRegistry__ArrayLengthMismatch();

        ///@notice Validate timing parameters
        if (duration == 0 || duration > MAX_DURATION) revert IntentRegistry__InvalidDuration();
        if (interval < MIN_INTERVAL) revert IntentRegistry__InvalidInterval();

        ///@notice Validate start time is not in the past (unless it's 0 for immediate start)
        if (transactionStartTime != 0 && transactionStartTime < block.timestamp) {
            revert IntentRegistry__StartTimeInPast();
        }

        ///@notice Calculate total amount per execution and validate each recipient/amount
        uint256 totalAmountPerExecution = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert IntentRegistry__InvalidRecipient();
            if (amounts[i] == 0) revert IntentRegistry__InvalidAmount();
            if (bytes(referenceIds[i]).length == 0) revert IntentRegistry__MissingAuditInfo();
            totalAmountPerExecution += amounts[i];
        }

        ///@notice Calculate projected final transaction count
        uint256 totalTransactionCount = duration / interval;
        if (totalTransactionCount == 0) revert IntentRegistry__InvalidTotalTransactionCount();

        ///@notice Calculate total commitment across all executions
        uint256 totalCommitment = totalAmountPerExecution * totalTransactionCount;

        ///@notice Check if the wallet has enough available funds to cover the intent
        uint256 availableBalance = ISmartWallet(wallet).getAvailableBalance(token);
        if (availableBalance < totalCommitment) {
            revert IntentRegistry__InsufficientFunds();
        }

        ///@notice Generate a unique intent id using abi.encode to prevent collision
        bytes32 intentId = keccak256(abi.encode(wallet, recipients, amounts, block.timestamp, intentCounter++));

        ///@notice Calculate actual start and end times
        uint256 actualStartTime = transactionStartTime == 0 ? block.timestamp : transactionStartTime;
        uint256 actualEndTime = actualStartTime + duration;

        ///@notice Store the intent
        walletIntents[wallet][intentId] = Intent({
            id: intentId,
            wallet: wallet,
            name: name,
            token: token,
            recipients: recipients,
            amounts: amounts,
            transactionCount: 0,
            totalTransactionCount: totalTransactionCount,
            interval: interval,
            transactionStartTime: actualStartTime,
            transactionEndTime: actualEndTime,
            latestTransactionTime: 0,
            active: true,
            failedAmount: 0
        });

        ///@notice Update the wallet's committed funds for this token
        ISmartWallet(wallet).increaseCommitment(token, totalCommitment);

        ///@notice Add the intent id to the wallet's active intent ids
        walletActiveIntentIds[wallet].push(intentId);

        ///@notice Send audit data to AuditRegistry once at creation
        if (auditRegistry != address(0)) {
            IAuditRegistry(auditRegistry).recordTransaction(
                intentId,
                wallet,
                token,
                recipients,
                encryptedAmountHandles,
                encryptedAmountProofs,
                encryptedCategoryHandles,
                encryptedCategoryProofs,
                encryptedJurisdictionHandles,
                encryptedJurisdictionProofs,
                referenceIds
            );
        }

        emit IntentCreated(
            wallet,
            intentId,
            name,
            token,
            totalCommitment,
            totalTransactionCount,
            interval,
            duration,
            actualStartTime,
            actualEndTime,
            recipients,
            amounts
        );
        return intentId;
    }

    /**
     * @notice Chainlink Automation calls this to check if any intents need execution.
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    )
        external
        view
        returns (bool upkeepNeeded, bytes memory performData)
    {
        if (registeredWallets.length == 0) return (false, bytes(""));

        for (uint256 i = 0; i < registeredWallets.length; i++) {
            address wallet = registeredWallets[i];
            bytes32[] memory activeIntents = walletActiveIntentIds[wallet];

            for (uint256 j = 0; j < activeIntents.length; j++) {
                bytes32 intentId = activeIntents[j];
                Intent storage intent = walletIntents[wallet][intentId];

                if (shouldExecuteIntent(intent)) {
                    return (true, abi.encode(wallet, intentId));
                }
            }
        }

        return (false, bytes(""));
    }

    /**
     * @notice Chainlink Automation calls this to execute an intent.
     */
    function performUpkeep(bytes calldata performData) external {
        (address wallet, bytes32 intentId) = abi.decode(performData, (address, bytes32));
        executeIntent(wallet, intentId);
    }

    /**
     * @notice Checks if an intent should be executed based on its conditions
     */
    function shouldExecuteIntent(Intent storage intent) internal view returns (bool) {
        if (!intent.active) return false;
        if (block.timestamp < intent.transactionStartTime) return false;
        if (intent.transactionCount >= intent.totalTransactionCount) return false;
        if (intent.latestTransactionTime != 0 && block.timestamp < intent.latestTransactionTime + intent.interval) {
            return false;
        }

        ///@notice Calculate total amount needed for this execution
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < intent.amounts.length; i++) {
            totalAmount += intent.amounts[i];
        }

        ///@notice Check if the wallet has enough funds.
        ///@dev Available balance = Total balance - Committed funds.
        ///     Since this intent's funds are ALREADY committed, we can safely execute
        ///     as long as we don't exceed the wallet's total balance.
        ///     However, to be strict, we check if the intent has enough *remaining commitment*
        ///     to cover this execution (which it should by design).
        uint256 remainingTransactions = intent.totalTransactionCount - intent.transactionCount;
        if (remainingTransactions == 0) return false;

        return true;
    }

    /**
     * @notice Executes an intent by transferring funds to all recipients.
     */
    function executeIntent(address wallet, bytes32 intentId) internal nonReentrant {
        Intent storage intent = walletIntents[wallet][intentId];

        if (intent.id != intentId || intent.wallet != wallet) {
            revert IntentRegistry__IntentNotFound();
        }
        if (!intent.active) revert IntentRegistry__IntentNotActive();
        if (!shouldExecuteIntent(intent)) revert IntentRegistry__IntentNotExecutable();

        uint256 currentTransactionCount = intent.transactionCount;
        intent.transactionCount++;
        intent.latestTransactionTime = block.timestamp;

        if (intent.transactionCount >= intent.totalTransactionCount) {
            intent.active = false;
            _removeFromActiveIntents(wallet, intentId);
        }

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < intent.amounts.length; i++) {
            totalAmount += intent.amounts[i];
        }

        ///@notice Decrease the wallet's committed funds for this execution
        ISmartWallet(wallet).decreaseCommitment(intent.token, totalAmount);

        ///@notice Execute the batch transfer
        uint256 failedAmount = ISmartWallet(wallet)
            .executeBatchIntentTransfer(
                intent.token,
                intent.recipients,
                intent.amounts,
                intentId,
                currentTransactionCount
            );

        if (failedAmount > 0) {
            intent.failedAmount += failedAmount;
        }

        emit IntentExecuted(wallet, intentId, intent.name, currentTransactionCount, totalAmount);
    }

    /**
     * @notice Removes an intent from the wallet's active intent ids array
     */
    function _removeFromActiveIntents(address wallet, bytes32 intentId) internal {
        bytes32[] storage activeIntents = walletActiveIntentIds[wallet];
        bool found = false;

        for (uint256 i = 0; i < activeIntents.length; i++) {
            if (activeIntents[i] == intentId) {
                activeIntents[i] = activeIntents[activeIntents.length - 1];
                activeIntents.pop();
                found = true;
                break;
            }
        }
        if (!found) {}
    }

    /**
     * @notice Allows wallet owner to cancel an active intent
     */
    function cancelIntent(bytes32 intentId) external {
        address wallet = msg.sender;
        Intent storage intent = walletIntents[wallet][intentId];

        if (intent.id != intentId || intent.wallet != wallet) {
            revert IntentRegistry__IntentNotFound();
        }
        if (!intent.active) revert IntentRegistry__IntentNotActive();

        uint256 totalAmountPerExecution = 0;
        for (uint256 i = 0; i < intent.amounts.length; i++) {
            totalAmountPerExecution += intent.amounts[i];
        }

        uint256 amountRemaining = 0;
        if (intent.transactionCount < intent.totalTransactionCount) {
            uint256 remainingTransactions = intent.totalTransactionCount - intent.transactionCount;
            amountRemaining = remainingTransactions * totalAmountPerExecution;
        }

        uint256 failedAmountToRecover = intent.failedAmount;

        ///@notice Unlock funds when the intent is cancelled
        if (amountRemaining > 0) {
            ISmartWallet(wallet).decreaseCommitment(intent.token, amountRemaining);
        }

        intent.active = false;
        intent.failedAmount = 0;
        _removeFromActiveIntents(wallet, intentId);

        emit IntentCancelled(wallet, intentId, intent.name, amountRemaining, failedAmountToRecover);
    }

    function getIntent(address wallet, bytes32 intentId) external view returns (Intent memory) {
        return walletIntents[wallet][intentId];
    }

    function getActiveIntents(address wallet) external view returns (bytes32[] memory) {
        return walletActiveIntentIds[wallet];
    }

    function getRegisteredWalletsCount() external view returns (uint256) {
        return registeredWallets.length;
    }
}
