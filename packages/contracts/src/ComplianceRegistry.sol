// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ComplianceRegistry
 * @author zion livingstone
 * @notice On-chain encrypted compliance ledger deployed on Ethereum Sepolia.
 *
 * @dev Stores AES-256 ciphertext blobs linked to payment transactions.
 *      The compliance metadata (expense category + regulatory jurisdiction + reference ID per recipient)
 *      is encrypted client-side in the user's browser before submission — the chain only
 *      ever sees opaque bytes. Only the key holder (merchant or authorised auditors)
 *      can decrypt the data off-chain.
 *
 *      Auditor access is implemented via ECIES: the merchant encrypts their AES key with
 *      each auditor's Ethereum public key and stores the result on-chain. The auditor
 *      uses their wallet's private key to recover the AES key, then decrypts the records.
 *
 * @custom:security-contact zionlivingstone4@gmail.com
 */
contract ComplianceRegistry {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice A single compliance record linked to a payment.
    struct ComplianceRecord {
        /// @notice Deterministic link to the payment tx hash or intent ID.
        bytes32 txHash;
        /// @notice Recipient addresses (plaintext — already public from the payment).
        address[] recipients;
        /// @notice Amounts per recipient (plaintext).
        uint256[] amounts;
        /// @notice AES-256 ciphertext of { categories[], jurisdictions[], referenceIds[] } per recipient.
        bytes encryptedPayload;
        /// @notice Block timestamp at record creation.
        uint256 timestamp;
    }

    /// @notice Per-auditor encrypted key grant.
    struct AuditorKeyGrant {
        /// @notice Auditor wallet address.
        address auditor;
        /// @notice The merchant's AES key encrypted with the auditor's Ethereum public key (ECIES).
        bytes encryptedKey;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Compliance ledger per SmartWallet proxy address.
    mapping(address => ComplianceRecord[]) private _ledgers;

    /// @notice Master EOA (MetaMask) that owns each SmartWallet proxy.
    mapping(address => address) public companyMasters;

    /// @notice Active auditors per company proxy.
    mapping(address => address[]) public companyAuditors;

    /// @notice Whether an address is an active auditor for a company.
    mapping(address => mapping(address => bool)) public isAuditorActive;

    /// @notice Encrypted AES key grants per auditor per company.
    /// proxyAccount => auditor => ECIES-encrypted AES key
    mapping(address => mapping(address => bytes)) public auditorKeyGrants;

    /// @notice Registry owner for administrative functions.
    address public owner;

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
    event RecordAppended(address indexed proxyAccount, bytes32 indexed txHash, uint256 timestamp);
    event AuditorAdded(address indexed proxyAccount, address indexed auditor);
    event AuditorRemoved(address indexed proxyAccount, address indexed auditor);
    event AuditorKeyGranted(address indexed proxyAccount, address indexed auditor);
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

    modifier onlyOwner() {
        if (msg.sender != owner) revert ComplianceRegistry__NotAuthorized();
        _;
    }

    modifier onlyMasterEOA(address proxyAccount) {
        if (msg.sender != companyMasters[proxyAccount]) revert ComplianceRegistry__NotAuthorized();
        _;
    }

    modifier onlyFactoryOrOwner() {
        if (msg.sender != factory && msg.sender != owner) revert ComplianceRegistry__NotAuthorized();
        _;
    }

    modifier onlyRegisteredProxy() {
        if (companyMasters[msg.sender] == address(0)) revert ComplianceRegistry__NotRegistered();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        ACCOUNT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    constructor() {
        owner = msg.sender;
    }

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
     * @notice Registers a SmartWallet proxy to its master EOA.
     * @dev Called by the SmartWalletFactory immediately after proxy deployment.
     *      The factory passes both addresses explicitly.
     * @param proxyAccount The newly deployed SmartWallet clone.
     * @param masterEOA    The personal wallet (MetaMask) that owns the proxy.
     */
    function registerAccount(address proxyAccount, address masterEOA) external onlyFactoryOrOwner {
        if (companyMasters[proxyAccount] != address(0)) revert ComplianceRegistry__AlreadyRegistered();
        if (proxyAccount == address(0) || masterEOA == address(0)) revert ComplianceRegistry__ZeroAddress();
        companyMasters[proxyAccount] = masterEOA;
        emit AccountRegistered(proxyAccount, masterEOA);
    }

    /*//////////////////////////////////////////////////////////////
                       COMPLIANCE RECORDING
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Records an encrypted compliance payload for a payment.
     * @dev Called by the SmartWallet via recordCompliance() or by an authorized registry.
     * @param txHash           Deterministic hash of the payment tx or intent ID.
     * @param proxyAccount     The SmartWallet that executed the payment.
     * @param recipients       Recipient addresses.
     * @param amounts          Amounts per recipient.
     * @param encryptedPayload AES-256 ciphertext blob.
     */
    function recordTransaction(
        bytes32 txHash,
        address proxyAccount,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes calldata encryptedPayload
    ) external {
        // Only the proxy itself OR an authorized caller can record compliance data
        if (msg.sender != proxyAccount && !authorizedCallers[msg.sender]) {
            revert ComplianceRegistry__NotAuthorized();
        }
        if (companyMasters[proxyAccount] == address(0)) revert ComplianceRegistry__NotRegistered();

        _ledgers[proxyAccount].push(ComplianceRecord({
            txHash: txHash,
            recipients: recipients,
            amounts: amounts,
            encryptedPayload: encryptedPayload,
            timestamp: block.timestamp
        }));

        totalGlobalRecords++;
        emit RecordAppended(proxyAccount, txHash, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                         AUDITOR MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Adds an auditor and stores the merchant's AES key encrypted for that auditor.
     * @dev The encryptedKey is produced client-side: ECIES(auditorPublicKey, merchantAESKey).
     *      The auditor can recover the AES key using their Ethereum private key, then decrypt records.
     * @param proxyAccount  The SmartWallet proxy.
     * @param newAuditor    The auditor's wallet address.
     * @param encryptedKey  The merchant's AES key, encrypted with the auditor's public key (ECIES).
     */
    function addAuditor(
        address proxyAccount,
        address newAuditor,
        bytes calldata encryptedKey
    ) external onlyMasterEOA(proxyAccount) {
        if (newAuditor == address(0)) revert ComplianceRegistry__ZeroAddress();
        if (isAuditorActive[proxyAccount][newAuditor]) revert ComplianceRegistry__AuditorAlreadyExists();
        if (companyAuditors[proxyAccount].length >= 3) revert ComplianceRegistry__MaxAuditorsReached();

        isAuditorActive[proxyAccount][newAuditor] = true;
        companyAuditors[proxyAccount].push(newAuditor);
        auditorKeyGrants[proxyAccount][newAuditor] = encryptedKey;

        emit AuditorAdded(proxyAccount, newAuditor);
        emit AuditorKeyGranted(proxyAccount, newAuditor);
    }

    /**
     * @notice Removes an auditor. The stored key grant is cleared — auditor loses access to future decryptions.
     * @dev Past records remain encrypted under the same merchant AES key. If the merchant wants
     *      to fully revoke past access, they should re-encrypt records with a new key (future roadmap).
     */
    function removeAuditor(address proxyAccount, address auditor) external onlyMasterEOA(proxyAccount) {
        isAuditorActive[proxyAccount][auditor] = false;
        delete auditorKeyGrants[proxyAccount][auditor];

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

    /// @notice Returns the number of compliance records for a company.
    function getRecordCount(address proxyAccount) external view returns (uint256) {
        return _ledgers[proxyAccount].length;
    }

    /// @notice Returns all active auditors for a company.
    function getAuditors(address proxyAccount) external view returns (address[] memory) {
        return companyAuditors[proxyAccount];
    }

    /**
     * @notice Returns the plaintext metadata and encrypted payload for a record.
     * @dev The encryptedPayload is opaque bytes — decrypt off-chain with the merchant AES key.
     */
    function getRecord(address proxyAccount, uint256 index)
        external
        view
        returns (
            bytes32 txHash,
            address[] memory recipients,
            uint256[] memory amounts,
            bytes memory encryptedPayload,
            uint256 timestamp
        )
    {
        ComplianceRecord storage r = _ledgers[proxyAccount][index];
        return (r.txHash, r.recipients, r.amounts, r.encryptedPayload, r.timestamp);
    }

    /**
     * @notice Returns the ECIES-encrypted AES key for a given auditor.
     * @dev The auditor uses their private key off-chain to decrypt this and recover the AES key.
     */
    function getAuditorKeyGrant(address proxyAccount, address auditor)
        external
        view
        returns (bytes memory)
    {
        return auditorKeyGrants[proxyAccount][auditor];
    }
}
