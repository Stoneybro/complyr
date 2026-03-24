

# Complyr

**Confidential audit infrastructure for onchain business finance.**

<img src="./apps/web/public/complyrlogolight.svg" alt="Complyr Logo" width="200"/>

[Live Demo](https://usecomplyr.vercel.app)

---

## The problem

When a company sends money from a blockchain wallet, the transaction record shows who was paid and how much. It does not show why.

In traditional finance, that explanation is not optional. Tax authorities require proof of business expenses. Auditors need to trace every outgoing payment to a documented business purpose. Regulators expect structured financial records that can be inspected on demand.

The consequences of missing records are concrete. If a company pays $2,000 to a contractor, $500 for software, and $1,000 for marketing, those payments reduce taxable profit — but only if they are documented. Without records, a tax authority may treat the full revenue as profit, disallow deductions, and classify unexplained outflows as personal withdrawals or fraud. Most jurisdictions require businesses to retain payment records for five to seven years.

Blockchain wallets, as they exist today, produce no such records. The payment executes. The compliance layer does not exist.

---

## What Complyr does

Complyr adds the missing compliance layer to onchain payments.

A company wallet executes payments normally on-chain. At the same time, Complyr creates a linked compliance record that explains the context of every payment — its jurisdiction, its expense category, its reference identifier. This metadata is encrypted using Fully Homomorphic Encryption (FHE) so the explanation exists on-chain without exposing sensitive business information to the public.

The result is a dual ledger. The payment is recorded on the execution chain. The confidential compliance explanation is recorded on a separate privacy layer. Both records share a deterministic identifier derived from the payment intent, meaning auditors can always trace a payment to its explanation while the public cannot read the underlying business details.

Complyr transforms a smart wallet into a compliant corporate finance instrument — combining the immutability of blockchain with the confidentiality required for real business operations.

---

## System architecture

<img width="1410" height="1078" alt="image" src="https://github.com/user-attachments/assets/263987a8-ab92-40fa-9dbc-8f1f6de1c31e" />

The overall system spans three layers:---

## Smart contract layer — Flow EVM

The Flow EVM layer handles payment execution and compliance metadata dispatch. It consists of three contracts working in sequence.

### Smart wallet

Each business entity deploys a smart wallet — a minimal proxy clone that implements ERC-4337 account abstraction. The wallet is gasless by design: all user operations are sponsored through a custom Skandha bundler deployed on Railway, since no public bundler currently supports Flow testnet. Wallets are deployed deterministically via the `SmartWalletFactory`, with one wallet per social login identity managed through Privy.

The wallet tracks two fund states: available balance and committed balance. When a recurring payment intent is created, the required funds are locked as committed, preventing double-spending. Funds are released progressively as each payment cycle executes.

The smart wallet deployment event triggers automatic company registration on the Zama compliance layer via the Compliance Bridge, establishing the cross-chain identity link at account creation time.

### Intent registry

The Intent Registry is the scheduling engine. It allows a business to define a payment intent: a set of recipients, amounts, a payment interval, and a total duration. Once created, the registry uses Chainlink Automation to execute the payments at each interval without requiring manual intervention.

Each intent creation includes optional compliance metadata — jurisdiction codes and expense category codes — that travel alongside the payment through to the confidential record layer. The registry supports up to ten recipients per intent, covering both single subscriptions and multi-recipient payroll distributions.

The contract enforces fund availability at intent creation time and manages the full lifecycle of each schedule: creation, recurring execution, and cancellation with automatic fund release.

### Compliance bridge

The Compliance Bridge is a LayerZero V2 OApp deployed on Flow EVM. It is the dispatch point for all cross-chain compliance messages. When a payment executes, the bridge encodes the compliance metadata and sends it to the Compliance Receiver on Zama Sepolia via the LayerZero messaging layer.

The bridge is trustless by design. LayerZero does not discard failed messages — they persist in the message queue and can be retried by any party. This means the link between a payment and its compliance record is guaranteed even in the presence of transient network failures. A payment that executes on Flow will always eventually produce its corresponding encrypted compliance record on Zama.

---

## Confidential record layer — Zama Sepolia

<img width="1410" height="830" alt="image" src="https://github.com/user-attachments/assets/7256c3f8-2b5d-474f-bfd6-7c3c0513532c" />


The Zama layer is responsible for storing compliance records in a form that is auditable but not publicly readable. It uses Fully Homomorphic Encryption to keep sensitive business metadata encrypted at all times, including during on-chain computation.

The confidential layer diagram:### Compliance receiver

The Compliance Receiver is a LayerZero V2 OApp deployed on Zama Sepolia. It accepts inbound messages from the Compliance Bridge on Flow and decodes two message types: company registration events triggered at smart wallet deployment, and compliance report events triggered at each payment execution.

Once decoded, the receiver routes each payload to the Compliance Registry.

### Compliance registry

The Compliance Registry is the core storage contract on the fhEVM. It maintains a private per-company ledger of compliance records. Each record stores plaintext metadata — transaction hash, recipients, amounts, and timestamp — alongside two encrypted values: the expense category and the recipient jurisdiction, stored as `euint8` FHE ciphertext types.

Encrypted values are created using Zama's `FHE.fromExternal()`, which validates the accompanying zero-knowledge proof before materialising the ciphertext on-chain. This ensures that no plaintext category or jurisdiction value is ever exposed to the blockchain mempool or public state.

Access control is managed through Zama's ACL system. At the time of record creation, the registry automatically grants read access to the company's master wallet and up to three designated external auditors. Auditors can request decryption of any record they have access to by producing a valid EIP-712 signature via the fhEVM decryption gateway.

### Trust model

Complyr does not enforce the accuracy of compliance metadata. A company self-reports its expense categories and jurisdictions, which is consistent with how traditional accounting works — accountants self-report, but they are liable for what they commit. What Complyr does enforce is existence and immutability: once a compliance record is committed, it cannot be altered. The combination of a deterministic intent identifier and an immutable on-chain record provides the same accountability primitive that a signed accounting entry provides in traditional finance.

---

## Data layer — Envio indexer

Complyr includes a custom Envio indexer that listens to events emitted by the Smart Wallet and Intent Registry contracts on Flow EVM. The indexer parses raw on-chain events into structured activity records covering all transaction types: wallet creation, single transfers, batch transfers, intent creation, intent execution, intent cancellation, and transfer failures.

Parsed records are stored in a structured schema and exposed via a GraphQL API. The frontend queries this API to build the transaction history and dashboard views, making real-time activity available without requiring direct RPC calls to the chain.

The indexer is a first-party component — its schema and event handlers were written specifically for Complyr, not generated from a template.

---

## Application layer

The frontend is a Next.js application that provides the user-facing interface for Complyr. It handles wallet onboarding via Privy (supporting email, Google, and GitHub login), payment creation across three modes — single transfer, batch transfer, and recurring payment — and dashboard views that surface balance information, payment history, and compliance summaries.

When creating a recurring payment, the user attaches compliance metadata: a jurisdiction from a predefined enum and an expense category from a predefined enum. This metadata travels with the payment intent through the smart contract layer and ultimately becomes the encrypted values stored in the compliance registry on Zama.

Auditors and the company itself access their encrypted compliance records by connecting their authorised wallet and producing an EIP-712 signature to request decryption through the fhEVM gateway.

The current frontend reflects the core infrastructure and primary payment flows. Auditor dashboards and a dedicated compliance reporting interface are planned for the next development phase.

---

## Getting started

**Prerequisites:** Node.js 18+, pnpm, Foundry

```bash
git clone https://github.com/your-org/complyr
cd complyr
pnpm install
```

**Run the web application:**

```bash
pnpm dev
```

**Build and test contracts:**

```bash
pnpm forge:build
pnpm forge:test
```

**Environment variables** — create `apps/web/.env.local`:

```
NEXT_PUBLIC_PRIVY_APP_ID=
COMPLYR_DATABASE_URL=
```

**Live deployment:** [https://usecomplyr.vercel.app](https://usecomplyr.vercel.app)

---

## Contract addresses

| Contract | Network | Address |
|---|---|---|
| `SmartWalletFactory` | Flow EVM Testnet | `0x3a0D8422378310f6fc16916Bea39b453Bd10Ec0f` |
| `IntentRegistry` | Flow EVM Testnet | `0x37c5c677146A19e61295E40F0518bAf3f94305fE` |
| `SmartWallet` (implementation) | Flow EVM Testnet | `0xd63E841AAb10D118a3cb541FbeF011eBae6437C6` |

---

## Roadmap

The following capabilities are planned for development after the current release:

Auditor-facing dashboards that allow external auditors and regulators to browse and decrypt the compliance records they have been granted access to, without requiring direct contract interaction. A dedicated tax reporting interface that aggregates encrypted compliance records into jurisdiction-specific report formats. Expansion of the compliance metadata schema to include additional expense categories and multi-jurisdiction payment support. Mainnet deployment on Flow EVM once the testnet implementation is validated.

---

## Acknowledgements

Built for the PL Genesis: Frontiers of Collaboration Hackathon. Complyr is submitted under the Flow track ("The Future of Finance") for its consumer DeFi payment infrastructure built on Flow EVM with ERC-4337 account abstraction, and under the Zama track ("Confidential Onchain Finance") for its use of Fully Homomorphic Encryption to store confidential compliance metadata on the Zama fhEVM. Cross-chain messaging is powered by LayerZero V2. On-chain event indexing is powered by Envio.
