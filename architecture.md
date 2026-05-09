# Complyr Architecture

## 1. Overview

Complyr is a monorepo for an onchain business payments product with embedded audit infrastructure.

The system has four runtime parts:

1. `apps/web`
   The user-facing Next.js application. It handles authentication, wallet onboarding, payment creation, audit views, and a small set of server routes.

2. `packages/contracts`
   Solidity contracts for smart-account deployment, payment execution, recurring payment scheduling, and encrypted audit storage.

3. `packages/indexer`
   An Envio indexer that turns contract events into a GraphQL activity feed for the dashboard.

4. PostgreSQL
   A relational store used by the web app for contacts and related app data.

This document describes the architecture implemented in the current repository.

At the product level, Complyr should be understood as an audit-first payments system rather than a generic audit tracker. Payment execution is the operational surface, but the differentiating capability is the Auditor Portal flow:

- businesses create payments through smart accounts;
- the system writes to an encrypted ledger onchain alongside those payments;
- approved external auditors create private audit limits against that encrypted data using Zama encryption;
- auditor-specific finding queues and encrypted analytics rollups support downstream workflows without turning the business ledger into a public reporting surface.

## 2. System Context

Complyr sits between four external systems:

- Ethereum Sepolia for payment settlement and audit records
- Pimlico for ERC-4337 bundling and paymaster support
- Privy for authentication and embedded wallets
- Zama FHE relayer tooling for client-side encryption and authorized decryption

At a high level:

- users interact with the Next.js app;
- the app signs and submits ERC-4337 UserOperations through Pimlico;
- smart wallets execute payments and write encrypted audit data onchain;
- the indexer materializes selected events into GraphQL for dashboard history;
- audit and reviewer views read encrypted records directly from the chain and decrypt them client-side when the connected wallet is authorized.

## 3. Repository Structure

```text
complyr/
├── apps/
│   └── web/                Next.js application and docs site
├── packages/
│   ├── contracts/          Solidity contracts and Foundry tests/scripts
│   └── indexer/            Envio indexer, schema, and event handlers
├── architecture.md         Internal architecture document
└── readme.md               Product and setup overview
```

## 4. Runtime Components

### 4.1 Web Application

The web application is a Next.js App Router app in `apps/web`.

Primary responsibilities:

- authenticate users with Privy;
- initialize an ERC-4337 smart account client;
- create single, batch, and recurring payments;
- encrypt audit context in the browser before contract submission;
- query indexed activity from Envio GraphQL;
- read encrypted audit records directly from `AuditRegistry`;
- support the external auditor portal, including private audit limit creation, finding retrieval, encrypted analytics decryption, and ledger decryption where access allows;
- manage contacts through server routes backed by PostgreSQL;
- serve the public docs site from the same app.

Important internal modules:

- `src/app/provider.tsx`
  Registers `PrivyProvider`, `QueryClientProvider`, and the smart-account provider.

- `src/lib/SmartAccountProvider.tsx`
  Creates and caches the ERC-4337 client used by payment flows.

- `src/lib/customSmartAccount.ts`
  Adapts the deployed smart wallet to the `permissionless` client stack and defines factory deployment behavior.

- `src/hooks/payments/*`
  Implements single transfer, batch transfer, recurring payment, and intent cancellation flows.

- `src/lib/fhe-audit.ts`
  Uses the Zama relayer SDK in the browser to encrypt audit inputs and request decrypt authorization.

- `src/hooks/useAuditLogs.ts`
  Reads `AuditRegistry` records directly and decrypts them client-side for authorized users.

- `src/app/auditors/[proxyAccount]/AuditorsPortalClient.tsx`
  Implements the external auditor workflow: auditor verification, test creation, finding inspection, encrypted analytics access, and optional ledger decryption.

- `src/lib/envio/client.ts`
  Queries the Envio GraphQL endpoint for wallet activity.

### 4.2 Smart Contract Layer

The contract package in `packages/contracts` is the system of record for settlement and encrypted audit state.

Core contracts:

- `SmartWallet`
  ERC-4337 account implementation. Executes direct transfers, batch transfers, and registry-triggered recurring transfers.

- `SmartWalletFactory`
  Deploys deterministic ERC-1167 clones of `SmartWallet`, registers each wallet with `AuditRegistry`, and can optionally drip ETH or a stablecoin on first deployment.

- `IntentRegistry`
  Stores recurring payment intents, locks committed funds, exposes Chainlink Automation-compatible execution hooks, and calls back into wallets to execute scheduled transfers.

- `AuditRegistry`
  Despite the legacy contract name, this is the core audit infrastructure contract. It stores the encrypted ledger and encrypted auditor data. It also maintains wallet-to-master ownership, auditor access levels, encrypted analytics rollups, auditor private limits (tests), and auditor finding queues.

- `MockUSDC`
  Test token used by the Sepolia demo flows.

### 4.3 Indexer

The Envio indexer in `packages/indexer` subscribes to selected Sepolia events and builds a GraphQL read model.

Current indexed entities:

- `Wallet`
- `Transaction`
- `Intent`

Current purpose:

- power wallet activity history and dashboard summaries;
- normalize wallet, intent, and transfer events into frontend-friendly transaction records.

The indexer is not the source of truth for encrypted audit data. Audit records are read from `AuditRegistry` directly.

### 4.4 PostgreSQL Data Store

The web app uses Drizzle with PostgreSQL for application-owned data.

Current schema includes:

- contacts
- contact addresses
- chats
- messages

The active product use in this repository is the contacts subsystem, exposed via `apps/web/src/app/api/contacts`.

## 5. Data Ownership

The system uses the standard split below.

### Onchain Data

Owned by contracts and treated as canonical:

- smart wallet deployment state;
- payment execution events;
- recurring intent state;
- audit records;
- company master mappings;
- auditor access levels;
- encrypted analytics rollups, private audit limits, and review findings.

### Indexed Read Model

Owned by the Envio indexer and treated as derived:

- wallet activity feed;
- normalized transaction history;
- indexed intent metadata for dashboard queries.

### Application Database

Owned by the web app and treated as offchain convenience data:

- contacts;
- saved recipient metadata;
- app-only relational records.

## 6. Privacy and Trust Boundaries

Complyr does not make all payment data private.

Public onchain data includes:

- wallet addresses;
- token addresses;
- recipients;
- transaction timing;
- transaction hashes;
- plaintext `referenceIds` stored in audit records.

Encrypted onchain data includes:

- payment amounts copied into audit records;
- category values;
- jurisdiction values;
- auditor's private limits;
- auditor finding signals;
- encrypted analytics rollups stored for reporting and threshold checks.

Important trust boundaries:

- encryption and decryption authorization happen client-side through the Zama SDK;
- payment execution authority is enforced by `SmartWallet`, `IntentRegistry`, and ERC-4337 signature validation;
- contacts and relay funding are offchain web-server concerns and do not change onchain authorization rules.

## 7. Primary Request Flows

### 7.1 Wallet Onboarding

1. User authenticates in the web app with Privy.
2. The app predicts or deploys the user smart wallet through `SmartWalletFactory`.
3. The factory registers the wallet in `AuditRegistry`.
4. The frontend initializes a `permissionless` smart-account client for subsequent UserOperations.

### 7.2 Single or Batch Payment

1. User fills payment details and audit context in the web app.
2. The browser encrypts amounts, categories, and jurisdictions using the Zama relayer SDK.
3. The frontend submits a wallet call through the ERC-4337 client and Pimlico bundler.
4. `SmartWallet` executes the transfer.
5. `SmartWallet` records audit data in `AuditRegistry`.
6. Envio indexes the emitted payment events for transaction history.

### 7.3 Recurring Payment

1. User creates a recurring intent from the web app.
2. The app encrypts the audit payload in the browser.
3. `IntentRegistry` stores the schedule and increases wallet fund commitments.
4. A keeper-compatible caller triggers `performUpkeep`.
5. `IntentRegistry` instructs `SmartWallet` to execute the scheduled batch transfer.
6. The registry records the encrypted audit entry for that execution.
7. Envio indexes the resulting intent and payment events.

### 7.4 Internal Audit View

1. The business user opens the audit page.
2. The app reads record counts and record payloads from `AuditRegistry`.
3. Records are displayed with encrypted handles by default.
4. The connected authorized wallet signs Zama decrypt permissions.
5. The browser decrypts the encrypted handles locally for display.

### 7.5 External Auditor Portal Flow

The external auditor portal is the primary showcase path in the current architecture.

It is the clearest expression of what makes Complyr different from a standard treasury dashboard: the system does not stop at recording encrypted audit context. It also provides an active workflow for authorized external auditors to define private audit tests, have the contract natively evaluate the business's encrypted ledger against those rules, and decrypt only the flagged transactions or aggregate analytics, preserving strict data privacy.

The flow is orchestrated using Zama's Fully Homomorphic Encryption (FHE) on the blockchain:

1. A business owner adds an auditor in `AuditRegistry` and assigns an access level (Signal-only, Analytics, or Full Ledger access).
2. The auditor opens the dedicated portal route (`/auditors/[proxyAccount]`) for the business wallet.
3. The portal verifies the connected auditor's address is active and reads their access permissions directly from the contract.
4. If the auditor has signal-creation rights, they can create private audit limits (tests) in the browser. Tests include large payment limits, and specific exposure limits for recipients, categories, or jurisdictions.
5. **Zama Encryption at Source:** Threshold values are encrypted client-side using the Zama relayer SDK before submission. The auditor creates tests without ever publishing the threshold in plaintext to the chain.
6. `AuditRegistry` stores the encrypted test under the auditor's account.
7. **Encrypted Ledger Evaluation:** As new payment records are added to the encrypted ledger, `AuditRegistry` evaluates each record against the active auditor tests using FHE operations (`FHE.gt`, `FHE.eq`, etc.). The blockchain computes the results over encrypted data without ever decrypting the underlying payment amounts or categories.
8. Findings (triggered tests) are written into auditor-owned encrypted finding queues.
9. When the auditor returns to the portal, depending on their access level, the app loads:
   - The private audit tests they created;
   - The auditor's encrypted findings queue;
   - Encrypted analytics rollups (aggregating payments by category/jurisdiction);
   - Ledger records (if granted Full access).
10. **Client-Side Decryption:** Decryption authorization happens locally. The auditor signs a Zama EIP-712 authorization payload and decrypts only the FHE handles they are permitted to read. This securely decrypts the findings, analytics, or the ledger evidence (amounts, categories, jurisdictions) in the browser.

This design is crucial for a compliance-focused protocol:

- The business operates through normal payment workflows with the benefit of an encrypted on-chain ledger.
- Auditor logic and thresholds remain entirely private.
- The auditor portal provides granular access controls (Analytics vs Ledger Records) so businesses only disclose what is necessary.
- Evaluation happens deterministically against encrypted amounts and encrypted rollups via FHE, guaranteeing trustless verification without sacrificing privacy.

### 7.6 Why The Auditor Portal Matters

Most systems can simply store metadata next to payments. The foundational architectural breakthrough in Complyr is that external auditing is integrated directly into the runtime model using Fully Homomorphic Encryption, rather than being an afterthought built on exported spreadsheets or trusted off-chain execution environments.

In this repository, this breakthrough is showcased in four ways:

1. **The Encrypted Ledger:** `AuditRegistry` doesn't just act as a datastore; it acts as an encrypted ledger where payment amounts and categorizations remain hidden from the public but mathematically verifiable.
2. **Zama Encryption:** By leveraging Zama's FHE, Complyr allows smart contracts to perform conditional logic (e.g., checking if an encrypted payment exceeds an encrypted threshold) natively on the blockchain, eliminating the need for a trusted third party.
3. **Auditor-Specific Workflows:** The auditor portal provides an active, read-and-execute environment for oversight. It is not just a read-only dashboard but an interface for creating complex private checks and securely decrypting scoped outputs.
4. **Strict Separation of Concerns:** The business-facing treasury interfaces and the auditor-facing portals are intentionally separated. This ensures treasury operations remain distinct from external review, and businesses can enforce selective disclosure—granting an auditor access to high-level analytics without revealing the underlying ledger records.

## 8. Integration Points

### External Services

- Privy for authentication and embedded wallets
- Pimlico bundler/paymaster for ERC-4337 submission
- Ethereum Sepolia RPC
- Zama relayer SDK for FHE input creation and decrypt authorization
- PostgreSQL for contacts data

### Web API Routes

Current server routes in the web app:

- `/api/contacts`
- `/api/contacts/[contactId]`
- `/api/relay/fund-wallet`
- `/api/search`

These routes support the frontend, but they are not the main transaction path. Payment execution, audit storage, and reviewer evaluation remain blockchain-first.

## 9. Deployment Model

The repository is designed as a pnpm workspace:

- `apps/web` can be deployed as a Next.js application;
- `packages/contracts` is deployed to Sepolia with Foundry scripts;
- `packages/indexer` runs as an Envio indexer against Sepolia events;
- PostgreSQL is provided separately through environment configuration.

The frontend can point at either a hosted Envio GraphQL endpoint or a local indexer endpoint through environment variables.

## 10. Architectural Notes

This codebase follows a standard split:

- presentation and orchestration in Next.js;
- authority and settlement onchain;
- derived read models in an indexer;
- convenience records in a relational store.

The two important non-standard aspects are intentional product choices:

- audit payloads are encrypted in the browser before they are written onchain;
- audit and auditor dashboards read encrypted records from the contract directly instead of relying only on the indexer.
