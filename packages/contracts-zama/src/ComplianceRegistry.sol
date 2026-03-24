// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "encrypted-types/EncryptedTypes.sol";

/**
 * @title ComplianceRegistry
 * @author stoneybro
 * @notice B2B multi-tenant compliance ledger for Flow Smart Accounts.
 * @dev Stores an immutable, isolated ledger of compliance metadata for each Flow smart proxy.
 *      Uses fhEVM `einput` pre-encrypted bytes to ensure no plaintext is ever leaked to the mempool.
 *      Validates Zero-Knowledge Proofs within the Zama Coprocessor via `FHE.asEuint8`.
 *
 * @custom:security-contact stoneybrocrypto@gmail.com
 */
contract ComplianceRegistry is Ownable {
    using FHE for *;

    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice A compliant record for a specific business outgoing payment.
    struct TransactionRecord {
        /// @notice The correlated transaction hash from Flow EVM.
        bytes32 flowTxHash;
        /// @notice The total transaction amounts per recipient (plaintext).
        uint256[] amounts;
        /// @notice Recipients in the batch transfer (plaintext).
        address[] recipients;
        /// @notice Encrypted category (e.g., 1=Payroll, 2=Contractor, 3=Bonus).
        euint8 category;
        /// @notice Encrypted recipient jurisdiction code (e.g., 1=US, 2=EU).
        euint8 recipientJurisdiction;
        /// @notice Timestamp of the compliance record.
        uint256 timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Mapping from Flow Proxy Account to its private ledger of compliance records.
    mapping(address => TransactionRecord[]) private companyLedgers;

    /// @notice Defines the Master EOA (wallet like MetaMask) that owns the Flow Proxy.
    mapping(address => address) public companyMasters;

    /// @notice Tracks active auditors for a company. (proxyAccount => auditor => isActive)
    mapping(address => mapping(address => bool)) public isAuditorActive;

    /// @notice A list of all auditors for iteration.
    mapping(address => address[]) public companyAuditors;

    /// @notice Count of total records across all companies.
    uint256 public totalGlobalRecords;

    /// @notice The LayerZero Receiver contract authorized to insert records.
    address public lzReceiver;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event CompanyRegistered(address indexed proxyAccount, address indexed masterEOA);
    event AuditorAdded(address indexed proxyAccount, address indexed auditor);
    event AuditorRemoved(address indexed proxyAccount, address indexed auditor);

    /// @notice Emitted when a new compliance record is appended to a company's ledger.
    event RecordAppended(
        address indexed proxyAccount, bytes32 indexed flowTxHash, uint256 timestamp
    );

    /// @notice Emitted when the approved LayerZero receiver is updated.
    event ReceiverUpdated(address indexed receiver);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error ComplianceRegistry__NotAuthorized();
    error ComplianceRegistry__ZeroAddress();
    error ComplianceRegistry__AlreadyRegistered();
    error ComplianceRegistry__NotRegistered();
    error ComplianceRegistry__AuditorAlreadyExists();

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    /// @notice Only the trusted LayerZero receiver can append records from Flow
    modifier onlyLzReceiver() {
        if (msg.sender != lzReceiver) {
            revert ComplianceRegistry__NotAuthorized();
        }
        _;
    }

    /// @notice Only the registered Master EOA can manage auditors directly on Sepolia
    modifier onlyMasterEOA(address proxyAccount) {
        if (msg.sender != companyMasters[proxyAccount]) {
            revert ComplianceRegistry__NotAuthorized();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() Ownable(msg.sender) {}

    /*//////////////////////////////////////////////////////////////
                     COMPANY MANAGEMENT FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Link the LayerZero receiver OApp.
     */
    function setLzReceiver(address _receiver) external onlyOwner {
        if (_receiver == address(0)) revert ComplianceRegistry__ZeroAddress();
        lzReceiver = _receiver;
        emit ReceiverUpdated(_receiver);
    }

    /**
     * @notice Registers a company's Proxy Account to its Master EOA.
     * @dev Only callable by the established LayerZero cross-chain pipeline from Flow.
     * @param proxyAccount The business' smart account on Flow EVM.
     * @param masterEOA The personal wallet (MetaMask) that owns the proxy.
     */
    function registerCompany(address proxyAccount, address masterEOA) external onlyLzReceiver {
        if (companyMasters[proxyAccount] != address(0)) {
            revert ComplianceRegistry__AlreadyRegistered();
        }
        if (proxyAccount == address(0) || masterEOA == address(0)) {
            revert ComplianceRegistry__ZeroAddress();
        }

        companyMasters[proxyAccount] = masterEOA;
        emit CompanyRegistered(proxyAccount, masterEOA);
    }

    /**
     * @notice Adds an auditor to a company's compliance ledger.
     * @dev Called directly on the Sepolia chain by the Master EOA.
     * @param proxyAccount The business' smart account on Flow EVM.
     * @param newAuditor The wallet address of the new auditor.
     */
    function addAuditor(address proxyAccount, address newAuditor) external onlyMasterEOA(proxyAccount) {
        if (newAuditor == address(0)) revert ComplianceRegistry__ZeroAddress();
        if (isAuditorActive[proxyAccount][newAuditor]) revert ComplianceRegistry__AuditorAlreadyExists();
        if (companyAuditors[proxyAccount].length >= 3) revert("Max 3 auditors");

        isAuditorActive[proxyAccount][newAuditor] = true;
        companyAuditors[proxyAccount].push(newAuditor);

        emit AuditorAdded(proxyAccount, newAuditor);
    }

    /**
     * @notice Removes an auditor from a company's compliance ledger.
     * @dev Called directly on the Sepolia chain by the Master EOA.
     * @param proxyAccount The business' smart account on Flow EVM.
     * @param auditor The wallet address of the auditor to remove.
     */
    function removeAuditor(address proxyAccount, address auditor) external onlyMasterEOA(proxyAccount) {
        // We only deactivate them. They cannot view future records, but Zama fhEVM
        // permanently allowed them on past records.
        isAuditorActive[proxyAccount][auditor] = false;
        
        // Remove from the array efficiently by swapping with the last element
        address[] storage auditors = companyAuditors[proxyAccount];
        for (uint256 i = 0; i < auditors.length; i++) {
            if (auditors[i] == auditor) {
                auditors[i] = auditors[auditors.length - 1];
                auditors.pop();
                break;
            }
        }

        emit AuditorRemoved(proxyAccount, auditor);
    }

    /*//////////////////////////////////////////////////////////////
                          TRANSACTION RECORDING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Appends a compliance record to a company's ledger.
     * @dev Accepts `einput` ciphertexts generated securely in the frontend.
     *      No plaintext is exposed to the mempool. Automatically grants
     *      Access Control List (ACL) permissions to the Master EOA and ALL active auditors.
     *
     * @param flowTxHash The transaction hash from Flow EVM.
     * @param proxyAccount The Flow Smart Account that initiated the payment.
     * @param amount The native token transaction amount.
     * @param recipientCount Number of recipients in the batch transfer.
     * @param categoryHandle The Zama EIP-712 pre-encrypted ciphertext handle.
     * @param categoryProof The Zama Zero Knowledge Proof.
     * @param jurisdictionHandle The Zama EIP-712 pre-encrypted ciphertext handle.
     * @param jurisdictionProof The Zama Zero Knowledge Proof.
     */
    function recordTransaction(
        bytes32 flowTxHash,
        address proxyAccount,
        address[] memory recipients,
        uint256[] memory amounts,
        externalEuint8 categoryHandle,
        bytes calldata categoryProof,
        externalEuint8 jurisdictionHandle,
        bytes calldata jurisdictionProof
    ) external onlyLzReceiver {
        
        address masterEOA = companyMasters[proxyAccount];
        if (masterEOA == address(0)) revert ComplianceRegistry__NotRegistered();

        // 1. Verify the ZKPs and convert the frontend bytes into fhEVM ciphertext handles
        euint8 catHandle = FHE.fromExternal(categoryHandle, categoryProof);
        euint8 jurHandle = FHE.fromExternal(jurisdictionHandle, jurisdictionProof);

        // 2. Grant ACL permissions to the Master EOA
        catHandle = FHE.allowThis(catHandle);
        catHandle = FHE.allow(catHandle, masterEOA);

        jurHandle = FHE.allowThis(jurHandle);
        jurHandle = FHE.allow(jurHandle, masterEOA);

        // 3. Grant ACL permissions to all active Auditors
        address[] memory auditors = companyAuditors[proxyAccount];
        for (uint256 i = 0; i < auditors.length; i++) {
            address activeAuditor = auditors[i];
            catHandle = FHE.allow(catHandle, activeAuditor);
            jurHandle = FHE.allow(jurHandle, activeAuditor);
        }

        // 4. Store the record in the company's private ledger
        companyLedgers[proxyAccount].push(
            TransactionRecord({
                flowTxHash: flowTxHash,
                amounts: amounts,
                recipients: recipients,
                category: catHandle,
                recipientJurisdiction: jurHandle,
                timestamp: block.timestamp
            })
        );

        totalGlobalRecords++;

        emit RecordAppended(proxyAccount, flowTxHash, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                            VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Returns the number of records a company has.
     * @param proxyAccount The Flow Smart Account address.
     */
    function getCompanyRecordCount(address proxyAccount) external view returns (uint256) {
        return companyLedgers[proxyAccount].length;
    }

    /**
     * @notice Returns the plaintext metadata for a specific record.
     */
    function getRecordMetadata(address proxyAccount, uint256 index)
        external
        view
        returns (bytes32 flowTxHash, address[] memory recipients, uint256[] memory amounts, uint256 timestamp)
    {
        TransactionRecord storage record = companyLedgers[proxyAccount][index];
        return (record.flowTxHash, record.recipients, record.amounts, record.timestamp);
    }

    /**
     * @notice Returns the encrypted category handle for a specific record.
     * @dev The caller (fhevmjs) must provide an EIP-712 signature matching the Master or Auditor to decrypt.
     */
    function getEncryptedCategory(address proxyAccount, uint256 index) external view returns (euint8) {
        return companyLedgers[proxyAccount][index].category;
    }

    /**
     * @notice Returns the encrypted jurisdiction handle for a specific record.
     */
    function getEncryptedJurisdiction(address proxyAccount, uint256 index) external view returns (euint8) {
        return companyLedgers[proxyAccount][index].recipientJurisdiction;
    }
}
