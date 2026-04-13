// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IComplianceRegistry
 * @notice Interface for the on-chain ComplianceRegistry deployed on HashKey Chain.
 *         Stores AES-256 encrypted compliance payloads linked to payment transactions.
 * @custom:security-contact zionlivingstone4@gmail.com
 */
interface IComplianceRegistry {
    /**
     * @notice Allows the owner to authorize/deauthorize a caller (like IntentRegistry).
     * @param caller The address to authorize.
     * @param authorized Whether the address is authorized.
     */
    function setAuthorizedCaller(address caller, bool authorized) external;

    /**
     * @notice Registers a SmartWallet proxy to its master EOA.
     * @dev Called by SmartWalletFactory at account creation. The proxy is identified by
     *      proxyAccount (not msg.sender) so the factory can pass both addresses.
     * @param proxyAccount The newly deployed SmartWallet clone.
     * @param masterEOA    The personal wallet (MetaMask) that owns the proxy.
     */
    function registerAccount(address proxyAccount, address masterEOA) external;

    /**
     * @notice Records an encrypted compliance payload for a payment.
     * @param txHash           Deterministic hash linking to the payment tx or intent ID.
     * @param proxyAccount     The SmartWallet that executed the payment.
     * @param recipients       Recipient addresses (plaintext).
     * @param amounts          Amounts per recipient (plaintext).
     * @param encryptedPayload AES-256 ciphertext of compliance metadata (including per-recipient Reference IDs).
     */
    function recordTransaction(
        bytes32 txHash,
        address proxyAccount,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes calldata encryptedPayload
    ) external;
}
