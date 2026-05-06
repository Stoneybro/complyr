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

At the product level, Complyr should be understood as an audit-first payments system rather than a generic audit tracker. Payment execution is the operational surface, but the differentiating capability is the external reviewer flow:

- businesses create payments through smart accounts;
- the system writes encrypted audit context onchain alongside those payments;
- approved external reviewers create private threshold tests against that encrypted data;
- reviewer-specific result queues and encrypted rollups support downstream audit workflows without turning the business ledger into a public reporting surface.

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
- support the external reviewer portal, including private threshold creation, result retrieval, report decryption, and ledger decryption where access allows;
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

- `src/app/auditors/[proxyAccount]/AuditorPortalClient.tsx`
  Implements the external reviewer workflow: reviewer verification, test creation, result inspection, encrypted rollup access, and optional ledger decryption.

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
  Despite the legacy contract name, this is the core audit infrastructure contract. It stores encrypted audit records and encrypted reviewer data. It also maintains wallet-to-master ownership, reviewer access, encrypted rollups, reviewer tests, and reviewer result queues.

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
- reviewer access levels;
- encrypted rollups, thresholds, and review results.

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
- reviewer thresholds;
- reviewer result signals;
- encrypted rollups stored for reporting and threshold checks.

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

### 7.5 External Reviewer Flow

The external reviewer flow is the showcase path in the current architecture.

It is the clearest expression of what makes Complyr different from a standard treasury dashboard: the system does not stop at recording encrypted audit context. It also lets an approved third party define private review rules, have the contract evaluate new records against those rules, and then decrypt only the signals and evidence that their access level permits.

The flow works as follows:

1. A business owner adds a reviewer in `AuditRegistry` and assigns an access level.
2. The reviewer opens the dedicated portal route for the business wallet.
3. The portal verifies that the connected reviewer address is active for that wallet and loads its access level from `AuditRegistry`.
4. If the reviewer has signal-creation rights, they create encrypted review tests in the browser. The current codebase supports:
   - large payment thresholds;
   - recipient exposure thresholds;
   - category exposure thresholds;
   - jurisdiction exposure thresholds.
5. Threshold values are encrypted client-side with the Zama SDK before submission. The reviewer creates tests without publishing the threshold in plaintext.
6. `AuditRegistry` stores the test under the reviewer account and attaches it to the target company wallet's active test set.
7. As new payment records are written, `AuditRegistry` evaluates each record against the active tests for that company wallet.
8. Triggered or non-triggered outcomes are written into reviewer-owned encrypted result queues, rather than emitted as public business-facing signals.
9. When the reviewer returns to the portal, the app loads:
   - the reviewer test inventory;
   - the encrypted result queue;
   - encrypted rollup handles for reports when access permits;
   - ledger records when the reviewer has ledger-level access.
10. Decryption authorization happens client-side. The reviewer signs the Zama authorization payload and decrypts only the handles they are permitted to read.
11. Depending on access level, the reviewer can inspect:
   - signal-only results;
   - encrypted aggregate reports;
   - record-level ledger evidence.

This design is important because it preserves the product's audit-first posture:

- the business can operate through a normal payment workflow;
- reviewer logic can remain private;
- evaluation can happen against encrypted amounts and encrypted rollups;
- the reviewer experience is isolated from treasury controls;
- the app can support selective disclosure instead of granting blanket ledger access by default.

### 7.6 Why The Reviewer Flow Matters

Most systems can store metadata next to payments. The stronger architectural idea in Complyr is that external oversight is part of the runtime model, not an afterthought built on exported spreadsheets.

In this repository, that idea shows up concretely in three places:

1. `AuditRegistry` does not only store records; it also stores reviewer access, encrypted tests, encrypted rollups, and encrypted results.
2. The auditor portal is not a read-only dashboard; it is an active workflow for creating checks and decrypting reviewer-scoped outputs.
3. The business-facing audit interface and the reviewer-facing interface are intentionally separated, which keeps treasury operations, internal reporting, and external review concerns distinct.

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
- audit and reviewer dashboards read encrypted records from the contract directly instead of relying only on the indexer.
