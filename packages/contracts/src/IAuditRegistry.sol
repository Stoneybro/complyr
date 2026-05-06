// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "encrypted-types/EncryptedTypes.sol";

/**
 * @title IAuditRegistry
 * @notice Interface for the Zama FHE audit ledger on Ethereum Sepolia.
 * @custom:security-contact zionlivingstone4@gmail.com
 */
interface IAuditRegistry {
    function setAuthorizedCaller(address caller, bool authorized) external;

    function registerAccount(address proxyAccount, address masterEOA) external;

    function recordTransaction(
        bytes32 txHash,
        address proxyAccount,
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
