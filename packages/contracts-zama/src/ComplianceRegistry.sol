// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "encrypted-types/EncryptedTypes.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

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
contract ComplianceRegistry is Ownable, ZamaEthereumConfig {
    using FHE for *;

    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice A compliant record for a specific business outgoing payment.
    struct TransactionRecord {
        /// @notice The correlated transaction hash / intent ID from Flow EVM.
        bytes32 flowTxHash;
        /// @notice The total transaction amounts per recipient (plaintext).
        uint256[] amounts;
        /// @notice Recipients in the batch transfer (plaintext).
        address[] recipients;
        /// @notice One encrypted category per recipient (e.g., 1=Payroll, 2=Contractor, 3=Bonus).
        euint8[] categories;
        /// @notice One encrypted jurisdiction code per recipient (e.g., 1=US, 2=EU).
        euint8[] jurisdictions;
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

    event AccountRegistered(address indexed proxyAccount, address indexed masterEOA);
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

    constructor(address _initialOwner) Ownable(_initialOwner) {}

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
    function registerAccount(address proxyAccount, address masterEOA) external onlyLzReceiver {
        if (companyMasters[proxyAccount] != address(0)) {
            revert ComplianceRegistry__AlreadyRegistered();
        }
        if (proxyAccount == address(0) || masterEOA == address(0)) {
            revert ComplianceRegistry__ZeroAddress();
        }

        companyMasters[proxyAccount] = masterEOA;
        emit AccountRegistered(proxyAccount, masterEOA);
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

        // Retroactively grant FHE decryption access for all PAST transactions.
        // Because the contract called FHE.allowThis() upon storing the records, the contract 
        // itself has the authority to update the FHE ACL handle for the ciphertext.
        TransactionRecord[] storage ledger = companyLedgers[proxyAccount];
        for (uint256 i = 0; i < ledger.length; i++) {
            for (uint256 j = 0; j < ledger[i].categories.length; j++) {
                // Note: Looping is safe for a hackathon demo but in production, 
                // this would be structured with pagination/batching to prevent block gas limit issues.
                ledger[i].categories[j] = FHE.allow(ledger[i].categories[j], newAuditor);
                ledger[i].jurisdictions[j] = FHE.allow(ledger[i].jurisdictions[j], newAuditor);
            }
        }

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
     * @notice Appends a per-recipient compliance record to a company's ledger.
     * @dev Each recipient gets their own encrypted category and jurisdiction.
     *      Validates ZKPs per-recipient and grants ACL access to master + auditors.
     *
     * @param flowTxHash The transaction hash or intent ID from Flow EVM.
     * @param proxyAccount The Flow Smart Account that initiated the payment.
     * @param recipients The recipient addresses.
     * @param amounts The amounts per recipient.
     * @param categoryHandles Per-recipient Zama EIP-712 pre-encrypted category handles.
     * @param categoryProofs Per-recipient Zama Zero Knowledge Proofs for categories.
     * @param jurisdictionHandles Per-recipient Zama EIP-712 pre-encrypted jurisdiction handles.
     * @param jurisdictionProofs Per-recipient Zama Zero Knowledge Proofs for jurisdictions.
     */
    function recordTransaction(
        bytes32 flowTxHash,
        address proxyAccount,
        address[] memory recipients,
        uint256[] memory amounts,
        externalEuint8[] memory categoryHandles,
        bytes[] memory categoryProofs,
        externalEuint8[] memory jurisdictionHandles,
        bytes[] memory jurisdictionProofs
    ) external onlyLzReceiver {
        
        address masterEOA = companyMasters[proxyAccount];
        if (masterEOA == address(0)) revert ComplianceRegistry__NotRegistered();

        uint256 recipientCount = recipients.length;
        euint8[] memory catHandles = new euint8[](recipientCount);
        euint8[] memory jurHandles = new euint8[](recipientCount);
        address[] memory auditors = companyAuditors[proxyAccount];

        for (uint256 i = 0; i < recipientCount; i++) {
            // 1. Verify the ZKPs and convert the frontend bytes into fhEVM ciphertext handles
            euint8 cat = FHE.fromExternal(categoryHandles[i], categoryProofs[i]);
            euint8 jur = FHE.fromExternal(jurisdictionHandles[i], jurisdictionProofs[i]);

            // 2. Grant ACL permissions to the contract and Master EOA
            cat = FHE.allowThis(cat);
            cat = FHE.allow(cat, masterEOA);
            jur = FHE.allowThis(jur);
            jur = FHE.allow(jur, masterEOA);

            // 3. Grant ACL permissions to all active Auditors
            for (uint256 j = 0; j < auditors.length; j++) {
                cat = FHE.allow(cat, auditors[j]);
                jur = FHE.allow(jur, auditors[j]);
            }

            catHandles[i] = cat;
            jurHandles[i] = jur;
        }

        // 4. Store the record in the company's private ledger
        companyLedgers[proxyAccount].push(
            TransactionRecord({
                flowTxHash: flowTxHash,
                amounts: amounts,
                recipients: recipients,
                categories: catHandles,
                jurisdictions: jurHandles,
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
     * @notice Returns the list of active auditors for a company.
     * @param proxyAccount The Flow Smart Account address.
     */
    function getAuditors(address proxyAccount) external view returns (address[] memory) {
        return companyAuditors[proxyAccount];
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
     * @notice Returns the encrypted category handle for a specific recipient in a record.
     * @dev The caller (fhevmjs) must provide an EIP-712 signature matching the Master or Auditor to decrypt.
     */
    function getEncryptedCategory(address proxyAccount, uint256 recordIndex, uint256 recipientIndex) external view returns (euint8) {
        return companyLedgers[proxyAccount][recordIndex].categories[recipientIndex];
    }

    /**
     * @notice Returns the encrypted jurisdiction handle for a specific recipient in a record.
     */
    function getEncryptedJurisdiction(address proxyAccount, uint256 recordIndex, uint256 recipientIndex) external view returns (euint8) {
        return companyLedgers[proxyAccount][recordIndex].jurisdictions[recipientIndex];
    }
}
