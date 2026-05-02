<div align="center">

<img src="./apps/web/public/complyrlogo-light.svg" alt="Complyr" width="90" height="90" />

# Complyr

### A smart-account based business payment app that embeds encrypted compliance metadata into every treasury flow.

<br />

[![Live Demo](https://img.shields.io/badge/Live%20Demo-usecomplyr.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://usecomplyr.vercel.app)
[![Product Docs](https://img.shields.io/badge/Product%20Docs-Read%20Here-6366f1?style=for-the-badge&logo=gitbook&logoColor=white)](https://usecomplyr.vercel.app/docs)

<br />

![Ethereum Sepolia](https://img.shields.io/badge/Ethereum%20Sepolia-3C3C3D?style=flat-square&logo=ethereum&logoColor=white)
![ERC-4337](https://img.shields.io/badge/ERC--4337-3C3C3D?style=flat-square&logo=ethereum&logoColor=white)
![Pimlico](https://img.shields.io/badge/Pimlico-AA-111827?style=flat-square)
![Chainlink Automation](https://img.shields.io/badge/Chainlink-Automation-375BD2?style=flat-square)
![Envio](https://img.shields.io/badge/Envio-1A1A2E?style=flat-square)
![Privy](https://img.shields.io/badge/Privy-F5F5F5?style=flat-square&logoColor=black)

</div>

---

## Executive summary

Complyr solves a simple but critical gap in onchain business payments: blockchains capture **who** got paid and **how much**, but not **why**.

For each payment, Complyr encrypts and stores compliance context (category, jurisdiction, reference) so companies can preserve privacy while still producing audit-ready records when needed.

Current deployment target: **Ethereum Sepolia**.

---

## Core capabilities

- ERC-4337 smart-wallet payment flows (single, batch, recurring)
- Client-side AES-256-GCM encryption of compliance metadata
- Onchain compliance ledger (`ComplianceRegistry`) with immutable linkage to transaction hashes
- Selective auditor access using ECIES key wrapping
- Transaction activity indexing via Envio + GraphQL
- Gas sponsorship through Pimlico bundler/paymaster
- Recurring payment execution through Chainlink Automation-compatible registry methods

---

## Architecture

Complyr is split into three layers:

1. **Application layer (Next.js + Privy + AES/ECIES)**
   - Captures payment intent and compliance metadata
   - Encrypts compliance payloads in-browser before submission

2. **Smart contract layer (Ethereum Sepolia)**
   - `SmartWallet` (ERC-4337 account)
   - `SmartWalletFactory`
   - `IntentRegistry` (implements `checkUpkeep` / `performUpkeep`)
   - `ComplianceRegistry`
   - `MockUSDC` for testnet treasury flows

3. **Data layer (Envio HyperIndex)**
   - Indexes wallet and registry events
   - Exposes typed GraphQL activity data to the dashboard

---

## Compliance model

Each compliance record contains:

- `txHash`: deterministic link to the payment transaction or intent execution
- `recipients[]` and `amounts[]`: public transfer context
- `encryptedPayload`: AES-256-GCM encrypted metadata (jurisdiction/category/reference)
- `timestamp`: block-time anchor for audit chronology

Complyr guarantees record existence, immutability, and transaction linkage. It does not validate business truthfulness of submitted metadata.

---

## Tech stack

| Layer | Technology |
|---|---|
| Chain | Ethereum Sepolia |
| Account abstraction | ERC-4337, EntryPoint v0.7 |
| Bundler + paymaster | Pimlico |
| Automation | Chainlink Automation interface (`checkUpkeep`/`performUpkeep`) |
| Indexing | Envio HyperIndex |
| Frontend | Next.js 16, Tailwind CSS, shadcn/ui |
| Auth + embedded wallets | Privy |
| Database | Neon PostgreSQL via Drizzle ORM (contacts) |
| Contracts | Solidity + Foundry + OpenZeppelin |

---

## Local development

Prerequisites: Node.js 18+, pnpm, Foundry.

```bash
git clone https://github.com/Stoneybro/complyr
cd complyr
pnpm install
```

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
COMPLYR_DATABASE_URL=postgresql://...

# optional override; client has a default fallback URL
NEXT_PUBLIC_ENVIO_API_URL=https://indexer.dev.hyperindex.xyz/63b8cce/v1/graphql

# Pimlico
NEXT_PUBLIC_PIMLICO_API_KEY=...
NEXT_PUBLIC_PIMPLICO_SPONSOR_ID=...

# Ethereum Sepolia deployments
NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_COMPLIANCE_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_SMART_WALLET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...
```

Run app and contracts checks:

```bash
pnpm dev
pnpm forge:build
pnpm forge:test
```

---

## Contracts deployment (Ethereum Sepolia)

From repo root:

```bash
PRIVATE_KEY=0xyour_private_key forge script packages/contracts/script/DeployAll.s.sol:DeployAll --rpc-url sepolia --broadcast
```

This deploys and wires:

- `IntentRegistry`
- `ComplianceRegistry`
- `SmartWallet` implementation
- `SmartWalletFactory`
- `MockUSDC`

After deployment, update the `NEXT_PUBLIC_*` address variables and the address placeholders in `packages/indexer/config.yaml` with emitted Sepolia addresses.
