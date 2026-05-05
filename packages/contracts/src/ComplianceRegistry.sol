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

    enum ReviewTestType {
        LargePayment,
        RecipientExposure,
        CategoryExposure,
        JurisdictionExposure
    }

    struct ReviewTest {
        uint256 id;
        address proxyAccount;
        address auditor;
        ReviewTestType testType;
        address recipientScope;
        uint8 numericScope;
        euint128 threshold;
        bool active;
        uint256 createdAt;
    }

    struct ReviewResult {
        uint256 testId;
        bytes32 recordId;
        address recipient;
        euint8 result;
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

    /// @notice Largest category id supported by the encrypted rollup engine.
    uint8 public constant MAX_CATEGORY_ID = 10;

    /// @notice Largest jurisdiction id supported by the encrypted rollup engine.
    uint8 public constant MAX_JURISDICTION_ID = 13;

    /// @notice Maximum number of active private review tests per company wallet.
    uint256 public constant MAX_ACTIVE_REVIEW_TESTS = 20;

    /// @notice Maximum number of external reviewers per company wallet.
    uint256 public constant MAX_AUDITORS = 5;

    /// @notice Monotonic review test id counter.
    uint256 public nextReviewTestId = 1;

    /// @dev Encrypted internal reports for owner-authorized private reporting.
    mapping(address proxyAccount => euint128 total) private _globalTotals;
    mapping(address proxyAccount => mapping(address recipient => euint128 total)) private _recipientTotals;
    mapping(address proxyAccount => mapping(uint8 category => euint128 total)) private _categoryTotals;
    mapping(address proxyAccount => mapping(uint8 jurisdiction => euint128 total)) private _jurisdictionTotals;

    /// @dev Auditor-owned private tests and encrypted result queues.
    mapping(uint256 testId => ReviewTest test) private _reviewTests;
    mapping(address proxyAccount => uint256[] testIds) private _activeReviewTestIds;
    mapping(uint256 testId => uint256 indexPlusOne) private _activeReviewTestIndexPlusOne;
    mapping(address auditor => uint256[] testIds) private _auditorReviewTestIds;
    mapping(address auditor => ReviewResult[] results) private _auditorReviewResults;

    /*//////////////////////////////////////////////////////////////
                                EVENTS
    //////////////////////////////////////////////////////////////*/

    event AccountRegistered(address indexed proxyAccount, address indexed masterEOA);
    event RecordAppended(address indexed proxyAccount, bytes32 indexed txHash, uint256 timestamp);
    event AuditorAdded(address indexed proxyAccount, address indexed auditor);
    event AuditorRemoved(address indexed proxyAccount, address indexed auditor);
    event AuthorizedCallerSet(address indexed caller, bool authorized);
    event ReviewTestCreated(
        address indexed proxyAccount,
        address indexed auditor,
        uint256 indexed testId,
        ReviewTestType testType,
        address recipientScope,
        uint8 numericScope,
        uint256 timestamp
    );
    event ReviewTestDeactivated(address indexed proxyAccount, address indexed auditor, uint256 indexed testId);
    event ReviewResultRecorded(address indexed proxyAccount, address indexed auditor, uint256 indexed testId, bytes32 recordId);

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
    error ComplianceRegistry__InvalidScope();
    error ComplianceRegistry__ReviewTestNotFound();
    error ComplianceRegistry__MaxReviewTestsReached();

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

            _updateEncryptedRollups(proxyAccount, recipients[i], amount, category, jurisdiction, masterEOA, auditors);
            _evaluateActiveReviewTests(proxyAccount, txHash, recipients[i], amount);
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
        if (companyAuditors[proxyAccount].length >= MAX_AUDITORS) revert ComplianceRegistry__MaxAuditorsReached();

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
        _allowRollups(proxyAccount, newAuditor);

        emit AuditorAdded(proxyAccount, newAuditor);
    }

    function removeAuditor(address proxyAccount, address auditor) external onlyMasterEOA(proxyAccount) {
        // FHE access cannot be revoked from ciphertexts that were already allowed.
        // Removing an auditor prevents future active-list grants and UI access checks,
        // but historical KMS permissions may remain usable.
        isAuditorActive[proxyAccount][auditor] = false;

        address[] storage auditors = companyAuditors[proxyAccount];
        for (uint256 i; i < auditors.length; i++) {
            if (auditors[i] == auditor) {
                auditors[i] = auditors[auditors.length - 1];
                auditors.pop();
                break;
            }
        }
        _deactivateAuditorTests(proxyAccount, auditor);
        emit AuditorRemoved(proxyAccount, auditor);
    }

    /*//////////////////////////////////////////////////////////////
                         PRIVATE REVIEW TESTS
    //////////////////////////////////////////////////////////////*/

    function createLargePaymentReviewTest(
        address proxyAccount,
        externalEuint128 thresholdHandle,
        bytes calldata thresholdProof
    ) external returns (uint256 testId) {
        return _createReviewTest(
            proxyAccount,
            ReviewTestType.LargePayment,
            address(0),
            0,
            thresholdHandle,
            thresholdProof
        );
    }

    function createRecipientExposureReviewTest(
        address proxyAccount,
        address recipient,
        externalEuint128 thresholdHandle,
        bytes calldata thresholdProof
    ) external returns (uint256 testId) {
        if (recipient == address(0)) revert ComplianceRegistry__ZeroAddress();
        return _createReviewTest(
            proxyAccount,
            ReviewTestType.RecipientExposure,
            recipient,
            0,
            thresholdHandle,
            thresholdProof
        );
    }

    function createCategoryExposureReviewTest(
        address proxyAccount,
        uint8 category,
        externalEuint128 thresholdHandle,
        bytes calldata thresholdProof
    ) external returns (uint256 testId) {
        if (category == 0 || category > MAX_CATEGORY_ID) revert ComplianceRegistry__InvalidScope();
        return _createReviewTest(
            proxyAccount,
            ReviewTestType.CategoryExposure,
            address(0),
            category,
            thresholdHandle,
            thresholdProof
        );
    }

    function createJurisdictionExposureReviewTest(
        address proxyAccount,
        uint8 jurisdiction,
        externalEuint128 thresholdHandle,
        bytes calldata thresholdProof
    ) external returns (uint256 testId) {
        if (jurisdiction == 0 || jurisdiction > MAX_JURISDICTION_ID) revert ComplianceRegistry__InvalidScope();
        return _createReviewTest(
            proxyAccount,
            ReviewTestType.JurisdictionExposure,
            address(0),
            jurisdiction,
            thresholdHandle,
            thresholdProof
        );
    }

    function deactivateReviewTest(uint256 testId) external {
        ReviewTest storage test = _reviewTests[testId];
        if (test.id == 0) revert ComplianceRegistry__ReviewTestNotFound();
        if (msg.sender != test.auditor) revert ComplianceRegistry__NotAuthorized();
        if (!test.active) return;

        _deactivateReviewTest(test);
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

    function getEncryptedGlobalTotal(address proxyAccount) external view returns (bytes32) {
        return FHE.toBytes32(_globalTotals[proxyAccount]);
    }

    function getEncryptedRecipientTotal(address proxyAccount, address recipient) external view returns (bytes32) {
        return FHE.toBytes32(_recipientTotals[proxyAccount][recipient]);
    }

    function getEncryptedCategoryTotal(address proxyAccount, uint8 category) external view returns (bytes32) {
        if (category > MAX_CATEGORY_ID) revert ComplianceRegistry__InvalidScope();
        return FHE.toBytes32(_categoryTotals[proxyAccount][category]);
    }

    function getEncryptedJurisdictionTotal(address proxyAccount, uint8 jurisdiction) external view returns (bytes32) {
        if (jurisdiction > MAX_JURISDICTION_ID) revert ComplianceRegistry__InvalidScope();
        return FHE.toBytes32(_jurisdictionTotals[proxyAccount][jurisdiction]);
    }

    function getReviewTest(uint256 testId)
        external
        view
        returns (
            uint256 id,
            address proxyAccount,
            address auditor,
            ReviewTestType testType,
            address recipientScope,
            uint8 numericScope,
            bytes32 thresholdHandle,
            bool active,
            uint256 createdAt
        )
    {
        ReviewTest storage test = _reviewTests[testId];
        if (test.id == 0) revert ComplianceRegistry__ReviewTestNotFound();
        if (msg.sender != test.auditor) revert ComplianceRegistry__NotAuthorized();
        return (
            test.id,
            test.proxyAccount,
            test.auditor,
            test.testType,
            test.recipientScope,
            test.numericScope,
            FHE.toBytes32(test.threshold),
            test.active,
            test.createdAt
        );
    }

    function getAuditorReviewTestIds(address auditor) external view returns (uint256[] memory) {
        if (msg.sender != auditor) revert ComplianceRegistry__NotAuthorized();
        return _auditorReviewTestIds[auditor];
    }

    function getReviewResultCount(address auditor) external view returns (uint256) {
        if (msg.sender != auditor) revert ComplianceRegistry__NotAuthorized();
        return _auditorReviewResults[auditor].length;
    }

    function getReviewResult(address auditor, uint256 index)
        external
        view
        returns (
            uint256 testId,
            bytes32 recordId,
            address recipient,
            bytes32 resultHandle,
            uint256 timestamp
        )
    {
        if (msg.sender != auditor) revert ComplianceRegistry__NotAuthorized();
        if (index >= _auditorReviewResults[auditor].length) revert ComplianceRegistry__InvalidRecordIndex();

        ReviewResult storage result = _auditorReviewResults[auditor][index];
        return (
            result.testId,
            result.recordId,
            result.recipient,
            FHE.toBytes32(result.result),
            result.timestamp
        );
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

    function _createReviewTest(
        address proxyAccount,
        ReviewTestType testType,
        address recipientScope,
        uint8 numericScope,
        externalEuint128 thresholdHandle,
        bytes calldata thresholdProof
    ) internal returns (uint256 testId) {
        if (!isAuditorActive[proxyAccount][msg.sender]) revert ComplianceRegistry__NotAuthorized();
        if (_activeReviewTestIds[proxyAccount].length >= MAX_ACTIVE_REVIEW_TESTS) {
            revert ComplianceRegistry__MaxReviewTestsReached();
        }

        euint128 threshold = FHE.fromExternal(thresholdHandle, thresholdProof);
        threshold = FHE.allowThis(threshold);
        threshold = FHE.allow(threshold, msg.sender);

        testId = nextReviewTestId++;
        _reviewTests[testId] = ReviewTest({
            id: testId,
            proxyAccount: proxyAccount,
            auditor: msg.sender,
            testType: testType,
            recipientScope: recipientScope,
            numericScope: numericScope,
            threshold: threshold,
            active: true,
            createdAt: block.timestamp
        });

        _auditorReviewTestIds[msg.sender].push(testId);
        _activeReviewTestIds[proxyAccount].push(testId);
        _activeReviewTestIndexPlusOne[testId] = _activeReviewTestIds[proxyAccount].length;

        emit ReviewTestCreated(proxyAccount, msg.sender, testId, testType, recipientScope, numericScope, block.timestamp);
    }

    function _updateEncryptedRollups(
        address proxyAccount,
        address recipient,
        euint128 amount,
        euint8 category,
        euint8 jurisdiction,
        address masterEOA,
        address[] storage auditors
    ) internal {
        _globalTotals[proxyAccount] = _allowReportValue(FHE.add(_globalTotals[proxyAccount], amount), masterEOA, auditors, proxyAccount);
        _recipientTotals[proxyAccount][recipient] =
            _allowReportValue(FHE.add(_recipientTotals[proxyAccount][recipient], amount), masterEOA, auditors, proxyAccount);

        for (uint8 categoryId = 1; categoryId <= MAX_CATEGORY_ID; categoryId++) {
            ebool isCategory = FHE.eq(category, categoryId);
            euint128 delta = FHE.select(isCategory, amount, FHE.asEuint128(0));
            _categoryTotals[proxyAccount][categoryId] =
                _allowReportValue(FHE.add(_categoryTotals[proxyAccount][categoryId], delta), masterEOA, auditors, proxyAccount);
        }

        for (uint8 jurisdictionId = 1; jurisdictionId <= MAX_JURISDICTION_ID; jurisdictionId++) {
            ebool isJurisdiction = FHE.eq(jurisdiction, jurisdictionId);
            euint128 delta = FHE.select(isJurisdiction, amount, FHE.asEuint128(0));
            _jurisdictionTotals[proxyAccount][jurisdictionId] =
                _allowReportValue(FHE.add(_jurisdictionTotals[proxyAccount][jurisdictionId], delta), masterEOA, auditors, proxyAccount);
        }
    }

    function _allowReportValue(
        euint128 value,
        address masterEOA,
        address[] storage auditors,
        address proxyAccount
    ) internal returns (euint128) {
        value = FHE.allowThis(value);
        value = FHE.allow(value, masterEOA);

        for (uint256 i; i < auditors.length; i++) {
            address auditor = auditors[i];
            if (!isAuditorActive[proxyAccount][auditor]) continue;
            value = FHE.allow(value, auditor);
        }

        return value;
    }

    function _evaluateActiveReviewTests(
        address proxyAccount,
        bytes32 recordId,
        address recipient,
        euint128 amount
    ) internal {
        uint256[] storage activeTestIds = _activeReviewTestIds[proxyAccount];

        for (uint256 i; i < activeTestIds.length; i++) {
            ReviewTest storage test = _reviewTests[activeTestIds[i]];
            if (!test.active) continue;

            if (test.testType == ReviewTestType.LargePayment) {
                _storeReviewResult(test, recordId, recipient, FHE.gt(amount, test.threshold));
            } else if (test.testType == ReviewTestType.RecipientExposure && test.recipientScope == recipient) {
                _storeReviewResult(
                    test,
                    recordId,
                    recipient,
                    FHE.gt(_recipientTotals[proxyAccount][recipient], test.threshold)
                );
            } else if (test.testType == ReviewTestType.CategoryExposure) {
                _storeReviewResult(
                    test,
                    recordId,
                    recipient,
                    FHE.gt(_categoryTotals[proxyAccount][test.numericScope], test.threshold)
                );
            } else if (test.testType == ReviewTestType.JurisdictionExposure) {
                _storeReviewResult(
                    test,
                    recordId,
                    recipient,
                    FHE.gt(_jurisdictionTotals[proxyAccount][test.numericScope], test.threshold)
                );
            }
        }
    }

    function _storeReviewResult(
        ReviewTest storage test,
        bytes32 recordId,
        address recipient,
        ebool triggered
    ) internal {
        euint8 result = FHE.select(triggered, FHE.asEuint8(1), FHE.asEuint8(0));
        result = FHE.allowThis(result);
        result = FHE.allow(result, test.auditor);

        _auditorReviewResults[test.auditor].push(ReviewResult({
            testId: test.id,
            recordId: recordId,
            recipient: recipient,
            result: result,
            timestamp: block.timestamp
        }));

        emit ReviewResultRecorded(test.proxyAccount, test.auditor, test.id, recordId);
    }

    function _removeActiveReviewTest(address proxyAccount, uint256 testId) internal {
        uint256 indexPlusOne = _activeReviewTestIndexPlusOne[testId];
        if (indexPlusOne == 0) return;

        uint256 index = indexPlusOne - 1;
        uint256[] storage activeTestIds = _activeReviewTestIds[proxyAccount];
        uint256 lastIndex = activeTestIds.length - 1;

        if (index != lastIndex) {
            uint256 movedTestId = activeTestIds[lastIndex];
            activeTestIds[index] = movedTestId;
            _activeReviewTestIndexPlusOne[movedTestId] = indexPlusOne;
        }

        activeTestIds.pop();
        delete _activeReviewTestIndexPlusOne[testId];
    }

    function _deactivateReviewTest(ReviewTest storage test) internal {
        test.active = false;
        _removeActiveReviewTest(test.proxyAccount, test.id);
        emit ReviewTestDeactivated(test.proxyAccount, test.auditor, test.id);
    }

    function _deactivateAuditorTests(address proxyAccount, address auditor) internal {
        uint256[] storage testIds = _auditorReviewTestIds[auditor];
        for (uint256 i; i < testIds.length; i++) {
            ReviewTest storage test = _reviewTests[testIds[i]];
            if (test.proxyAccount == proxyAccount && test.active) {
                _deactivateReviewTest(test);
            }
        }
    }

    function _allowRollups(address proxyAccount, address account) internal {
        if (FHE.isInitialized(_globalTotals[proxyAccount])) {
            _globalTotals[proxyAccount] = FHE.allow(_globalTotals[proxyAccount], account);
        }

        ComplianceRecord[] storage ledger = _ledgers[proxyAccount];
        for (uint256 i; i < ledger.length; i++) {
            for (uint256 j; j < ledger[i].recipients.length; j++) {
                address recipient = ledger[i].recipients[j];
                if (FHE.isInitialized(_recipientTotals[proxyAccount][recipient])) {
                    _recipientTotals[proxyAccount][recipient] = FHE.allow(_recipientTotals[proxyAccount][recipient], account);
                }
            }
        }

        for (uint8 categoryId = 1; categoryId <= MAX_CATEGORY_ID; categoryId++) {
            if (FHE.isInitialized(_categoryTotals[proxyAccount][categoryId])) {
                _categoryTotals[proxyAccount][categoryId] = FHE.allow(_categoryTotals[proxyAccount][categoryId], account);
            }
        }

        for (uint8 jurisdictionId = 1; jurisdictionId <= MAX_JURISDICTION_ID; jurisdictionId++) {
            if (FHE.isInitialized(_jurisdictionTotals[proxyAccount][jurisdictionId])) {
                _jurisdictionTotals[proxyAccount][jurisdictionId] =
                    FHE.allow(_jurisdictionTotals[proxyAccount][jurisdictionId], account);
            }
        }
    }
}
