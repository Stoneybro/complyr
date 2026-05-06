// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "encrypted-types/EncryptedTypes.sol";

/**
 * @title ISmartWallet
 * @author zion livingstone
 * @notice Interface for Smart Wallet that the Intent Registry interacts with.
 * @custom:security-contact zionlivingstone4@gmail.com
 */
interface ISmartWallet {
    /*//////////////////////////////////////////////////////////////
                                FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Increases the committed funds for intents.
     * @param token  The token address (address(0) for native ETH).
     * @param amount The amount to add to committed funds.
     */
    function increaseCommitment(address token, uint256 amount) external;

    /**
     * @notice Decreases the committed funds after intent execution/cancellation.
     * @param token  The token address (address(0) for native ETH).
     * @param amount The amount to subtract from committed funds.
     */
    function decreaseCommitment(address token, uint256 amount) external;

    /**
     * @notice Executes a batch of transfers as part of an intent.
     * @param token            The token address (address(0) for native ETH).
     * @param recipients       The array of recipient addresses.
     * @param amounts          The array of amounts corresponding to each recipient.
     * @param intentId         The unique identifier for the intent being executed.
     * @param transactionCount The current transaction number within the intent.
     * @return failedAmount    The total amount that failed to transfer (in skip mode)
     */
    function executeBatchIntentTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 intentId,
        uint256 transactionCount
    ) external returns (uint256 failedAmount);

    /**
     * @notice Returns the available (uncommitted) balance for a specific token.
     * @param token The token address (address(0) for native ETH).
     * @return The available balance.
     */
    function getAvailableBalance(address token) external view returns (uint256);

    /**
     * @notice Records Zama encrypted audit data directly on Ethereum Sepolia.
     */
    function recordAudit(
        bytes32 txHash,
        address token,
        address[] calldata recipients,
        externalEuint128[] calldata amountHandles,
        bytes[] calldata amountProofs,
        externalEuint8[] calldata categoryHandles,
        bytes[] calldata categoryProofs,
        externalEuint8[] calldata jurisdictionHandles,
        bytes[] calldata jurisdictionProofs,
        string[] calldata referenceIds
    ) external;
}
