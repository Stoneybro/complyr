<div align="center">

<img src="./apps/web/public/complyrlogo-light.svg" alt="Complyr" width="90" height="90" />

# Complyr

### Business payments with a built-in private audit layer.

<br />

[![Live Demo](https://img.shields.io/badge/Live%20Demo-usecomplyr.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://usecomplyr.vercel.app)
[![Product Docs](https://img.shields.io/badge/Product%20Docs-Read%20Here-6366f1?style=for-the-badge&logo=gitbook&logoColor=white)](https://usecomplyr.vercel.app/docs)

<br />

![Zama FHE](https://img.shields.io/badge/Zama-Fully%20Homomorphic%20Encryption-FF6B35?style=flat-square)
![Ethereum Sepolia](https://img.shields.io/badge/Ethereum%20Sepolia-3C3C3D?style=flat-square&logo=ethereum&logoColor=white)
![ERC-4337](https://img.shields.io/badge/ERC--4337-Account%20Abstraction-3C3C3D?style=flat-square&logo=ethereum&logoColor=white)
![Envio](https://img.shields.io/badge/Envio-Indexer-1A1A2E?style=flat-square)
![Privy](https://img.shields.io/badge/Privy-Auth-F5F5F5?style=flat-square&logoColor=black)

</div>

---

## What is Complyr

Complyr is an onchain business payments system with a built-in private audit layer.

Every payment made through Complyr carries encrypted audit information (the expense category and jurisdiction) stored permanently on the blockchain alongside the transaction itself. External auditors can run audit tests against that information without it ever being decrypted. The contract evaluates those tests directly on encrypted data. The auditor sees the outcome. The payment details stay private.

This is made possible by **Zama's Fully Homomorphic Encryption**. FHE is the only cryptographic primitive that allows computation on encrypted data without decrypting it first. Complyr uses it not just to store private information, but to execute audit logic on top of it.

---

## The problem it solves

Onchain businesses face two problems that conventional tools cannot solve together.

**The audit context gap.** A blockchain transaction permanently records who received funds and how much. It does not record why. Was it payroll? A vendor invoice? A contractor payout? That context lives in a spreadsheet, reconciled manually after the fact. The audit trail is only as strong as the discipline in maintaining that separate record, and it can always be disputed.

**The privacy cost of auditing.** When a business needs to be reviewed by an external auditor or a compliance team, the only way to verify payment records is to hand over the ledger. But a ledger contains sensitive information about every transaction, including ones that are entirely legitimate and not the subject of the review. The auditor sees everything, or nothing.

Auditors do not need to see everything. They need answers to specific questions: how much was spent on a given expense category, did any payment exceed a threshold, are there unusual concentrations of spending in a particular jurisdiction. These are targeted questions, not full-ledger reviews.

Conventional encryption cannot help. To answer any question about encrypted data, you have to decrypt it first. That makes privacy and auditing mutually exclusive. FHE removes that constraint.

---

## How FHE makes it work

When a business sends a payment, the expense category and jurisdiction are encrypted in the browser using the Zama relayer SDK before the transaction is submitted. The plaintext values never leave the client. What is stored onchain are FHE ciphertexts that authorized wallets can decrypt, and that the contract can compute over directly. The audit context is permanent, immutable, and co-located with the payment record.

When a business grants an auditor access, the auditor creates private audit tests from their portal: flag any single payment above a set amount, flag when total payments to a specific recipient cross a limit, flag when spending in a category or jurisdiction crosses a threshold. Those limits are encrypted in the auditor's browser before submission. The business cannot read the auditor's test criteria, which means it cannot structure payments to avoid triggering them.

Every time a payment is recorded, `AuditRegistry` runs all active tests against the encrypted payment data using FHE operations (`FHE.gt`, `FHE.eq`, `FHE.and`, `FHE.select`, `FHE.add`) without ever decrypting the inputs. The result is an encrypted signal stored in the auditor's findings list. Nothing is revealed until the auditor chooses to decrypt.

When the auditor reviews their findings, they sign a decryption request with their wallet. The Zama KMS validates the signature against the contract's access list and returns only the values that wallet is permitted to read. The auditor sees only the records that triggered their tests. Everything else stays private.

**Example.** A company pays contractors in stablecoins. Each payment is tagged with an expense category (encrypted) and a jurisdiction (encrypted). An auditor suspects unusually high contractor spend and sets a test: flag any payments categorized as Contractor where cumulative spend to a recipient exceeds $500. The $500 limit is encrypted in the auditor's browser. The Contractor label on each payment record is also encrypted. The contract uses Zama FHE to match the category and aggregate the amounts entirely on ciphertext, without decrypting either the label or the amounts. If the total crosses the threshold, the test triggers. The auditor decrypts the finding and sees only the specific records that caused the flag. They learn nothing about payments to other recipients, in other categories, or below the limit.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Next.js Web App                            │
│  Privy auth · ERC-4337 client · payment UI · auditor portal         │
│  Zama browser encryption · docs                                      │
└───────────────┬───────────────────────────────┬──────────────────────┘
                │                               │
                │ UserOperations, reads         │ GraphQL queries
                ▼                               ▼
┌──────────────────────────────────┐   ┌──────────────────────────────┐
│        Ethereum Sepolia          │   │         Envio Indexer        │
│ SmartWallet (ERC-4337)           │   │ Wallet / Transaction / Intent│
│ SmartWalletFactory               │   │ derived read model           │
│ IntentRegistry                   │   └──────────────────────────────┘
│ AuditRegistry (FHE core)         │
│ MockUSDC                         │
└───────────────┬──────────────────┘
                │ app-owned data
                ▼
┌──────────────────────────────────┐
│ PostgreSQL via Drizzle ORM       │
│ contacts                         │
└──────────────────────────────────┘
```

The FHE logic is concentrated in `AuditRegistry.sol`. It stores encrypted ledger entries, maintains encrypted running totals by recipient, category, and jurisdiction, manages auditor access levels with `FHE.allow`, and evaluates private audit tests against encrypted data.

---

## Tech stack

| Layer | Technology |
|---|---|
| Chain | Ethereum Sepolia |
| FHE | Zama (`@fhevm/solidity`, `@zama-fhe/relayer-sdk`) |
| Account abstraction | ERC-4337, EntryPoint v0.7, Pimlico bundler/paymaster |
| Indexing | Envio HyperIndex + GraphQL |
| Frontend | Next.js, Tailwind CSS, shadcn/ui |
| Auth | Privy |
| Database | Neon PostgreSQL via Drizzle ORM |
| Contracts | Solidity, Foundry, OpenZeppelin |

---

## Local development

**Prerequisites:** Node.js 18+, pnpm, Foundry.

```bash
git clone https://github.com/Stoneybro/complyr
cd complyr
pnpm install
```

Create `apps/web/.env.local`:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=

NEXT_PUBLIC_PIMLICO_API_KEY=
NEXT_PUBLIC_PIMLICO_SPONSOR_ID=

COMPLYR_DATABASE_URL=postgresql://...

# Ethereum Sepolia contract addresses
NEXT_PUBLIC_INTENT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_AUDIT_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_SMART_WALLET_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_MOCK_USDC_ADDRESS=0x...

# Optional: client has a default fallback
NEXT_PUBLIC_ENVIO_API_URL=https://indexer.dev.hyperindex.xyz/63b8cce/v1/graphql
```

Run the app:

```bash
pnpm dev
```

Run contract checks:

```bash
pnpm forge:build
pnpm forge:test
```

---

## Contract deployment (Ethereum Sepolia)

```bash
PRIVATE_KEY=0x... forge script packages/contracts/script/DeployAll.s.sol:DeployAll \
  --rpc-url sepolia --broadcast
```

This deploys and wires `AuditRegistry`, `SmartWallet`, `SmartWalletFactory`, `IntentRegistry`, and `MockUSDC`. After deployment, update the `NEXT_PUBLIC_*` address variables and the address placeholders in `packages/indexer/config.yaml`.

---

## Project structure

```
complyr/
├── apps/
│   └── web/                      # Next.js frontend
│       └── src/
│           ├── app/              # App router pages (dashboard, auditor portal, docs)
│           ├── hooks/payments/   # useSingleTransfer, useBatchTransfer, useRecurringPayment
│           └── lib/
│               └── fhe-audit.ts  # Zama FHE encryption and decryption functions
├── packages/
│   ├── contracts/src/
│   │   ├── AuditRegistry.sol     # FHE audit core
│   │   ├── SmartWallet.sol       # ERC-4337 business treasury wallet
│   │   ├── SmartWalletFactory.sol
│   │   ├── IntentRegistry.sol    # Recurring payment schedules
│   │   └── MockUSDC.sol
│   └── indexer/                  # Envio HyperIndex configuration
└── readme.md
```

---

## Key design decisions

**Payments require audit data.** `SmartWallet.sol` intentionally disables plain transfer helpers. They revert with `SmartWallet__AuditRequired`. Every payment in Complyr carries encrypted audit context atomically. There is no bypass.

**Audit thresholds are encrypted end-to-end.** Auditor test criteria are encrypted in the auditor's browser before submission. The business is never granted `FHE.allow` on threshold ciphertexts and cannot read the auditor's rules.

**Findings are masked when not triggered.** `AuditRegistry` stores findings using `FHE.select(triggered, value, asEuint(0))`. An auditor who decrypts a non-triggered finding receives zeros. No information about payments that did not meet the criteria is ever revealed.

**Reference IDs remain plaintext.** Amounts, categories, and jurisdictions are encrypted. Reference IDs (invoice numbers, payroll batch IDs) are stored as plaintext strings, a deliberate usability tradeoff that allows businesses to reconcile onchain records against their internal accounting systems. This is a documented limitation. Encrypting variable-length strings is non-trivial with the Zama type system, which supports fixed-size numeric types only.

---

<div align="center">

Built for the [Zama FHE Hackathon](https://www.zama.ai/).

</div>
