// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {euint8} from "@fhevm/solidity/lib/FHE.sol";

/**
 * @title ISmartWallet
 * @author complyr
 * @notice Interface for Smart Wallet that the Intent Registry interacts with.
 */
interface ISmartWallet {
    /*//////////////////////////////////////////////////////////////
                                FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function increaseCommitment(address token, uint256 amount) external;

    function decreaseCommitment(address token, uint256 amount) external;

    function executeBatchIntentTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 intentId,
        uint256 transactionCount
    ) external returns (uint256 failedAmount);

    function getAvailableBalance(address token) external view returns (uint256);

    /**
     * @notice Records an FHE-encrypted compliance payload directly on Sepolia.
     * @param txHash        Correlation ID for the payment.
     * @param recipients    Recipient addresses.
     * @param amounts       Amounts per recipient.
     * @param categories    FHE encrypted categories (euint8 handles).
     * @param jurisdictions FHE encrypted jurisdictions (euint8 handles).
     */
    function recordCompliance(
        bytes32 txHash,
        address[] calldata recipients,
        uint256[] calldata amounts,
        euint8[] calldata categories,
        euint8[] calldata jurisdictions
    ) external;
}
