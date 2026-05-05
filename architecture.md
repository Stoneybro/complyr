# Complyr Architecture Rebuild Plan

## 1. Product Direction

Complyr is a business payment system with a confidential audit infrastructure.

The product should not be framed as a generic "compliance metadata registry". The stronger framing is:

> Complyr turns a business wallet into an audit-controlled payment system. Every payment creates encrypted audit evidence, while approved external reviewers can run private threshold tests without revealing their thresholds to the business.

The core Zama FHE justification is not encrypted storage. It is:

> External auditors can evaluate encrypted payment records and encrypted rollups against private encrypted thresholds. The business cannot see or game the auditor's thresholds, and the auditor does not need full continuous access to the business ledger.

This directly supports structuring prevention: businesses cannot reliably split or shape transactions around unknown audit thresholds.

## 2. Important Privacy Boundary

The app currently uses normal ERC-20 payments. Therefore:

- Payment amount is public in ERC-20 calldata/events.
- Recipient is public.
- Token address is public.
- Transaction timing is public.

Complyr does not claim to hide normal ERC-20 payment amounts from explorers or indexers.

Complyr does hide and compute over:

- business category;
- jurisdiction;
- encrypted audit amount copy;
- encrypted rollups by category, jurisdiction, and recipient;
- auditor private thresholds;
- encrypted review results/signals.

If full amount privacy is required later, the payment token must be replaced with a Zama-compatible confidential token. That is out of scope for this rebuild.

## 3. Role Model

### Business Owner

The business owner uses Complyr to:

- create single, batch, and recurring payments;
- attach required audit context to every payment;
- view treasury activity;
- decrypt internal audit records and aggregate reports;
- manage approved external reviewers/regulators.

The business owner should not see:

- auditor thresholds;
- auditor test scopes if we choose full audit-method privacy;
- auditor signal queues;
- auditor review logic.

### External Reviewer / Auditor / Regulator

The external reviewer uses Complyr to:

- connect with an approved wallet;
- create encrypted private threshold tests;
- run tests against encrypted records and rollups;
- decrypt their own encrypted result queue;
- inspect relevant evidence if access permits;
- export findings.

The reviewer should not need:

- treasury controls;
- payment creation;
- full ledger access by default.

### Public Observer

A public observer can see:

- normal blockchain transfers;
- public transaction metadata;
- record ids;
- recipients;
- timestamps.

A public observer cannot see:

- encrypted audit classifications;
- private rollups;
- auditor thresholds;
- encrypted test results.

## 4. Product Navigation

### Business App

The business-facing app should have these primary sections:

1. `Payments`
   - Current payment form.
   - Single, batch, recurring payments.
   - Audit context is mandatory for every recipient/payment.

2. `Treasury`
   - Current wallet dashboard.
   - Capital allocation.
   - Asset activity.
   - Payment table.
   - No audit signals added here.

3. `Audit Hub`
   - Renamed from `Compliance Dashboard`.
   - Internal business audit records and reports.
   - One decrypt action can unlock the section.
   - No external auditor signal feed.

4. `Review Access`
   - Renamed/reframed auditor management.
   - Add/remove approved reviewers.
   - Share reviewer portal link.
   - Manage access level.

### Auditor Portal

The auditor portal should be a separate review workflow:

1. `Review Setup`
   - Auditor creates private encrypted threshold tests.

2. `Result Queue`
   - Auditor sees encrypted review results and decrypts their own result booleans/details.

3. `Evidence`
   - Auditor decrypts authorized record details relevant to a result.

4. `Reports`
   - Auditor decrypts authorized aggregate reports if granted.

5. `Ledger`
   - Optional. Only available for full-ledger access.

## 5. Business Audit Hub UX

The business `Audit Hub` replaces the old compliance dashboard.

Tabs:

### 5.1 Overview

Purpose: internal audit readiness summary.

Show:

- monitored payment count;
- encrypted audit record count;
- categories tracked;
- jurisdictions tracked;
- approved reviewers count;
- last audit record timestamp;
- decrypt status.

Do not show:

- external reviewer thresholds;
- external reviewer result queue;
- exact reviewer test scope.

### 5.2 Private Reports

Purpose: internal decrypted aggregate reports.

Reports:

- category totals;
- jurisdiction totals;
- recipient totals;
- monthly totals if implemented;
- payment classification distribution.

Default state:

- encrypted handles / locked cards.

After owner decrypts:

- charts/tables render plaintext totals in the browser.

### 5.3 Audit Trail

Purpose: full record-level ledger.

Show:

- record id / source id;
- public recipient(s);
- public token/payment reference if available;
- timestamp;
- encrypted field handles;
- decrypt action.

After decrypt:

- amount copy;
- category;
- jurisdiction;
- reference id/hash display.

## 6. Review Access UX

This is business-side reviewer management.

Rename current `Access` / `AuditorsManager` to a dedicated `Review Access` section.

Show:

- approved reviewer addresses;
- optional reviewer labels;
- access status;
- access level;
- date granted;
- share portal link.

Do not show:

- reviewer thresholds;
- reviewer result counts;
- reviewer test scopes;
- reviewer private audit logic.

Suggested access levels:

1. `Signal Reviewer`
   - Can create encrypted private tests.
   - Can decrypt their own result queue.

2. `Report Reviewer`
   - Can decrypt authorized aggregate reports.

3. `Ledger Reviewer`
   - Can decrypt full audit records.

For the first implementation, one reviewer role can be used contract-side, but the UI and architecture should leave room for access-level expansion.

## 7. Auditor Portal UX

### 7.1 Access Gate

Current auditor portal already does this:

- connect wallet;
- verify address is approved;
- show access denied if not approved.

Keep this flow, but update language from compliance to review/audit.

### 7.2 Review Setup

Auditor creates encrypted private tests.

Initial test types:

1. `Large Payment Test`
   - Checks whether a payment amount exceeds the auditor's encrypted threshold.

2. `Recipient Exposure Test`
   - Checks whether total paid to a recipient exceeds the auditor's encrypted threshold.

3. `Category Exposure Test`
   - Checks encrypted category totals against encrypted threshold.
   - MVP uses public category scope and encrypted threshold.

4. `Jurisdiction Exposure Test`
   - Checks encrypted jurisdiction totals against encrypted threshold.
   - MVP uses public jurisdiction scope and encrypted threshold.

Threshold UX:

- auditor enters threshold locally;
- threshold is encrypted in-browser using Zama;
- plaintext threshold is never sent to the contract or business frontend;
- contract stores encrypted threshold handle.

### 7.3 Result Queue

The auditor sees tests they created and encrypted result entries.

Rows:

- test id;
- record id or aggregate id;
- test type;
- timestamp;
- encrypted result status;
- decrypt button.

After decrypt:

- `Triggered`;
- `Not triggered`;
- optional severity if implemented.

Important: results should not be public business-facing signals in the MVP. They are auditor-owned encrypted review outputs.

### 7.4 Evidence View

When a result is triggered, auditor can open the related record/report.

Depending on access:

- decrypt amount copy;
- decrypt category;
- decrypt jurisdiction;
- view public recipient;
- view record id/source id;
- export finding.

## 8. Contract Architecture

Current contracts:

- `SmartWallet`
- `SmartWalletFactory`
- `IntentRegistry`
- `ComplianceRegistry`
- interfaces and test mocks

The initial rebuild should keep the broad architecture and avoid a per-business registry refactor unless necessary.

Reason:

- current smart wallet + registry wiring already exists;
- indexer already follows payment events;
- frontend already queries registry by wallet/proxy account;
- hackathon risk is lower if we add FHE audit engine features to the current registry.

Internal naming can remain `ComplianceRegistry` at first to avoid churn. UI copy should move to `Audit Hub`, `Review Access`, and `Review Portal`.

## 9. Encrypted State Layers

The registry should evolve from encrypted storage into an FHE audit engine with three encrypted state layers.

### 9.1 Encrypted Payment Records

Each payment/batch creates a record.

Fields:

- `bytes32 recordId`
- `address token`
- `address[] recipients`
- `euint128[] amounts`
- `euint8[] categories`
- `euint8[] jurisdictions`
- `string[]` or `bytes32[] referenceIds`
- `uint256 timestamp`

Notes:

- `euint128` is safer than `euint64` for generic ERC-20 amounts.
- If the app is strictly USDC-only, `euint64` is acceptable.
- Keep `euint128` unless contract size/gas forces simplification.

### 9.2 Encrypted Rollups

Update on every record creation.

Rollups:

- encrypted total by recipient;
- encrypted total by category;
- encrypted total by jurisdiction;
- optional encrypted global total.

Suggested storage:

```solidity
mapping(address wallet => mapping(address recipient => euint128)) private _recipientTotals;
mapping(address wallet => mapping(uint8 category => euint128)) private _categoryTotals;
mapping(address wallet => mapping(uint8 jurisdiction => euint128)) private _jurisdictionTotals;
mapping(address wallet => euint128) private _globalTotals;
```

Recipient totals are straightforward because recipient is plaintext:

```solidity
_recipientTotals[wallet][recipient] = FHE.add(_recipientTotals[wallet][recipient], amount);
```

Category and jurisdiction totals require FHE selection because category/jurisdiction are encrypted:

```solidity
isCategory = FHE.eq(category, categoryId);
delta = FHE.select(isCategory, amount, FHE.asEuint128(0));
_categoryTotals[wallet][categoryId] = FHE.add(_categoryTotals[wallet][categoryId], delta);
```

Same for jurisdiction.

This is a core Zama justification.

### 9.3 Auditor Private Tests

Auditors create encrypted threshold tests.

Initial test types:

```solidity
enum ReviewTestType {
    LargePayment,
    RecipientExposure,
    CategoryExposure,
    JurisdictionExposure
}
```

Suggested struct:

```solidity
struct ReviewTest {
    uint256 id;
    address wallet;
    address auditor;
    ReviewTestType testType;
    address recipientScope;
    uint8 numericScope;
    euint128 threshold;
    bool active;
    uint256 createdAt;
}
```

For MVP:

- `LargePayment` ignores `recipientScope`.
- `RecipientExposure` uses plaintext `recipientScope`.
- `CategoryExposure` uses public `numericScope` as the category id.
- `JurisdictionExposure` uses public `numericScope` as the jurisdiction id.

Later:

- category/jurisdiction scope can be encrypted too if we want to hide not only the threshold but also the exact class of business activity being reviewed.

## 10. Encrypted Result Queue

Instead of emitting public `SignalTriggered` events, store auditor-owned encrypted results.

Reason:

- business should not see auditor signals;
- public observers should not infer what triggered;
- auditor decrypts only their own review outputs.

Suggested struct:

```solidity
struct ReviewResult {
    uint256 testId;
    bytes32 recordId;
    ebool triggered;
    uint256 timestamp;
}
```

Storage:

```solidity
mapping(address auditor => ReviewResult[]) private _reviewResults;
```

Permissions:

- result `ebool` must be `FHE.allowThis`;
- result must be `FHE.allow(result, auditor)`;
- do not allow result to business owner by default.

Read functions:

- `getReviewResultCount(address auditor)`
- `getReviewResult(address auditor, uint256 index)`
- caller should be the auditor or an approved access path.

## 11. Record Creation Flow

Payment creation should remain mandatory-audit-context.

Flow:

1. User fills payment details.
2. User fills audit context for every recipient.
3. Frontend encrypts amount/category/jurisdiction with Zama.
4. Smart wallet executes payment and records audit data atomically.
5. Registry validates encrypted inputs with `FHE.fromExternal`.
6. Registry stores encrypted record.
7. Registry updates encrypted rollups.
8. Registry evaluates active auditor tests for the wallet.
9. Registry stores encrypted review results for the auditor.

No raw financial transfer path should bypass audit recording.

## 12. Auditor Test Creation Flow

1. Auditor connects through auditor portal.
2. Contract verifies auditor is approved for the business wallet.
3. Auditor selects test type.
4. Auditor enters threshold locally.
5. Frontend encrypts threshold for the registry contract.
6. Auditor submits encrypted threshold handle/proof.
7. Registry validates threshold with `FHE.fromExternal`.
8. Registry stores test and allows:
   - contract itself;
   - auditor.
9. Business does not receive plaintext threshold or result queue.

## 13. FHE Permissions

Every stored encrypted record field:

- `FHE.allowThis(value)`
- `FHE.allow(value, businessOwner)`
- `FHE.allow(value, activeAuditor)` if the auditor has ledger/report access

Every rollup:

- `FHE.allowThis(total)`
- `FHE.allow(total, businessOwner)`
- `FHE.allow(total, auditor)` only if auditor has report access

Every auditor threshold:

- `FHE.allowThis(threshold)`
- `FHE.allow(threshold, auditor)`
- do not allow threshold to business owner

Every review result:

- `FHE.allowThis(triggered)`
- `FHE.allow(triggered, auditor)`
- do not allow result to business owner by default

Known limitation:

- Once `FHE.allow` grants access to a ciphertext, removing an auditor cannot revoke already-granted historical decryption rights at the FHE/KMS level.
- Contract comments and UI copy should state that removal only blocks future grants/results.

## 14. Access Control

Current auditor model can be extended.

Suggested access enum:

```solidity
enum ReviewerAccess {
    None,
    Signal,
    Report,
    Ledger
}
```

MVP option:

- keep a simple approved auditor list;
- treat all approved auditors as able to create private tests and decrypt records.

Better option:

- implement access levels now if time allows.

Recommended practical path:

1. First implement simple approved reviewer list.
2. Add access enum if frontend/contract complexity remains manageable.

## 15. Contract API Sketch

### Existing / Adapted Registry Functions

```solidity
function recordTransaction(...) external;
function addAuditor(address proxyAccount, address auditor) external;
function removeAuditor(address proxyAccount, address auditor) external;
function getAuditors(address proxyAccount) external view returns (address[] memory);
function getRecordCount(address proxyAccount) external view returns (uint256);
function getRecord(address proxyAccount, uint256 index) external view returns (...);
```

### New Rollup Read Functions

```solidity
function getEncryptedRecipientTotal(address wallet, address recipient) external view returns (bytes32);
function getEncryptedCategoryTotal(address wallet, uint8 category) external view returns (bytes32);
function getEncryptedJurisdictionTotal(address wallet, uint8 jurisdiction) external view returns (bytes32);
function getEncryptedGlobalTotal(address wallet) external view returns (bytes32);
```

### New Review Test Functions

```solidity
function createLargePaymentTest(
    address wallet,
    externalEuint128 thresholdHandle,
    bytes calldata thresholdProof
) external returns (uint256 testId);

function createRecipientExposureTest(
    address wallet,
    address recipient,
    externalEuint128 thresholdHandle,
    bytes calldata thresholdProof
) external returns (uint256 testId);

function deactivateReviewTest(uint256 testId) external;
function getReviewTest(uint256 testId) external view returns (...);
function getAuditorTestIds(address auditor) external view returns (uint256[] memory);
```

### New Review Result Functions

```solidity
function getReviewResultCount(address auditor) external view returns (uint256);
function getReviewResult(address auditor, uint256 index) external view returns (...);
```

## 16. Evaluating Tests During Record Creation

For each recipient/payment item:

Large payment:

```solidity
triggered = FHE.gt(amount, test.threshold);
_storeReviewResult(test.id, recordId, triggered, test.auditor);
```

Recipient exposure:

```solidity
newTotal = _recipientTotals[wallet][recipient];
triggered = FHE.gt(newTotal, test.threshold);
_storeReviewResult(test.id, recordId, triggered, test.auditor);
```

Important:

- Only evaluate tests relevant to the wallet.
- Recipient exposure tests only evaluate when `recipient == recipientScope`.
- Avoid unbounded loops if many tests exist.

Practical cap:

- max active tests per wallet or auditor.
- example: `MAX_ACTIVE_TESTS_PER_WALLET = 20`.

## 17. Indexer Impact

The indexer likely does not need a rebuild for the MVP.

Keep indexer responsible for:

- normal payment transaction history;
- wallet activity;
- intent lifecycle;
- public payment metadata.

The FHE audit engine is read directly from contracts by the frontend because:

- encrypted handles are contract state;
- userDecrypt needs contract handles;
- auditor result queues are privacy-sensitive and not useful as public indexed data.

Optional later indexer additions:

- index public creation of review tests without thresholds;
- index public record-added events;
- index counts only.

Do not make indexer a blocker.

## 18. Frontend Implementation Plan

### 18.1 Rename Copy

Replace user-facing `Compliance` terminology with:

- `Audit Hub`
- `Audit Context`
- `Review Access`
- `Reviewer`
- `Private Reports`
- `Audit Trail`
- `Review Portal`

Keep contract names if needed.

### 18.2 Payment Form

Keep current payment UX, but rename:

- `Compliance Records (Encrypted)` -> `Audit Context`

Required fields per recipient:

- reference id;
- category;
- jurisdiction;
- amount is already part of payment.

### 18.3 Treasury

Leave mostly unchanged.

Do not add signals to payment table.

### 18.4 Audit Hub

Tabs:

- `Overview`
- `Private Reports`
- `Audit Trail`

Remove business-facing signals tab.

### 18.5 Review Access

Move current auditor management out of Audit Hub into a dedicated section.

Show:

- approved reviewers;
- add reviewer;
- remove reviewer;
- share portal link.

### 18.6 Auditor Portal

Add:

- private threshold creation;
- encrypted result queue;
- decrypt results;
- evidence view.

## 19. MVP Build Order

### Phase 1: Contract Audit Engine

1. Add encrypted rollups:
   - recipient totals;
   - category totals;
   - jurisdiction totals.

2. Add review tests:
   - large payment threshold;
   - recipient exposure threshold.
   - category exposure threshold with public category scope;
   - jurisdiction exposure threshold with public jurisdiction scope.

3. Add encrypted review result queue.

4. Add read functions for rollups/tests/results.

5. Add tests.

### Phase 2: Frontend Zama Integration

1. Add threshold encryption helper.
2. Add auditor create-test UI.
3. Add auditor result queue UI.
4. Add result decrypt flow.
5. Add private report decrypt flow for owner rollups.

### Phase 3: UX Rename/Reframe

1. Rename Compliance Dashboard -> Audit Hub.
2. Rename Access -> Review Access.
3. Rename auditor portal copy.
4. Update landing/docs copy.

### Phase 4: Polish Demo Flow

1. Seed test payments.
2. Auditor creates hidden threshold.
3. Business performs transaction.
4. Auditor decrypts result queue.
5. Owner decrypts internal private reports.

## 20. Demo Script

1. Business opens Complyr.
2. Business creates a wallet and receives test USDC.
3. Business sends normal business payments with required audit context.
4. Business opens `Audit Hub`.
5. Business decrypts private reports: category/jurisdiction/recipient totals.
6. Business opens `Review Access` and approves an external reviewer.
7. Reviewer opens portal.
8. Reviewer creates an encrypted large-payment threshold.
9. Reviewer creates an encrypted recipient-exposure threshold.
10. Business continues making payments.
11. Registry evaluates encrypted records/rollups against reviewer thresholds.
12. Reviewer decrypts result queue and sees which tests triggered.
13. Reviewer opens evidence for triggered result.

Core pitch:

> The business can operate normally and keep internal audit reports. External reviewers can run hidden threshold tests that the business cannot game. Zama enables the contract to compare encrypted business records and rollups against encrypted auditor thresholds.

## 21. Non-Goals

Do not implement these in the MVP:

- confidential ERC-20 payment amounts;
- per-business registry refactor;
- public audit signal events;
- fully private encrypted test scopes;
- complex time-window logic;
- arbitrary auditor scripts/rules;
- indexer rebuild;
- legal/regulatory certification claims.

## 22. Open Technical Questions

Before implementation, verify exact Zama API support in current installed versions:

- `FHE.add` for `euint128`;
- `FHE.eq` for `euint8`;
- `FHE.gt` for `euint128`;
- `FHE.select` with `ebool`;
- storing and returning `ebool` handles;
- converting encrypted values to `bytes32` with `FHE.toBytes32`;
- frontend `userDecrypt` support for `ebool` handles.

If `ebool` user decryption is awkward, store result as `euint8`:

- `1` = triggered;
- `0` = not triggered.

This can be produced with:

```solidity
result = FHE.select(triggeredBool, FHE.asEuint8(1), FHE.asEuint8(0));
```

Then auditor decrypts the `euint8`.

## 23. Preferred MVP Result Representation

Use encrypted `euint8` result instead of raw `ebool`.

Reason:

- easier frontend display;
- consistent with existing decrypt patterns;
- avoids uncertainty around `ebool` handle support.

Result values:

- `0`: not triggered;
- `1`: triggered.

Suggested struct:

```solidity
struct ReviewResult {
    uint256 testId;
    bytes32 recordId;
    euint8 result;
    uint256 timestamp;
}
```

## 24. Summary

The rebuild should focus on one strong FHE-native capability:

> private external audit thresholds evaluated against encrypted payment records and encrypted rollups.

Business UX stays simple:

- payments;
- treasury;
- internal audit reports;
- review access.

Auditor UX becomes the showcase:

- create encrypted tests;
- decrypt private result queue;
- inspect authorized evidence.

This architecture justifies Zama without claiming normal ERC-20 payment amounts are hidden.
