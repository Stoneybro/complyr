// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMpSmartWallet
 * @author stoneybro
 * @notice Interface for Mp Smart Wallet that the Intent Registry interacts with
 * @custom:security-contact stoneybrocrypto@gmail.com
 */
interface IMpSmartWallet {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice Jurisdiction codes for compliance tracking
    enum Jurisdiction {
        NONE,
        US_CA,
        US_NY,
        US_TX,
        US_FL,
        US_OTHER,
        UK,
        EU_DE,
        EU_FR,
        EU_OTHER,
        NG,
        SG,
        AE,
        OTHER
    }

    /// @notice Compliance categories for payment classification
    enum Category {
        NONE,
        PAYROLL_W2,
        PAYROLL_1099,
        CONTRACTOR,
        BONUS,
        INVOICE,
        VENDOR,
        GRANT,
        DIVIDEND,
        REIMBURSEMENT,
        OTHER
    }

    /// @notice Universal compliance metadata for jurisdiction-aware payment tracking
    /// @dev All array fields MUST match recipients.length for batch/recurring payments
    struct ComplianceMetadata {
        string[] entityIds;
        Jurisdiction[] jurisdictions;
        Category[] categories;
        string referenceId;
    }

    /*//////////////////////////////////////////////////////////////
                                FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Increases the committed funds for intents.
     * @param token The token address (address(0) for ETH).
     * @param amount The amount to add to committed funds.
     */
    function increaseCommitment(address token, uint256 amount) external;

    /**
     * @notice Decreases the committed funds after intent execution/cancellation.
     * @param token The token address (address(0) for ETH).
     * @param amount The amount to subtract from committed funds.
     */
    function decreaseCommitment(address token, uint256 amount) external;

    /**
     * @notice Executes a batch of transfers as part of an Mp intent.
     * @param token The token address (address(0) for ETH, token address for ERC20).
     * @param recipients The array of recipient addresses.
     * @param amounts The array of amounts corresponding to each recipient.
     * @param intentId The unique identifier for the intent being executed.
     * @param transactionCount The current transaction number within the intent.
     * @param revertOnFailure Whether to revert entire transaction on any failure.
     * @param compliance Compliance metadata for tracking.
     * @return failedAmount The total amount that failed to transfer (only in skip mode)
     */
    function executeBatchIntentTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 intentId,
        uint256 transactionCount,
        bool revertOnFailure,
        ComplianceMetadata calldata compliance
    ) external returns (uint256 failedAmount);

    /**
     * @notice Returns the available (uncommitted) balance for a specific token.
     * @param token The token address (address(0) for ETH, token address for ERC20).
     * @return The available balance.
     */
    function getAvailableBalance(address token) external view returns (uint256);
}
