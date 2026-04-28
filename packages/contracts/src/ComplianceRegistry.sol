// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8} from "@fhevm/solidity/lib/FHE.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ComplianceRegistry
 * @author complyr
 * @notice On-chain FHE compliance ledger deployed on Sepolia ETH.
 * @dev Stores FHE ciphertext handles linked to payment transactions.
 *      Uses fhEVM `einput` pre-encrypted bytes to ensure no plaintext is ever leaked.
 *      Auditor access is implemented via FHE.allow() — the merchant grants 
 *      decryption rights to auditors directly on the ciphertext handles.
 */
contract ComplianceRegistry is Ownable {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice A compliant record for a specific business outgoing payment.
    struct ComplianceRecord {
        /// @notice The correlated transaction hash / intent ID.
        bytes32 txHash;
        /// @notice The total transaction amounts per recipient (plaintext).
        uint256[] amounts;
        /// @notice Recipients in the batch transfer (plaintext).
        address[] recipients;
        /// @notice One encrypted category per recipient (e.g., 1=Payroll, 2=Contractor).
        euint8[] categories;
        /// @notice One encrypted jurisdiction code per recipient (e.g., 1=US, 2=EU).
        euint8[] jurisdictions;
        /// @notice Timestamp of the compliance record.
        uint256 timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Compliance ledger per SmartWallet proxy address.
    mapping(address => ComplianceRecord[]) private _ledgers;

    /// @notice Master EOA (MetaMask) that owns each SmartWallet proxy.
    mapping(address => address) public companyMasters;

    /// @notice Tracks active auditors for a company. (proxyAccount => auditor => isActive)
    mapping(address => mapping(address => bool)) public isAuditorActive;

    /// @notice A list of all auditors for iteration.
    mapping(address => address[]) public companyAuditors;

    /// @notice Authorized factory allowed to register new accounts.
    address public factory;

    /// @notice Addresses authorized to record transactions on behalf of wallets (e.g. IntentRegistry).
    mapping(address => bool) public authorizedCallers;

    /// @notice Global record counter.
    uint256 public totalGlobalRecords;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event AccountRegistered(address indexed proxyAccount, address indexed masterEOA);
    event RecordAppended(
        address indexed proxyAccount, 
        bytes32 indexed txHash, 
        address[] recipients,
        uint256[] amounts,
        euint8[] categories,
        euint8[] jurisdictions,
        uint256 timestamp
    );
    event AuditorAdded(address indexed proxyAccount, address indexed auditor);
    event AuditorRemoved(address indexed proxyAccount, address indexed auditor);
    event AuthorizedCallerSet(address indexed caller, bool authorized);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    error ComplianceRegistry__NotAuthorized();
    error ComplianceRegistry__ZeroAddress();
    error ComplianceRegistry__AlreadyRegistered();
    error ComplianceRegistry__NotRegistered();
    error ComplianceRegistry__AuditorAlreadyExists();
    error ComplianceRegistry__MaxAuditorsReached();

    /*//////////////////////////////////////////////////////////////
                              MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyMasterEOA(address proxyAccount) {
        if (msg.sender != companyMasters[proxyAccount]) {
            revert ComplianceRegistry__NotAuthorized();
        }
        _;
    }

    modifier onlyFactoryOrOwner() {
        if (msg.sender != factory && msg.sender != owner()) {
            revert ComplianceRegistry__NotAuthorized();
        }
        _;
    }

    /*//////////////////////////////////////////////////////////////
                             CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor() Ownable(msg.sender) {}

    /*//////////////////////////////////////////////////////////////
                        ACCOUNT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Allows the owner to set the authorized factory.
     */
    function setFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert ComplianceRegistry__ZeroAddress();
        factory = _factory;
    }

    /**
     * @notice Allows the owner to authorize/deauthorize a caller (like IntentRegistry).
     */
    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        if (caller == address(0)) revert ComplianceRegistry__ZeroAddress();
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerSet(caller, authorized);
    }

    /**
     * @notice Registers a company's Proxy Account to its Master EOA.
     */
    function registerAccount(address proxyAccount, address masterEOA) external onlyFactoryOrOwner {
        if (companyMasters[proxyAccount] != address(0)) {
            revert ComplianceRegistry__AlreadyRegistered();
        }
        if (proxyAccount == address(0) || masterEOA == address(0)) {
            revert ComplianceRegistry__ZeroAddress();
        }

        companyMasters[proxyAccount] = masterEOA;
        emit AccountRegistered(proxyAccount, masterEOA);
    }

    /*//////////////////////////////////////////////////////////////
                       COMPLIANCE RECORDING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Records an FHE-encrypted compliance payload for a payment.
     * @dev Called by the SmartWallet or authorized caller.
     * @param txHash           Correlation ID for the payment.
     * @param proxyAccount     The business' smart account.
     * @param recipients       Recipients of the payment.
     * @param amounts          Amounts transferred.
     * @param categories       FHE encrypted categories (euint8 handles).
     * @param jurisdictions    FHE encrypted jurisdictions (euint8 handles).
     */
    function recordTransaction(
        bytes32 txHash,
        address proxyAccount,
        address[] calldata recipients,
        uint256[] calldata amounts,
        euint8[] calldata categories,
        euint8[] calldata jurisdictions
    ) external {
        if (msg.sender != proxyAccount && !authorizedCallers[msg.sender]) {
            revert ComplianceRegistry__NotAuthorized();
        }
        if (companyMasters[proxyAccount] == address(0)) revert ComplianceRegistry__NotRegistered();

        // 1. Store the record
        ComplianceRecord storage record = _ledgers[proxyAccount].push();
        record.txHash = txHash;
        record.recipients = recipients;
        record.amounts = amounts;
        record.timestamp = block.timestamp;

        // 2. Grant initial access to the Master EOA for all ciphertexts
        address master = companyMasters[proxyAccount];
        for (uint256 i = 0; i < categories.length; i++) {
            euint8 cat = FHE.allow(categories[i], master);
            euint8 jur = FHE.allow(jurisdictions[i], master);
            record.categories.push(cat);
            record.jurisdictions.push(jur);
        }

        // 3. Automatically grant access to all currently active auditors
        address[] memory auditors = companyAuditors[proxyAccount];
        for (uint256 i = 0; i < auditors.length; i++) {
            address auditor = auditors[i];
            for (uint256 j = 0; j < record.categories.length; j++) {
                record.categories[j] = FHE.allow(record.categories[j], auditor);
                record.jurisdictions[j] = FHE.allow(record.jurisdictions[j], auditor);
            }
        }

        totalGlobalRecords++;
        emit RecordAppended(proxyAccount, txHash, recipients, amounts, categories, jurisdictions, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                         AUDITOR MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adds an auditor to a company's compliance ledger.
     * @dev Automatically grants the auditor access to all PAST records.
     * @param proxyAccount The business' smart account.
     * @param newAuditor   The wallet address of the auditor.
     */
    function addAuditor(address proxyAccount, address newAuditor) external onlyMasterEOA(proxyAccount) {
        if (newAuditor == address(0)) revert ComplianceRegistry__ZeroAddress();
        if (isAuditorActive[proxyAccount][newAuditor]) revert ComplianceRegistry__AuditorAlreadyExists();
        if (companyAuditors[proxyAccount].length >= 3) revert ComplianceRegistry__MaxAuditorsReached();

        isAuditorActive[proxyAccount][newAuditor] = true;
        companyAuditors[proxyAccount].push(newAuditor);

        // Retroactively grant FHE decryption access for all PAST transactions.
        ComplianceRecord[] storage ledger = _ledgers[proxyAccount];
        for (uint256 i = 0; i < ledger.length; i++) {
            for (uint256 j = 0; j < ledger[i].categories.length; j++) {
                ledger[i].categories[j] = FHE.allow(ledger[i].categories[j], newAuditor);
                ledger[i].jurisdictions[j] = FHE.allow(ledger[i].jurisdictions[j], newAuditor);
            }
        }

        emit AuditorAdded(proxyAccount, newAuditor);
    }

    /**
     * @notice Removes an auditor.
     */
    function removeAuditor(address proxyAccount, address auditor) external onlyMasterEOA(proxyAccount) {
        isAuditorActive[proxyAccount][auditor] = false;
        
        address[] storage auditors = companyAuditors[proxyAccount];
        for (uint256 i; i < auditors.length; i++) {
            if (auditors[i] == auditor) {
                auditors[i] = auditors[auditors.length - 1];
                auditors.pop();
                break;
            }
        }
        emit AuditorRemoved(proxyAccount, auditor);
    }

    /*//////////////////////////////////////////////////////////////
                           VIEW FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function getRecordCount(address proxyAccount) external view returns (uint256) {
        return _ledgers[proxyAccount].length;
    }

    function getAuditors(address proxyAccount) external view returns (address[] memory) {
        return companyAuditors[proxyAccount];
    }

    function getRecord(address proxyAccount, uint256 index)
        external
        view
        returns (
            bytes32 txHash,
            address[] memory recipients,
            uint256[] memory amounts,
            euint8[] memory categories,
            euint8[] memory jurisdictions,
            uint256 timestamp
        )
    {
        ComplianceRecord storage r = _ledgers[proxyAccount][index];
        return (r.txHash, r.recipients, r.amounts, r.categories, r.jurisdictions, r.timestamp);
    }
}
