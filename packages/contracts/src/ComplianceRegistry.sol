// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "encrypted-types/EncryptedTypes.sol";

/**
 * @title ComplianceRegistry
 * @author zion livingstone
 * @notice On-chain encrypted compliance ledger deployed on Ethereum Sepolia.
 * @dev Stores Zama FHE ciphertext handles for transaction amounts and compliance metadata.
 *      Recipients, token addresses, and reference IDs remain plaintext for audit trail usability.
 *
 * @custom:security-contact zionlivingstone4@gmail.com
 */
contract ComplianceRegistry is ZamaEthereumConfig {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    struct ComplianceRecord {
        bytes32 txHash;
        address token;
        address[] recipients;
        euint128[] amounts;
        euint8[] categories;
        euint8[] jurisdictions;
        string[] referenceIds;
        uint256 timestamp;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    mapping(address => ComplianceRecord[]) private _ledgers;

    /// @notice Master EOA (MetaMask) that owns each SmartWallet proxy.
    mapping(address => address) public companyMasters;

    /// @notice Active auditors per company proxy.
    mapping(address => address[]) public companyAuditors;

    /// @notice Whether an address is an active auditor for a company.
    mapping(address => mapping(address => bool)) public isAuditorActive;

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
    error ComplianceRegistry__ArrayLengthMismatch();
    error ComplianceRegistry__InvalidRecordIndex();
    error ComplianceRegistry__MissingComplianceInfo();

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

    /*//////////////////////////////////////////////////////////////
                        ACCOUNT MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    constructor() {
        owner = msg.sender;
    }

    function setFactory(address _factory) external onlyOwner {
        if (_factory == address(0)) revert ComplianceRegistry__ZeroAddress();
        factory = _factory;
    }

    function setAuthorizedCaller(address caller, bool authorized) external onlyOwner {
        if (caller == address(0)) revert ComplianceRegistry__ZeroAddress();
        authorizedCallers[caller] = authorized;
        emit AuthorizedCallerSet(caller, authorized);
    }

    function registerAccount(address proxyAccount, address masterEOA) external onlyFactoryOrOwner {
        if (companyMasters[proxyAccount] != address(0)) revert ComplianceRegistry__AlreadyRegistered();
        if (proxyAccount == address(0) || masterEOA == address(0)) revert ComplianceRegistry__ZeroAddress();
        companyMasters[proxyAccount] = masterEOA;
        emit AccountRegistered(proxyAccount, masterEOA);
    }

    /*//////////////////////////////////////////////////////////////
                       COMPLIANCE RECORDING
    //////////////////////////////////////////////////////////////*/

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
    ) external {
        if (msg.sender != proxyAccount && !authorizedCallers[msg.sender]) {
            revert ComplianceRegistry__NotAuthorized();
        }
        if (companyMasters[proxyAccount] == address(0)) revert ComplianceRegistry__NotRegistered();
        _validateRecordArrays(
            recipients.length,
            amountHandles.length,
            amountProofs.length,
            categoryHandles.length,
            categoryProofs.length,
            jurisdictionHandles.length,
            jurisdictionProofs.length,
            referenceIds.length
        );

        ComplianceRecord storage record = _ledgers[proxyAccount].push();
        record.txHash = txHash;
        record.token = token;
        record.recipients = recipients;
        record.referenceIds = referenceIds;
        record.timestamp = block.timestamp;

        address masterEOA = companyMasters[proxyAccount];
        address[] storage auditors = companyAuditors[proxyAccount];

        for (uint256 i; i < recipients.length; i++) {
            if (recipients[i] == address(0) || bytes(referenceIds[i]).length == 0) {
                revert ComplianceRegistry__MissingComplianceInfo();
            }

            euint128 amount = FHE.fromExternal(amountHandles[i], amountProofs[i]);
            euint8 category = FHE.fromExternal(categoryHandles[i], categoryProofs[i]);
            euint8 jurisdiction = FHE.fromExternal(jurisdictionHandles[i], jurisdictionProofs[i]);

            amount = FHE.allowThis(amount);
            category = FHE.allowThis(category);
            jurisdiction = FHE.allowThis(jurisdiction);

            amount = FHE.allow(amount, masterEOA);
            category = FHE.allow(category, masterEOA);
            jurisdiction = FHE.allow(jurisdiction, masterEOA);

            for (uint256 j; j < auditors.length; j++) {
                address auditor = auditors[j];
                if (!isAuditorActive[proxyAccount][auditor]) continue;
                amount = FHE.allow(amount, auditor);
                category = FHE.allow(category, auditor);
                jurisdiction = FHE.allow(jurisdiction, auditor);
            }

            record.amounts.push(amount);
            record.categories.push(category);
            record.jurisdictions.push(jurisdiction);
        }

        totalGlobalRecords++;
        emit RecordAppended(proxyAccount, txHash, block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                         AUDITOR MANAGEMENT
    //////////////////////////////////////////////////////////////*/

    function addAuditor(address proxyAccount, address newAuditor) external onlyMasterEOA(proxyAccount) {
        if (newAuditor == address(0)) revert ComplianceRegistry__ZeroAddress();
        if (isAuditorActive[proxyAccount][newAuditor]) revert ComplianceRegistry__AuditorAlreadyExists();
        if (companyAuditors[proxyAccount].length >= 3) revert ComplianceRegistry__MaxAuditorsReached();

        isAuditorActive[proxyAccount][newAuditor] = true;
        companyAuditors[proxyAccount].push(newAuditor);

        ComplianceRecord[] storage ledger = _ledgers[proxyAccount];
        for (uint256 i; i < ledger.length; i++) {
            for (uint256 j; j < ledger[i].recipients.length; j++) {
                ledger[i].amounts[j] = FHE.allow(ledger[i].amounts[j], newAuditor);
                ledger[i].categories[j] = FHE.allow(ledger[i].categories[j], newAuditor);
                ledger[i].jurisdictions[j] = FHE.allow(ledger[i].jurisdictions[j], newAuditor);
            }
        }

        emit AuditorAdded(proxyAccount, newAuditor);
    }

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

    function getRecordMetadata(address proxyAccount, uint256 index)
        external
        view
        returns (
            bytes32 txHash,
            address token,
            address[] memory recipients,
            string[] memory referenceIds,
            uint256 timestamp
        )
    {
        _checkRecordIndex(proxyAccount, index);
        ComplianceRecord storage record = _ledgers[proxyAccount][index];
        return (record.txHash, record.token, record.recipients, record.referenceIds, record.timestamp);
    }

    function getRecord(address proxyAccount, uint256 index)
        external
        view
        returns (
            bytes32 txHash,
            address token,
            address[] memory recipients,
            bytes32[] memory amountHandles,
            bytes32[] memory categoryHandles,
            bytes32[] memory jurisdictionHandles,
            string[] memory referenceIds,
            uint256 timestamp
        )
    {
        _checkRecordIndex(proxyAccount, index);
        ComplianceRecord storage record = _ledgers[proxyAccount][index];
        uint256 length = record.recipients.length;
        amountHandles = new bytes32[](length);
        categoryHandles = new bytes32[](length);
        jurisdictionHandles = new bytes32[](length);

        for (uint256 i; i < length; i++) {
            amountHandles[i] = FHE.toBytes32(record.amounts[i]);
            categoryHandles[i] = FHE.toBytes32(record.categories[i]);
            jurisdictionHandles[i] = FHE.toBytes32(record.jurisdictions[i]);
        }

        return (
            record.txHash,
            record.token,
            record.recipients,
            amountHandles,
            categoryHandles,
            jurisdictionHandles,
            record.referenceIds,
            record.timestamp
        );
    }

    function getEncryptedAmount(address proxyAccount, uint256 index, uint256 recipientIndex)
        external
        view
        returns (euint128)
    {
        _checkRecipientIndex(proxyAccount, index, recipientIndex);
        return _ledgers[proxyAccount][index].amounts[recipientIndex];
    }

    function getEncryptedCategory(address proxyAccount, uint256 index, uint256 recipientIndex)
        external
        view
        returns (euint8)
    {
        _checkRecipientIndex(proxyAccount, index, recipientIndex);
        return _ledgers[proxyAccount][index].categories[recipientIndex];
    }

    function getEncryptedJurisdiction(address proxyAccount, uint256 index, uint256 recipientIndex)
        external
        view
        returns (euint8)
    {
        _checkRecipientIndex(proxyAccount, index, recipientIndex);
        return _ledgers[proxyAccount][index].jurisdictions[recipientIndex];
    }

    /*//////////////////////////////////////////////////////////////
                           INTERNAL HELPERS
    //////////////////////////////////////////////////////////////*/

    function _validateRecordArrays(
        uint256 recipientsLength,
        uint256 amountHandlesLength,
        uint256 amountProofsLength,
        uint256 categoryHandlesLength,
        uint256 categoryProofsLength,
        uint256 jurisdictionHandlesLength,
        uint256 jurisdictionProofsLength,
        uint256 referenceIdsLength
    ) internal pure {
        if (
            recipientsLength == 0 || recipientsLength != amountHandlesLength || recipientsLength != amountProofsLength
                || recipientsLength != categoryHandlesLength || recipientsLength != categoryProofsLength
                || recipientsLength != jurisdictionHandlesLength || recipientsLength != jurisdictionProofsLength
                || recipientsLength != referenceIdsLength
        ) revert ComplianceRegistry__ArrayLengthMismatch();
    }

    function _checkRecordIndex(address proxyAccount, uint256 index) internal view {
        if (index >= _ledgers[proxyAccount].length) revert ComplianceRegistry__InvalidRecordIndex();
    }

    function _checkRecipientIndex(address proxyAccount, uint256 index, uint256 recipientIndex) internal view {
        _checkRecordIndex(proxyAccount, index);
        if (recipientIndex >= _ledgers[proxyAccount][index].recipients.length) {
            revert ComplianceRegistry__InvalidRecordIndex();
        }
    }
}
