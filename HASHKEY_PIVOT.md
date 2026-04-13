# HashKey Chain Horizon Hackathon — Pivot Guide

> Living document. Update this as decisions are made or plans change.

---

## Hackathon Basics

| | |
|---|---|
| **Hackathon** | HashKey Chain On-Chain Horizon Hackathon |
| **Platform** | [DoraHacks #2045](https://dorahacks.io/hackathon/2045/detail) |
| **Track** | **PayFi** |
| **Submission deadline** | Apr 15, 23:59 GMT+8 |
| **Demo showcase** | Apr 22 (AWS Office, HK) |
| **Final pitch** | Apr 23 (Web3 Festival) |
| **Prize per track** | 1st 5K · 2nd 3K · 3rd 2K USDT |
| **Dev resources** | [hashfans.io](https://hashfans.io) · [docs.hsk.xyz](https://docs.hsk.xyz) |

### Rules that affect us
- Projects **must be built on HashKey Chain**
- PayFi track **must use HSP** (HashKey Settlement Protocol)
- Using officially recommended products earns extra points

---

## Decisions Made ✅

### 1. Target Track: PayFi
Complyr's payment + compliance infrastructure maps directly. No other track fits.

### 2. Chain: HashKey Chain only (single-chain)
Drop the cross-chain architecture (Flow EVM → LayerZero → Zama Sepolia).
All contracts deploy to **HashKey Chain Testnet (Chain ID: 133)**.

**Rationale:** Single-chain is simpler, more robust for a demo, and avoids the DVN
coverage gap we had on Flow. HashKey Chain is positioned as compliance-friendly,
which aligns perfectly with Complyr's thesis.

### 3. Privacy: Client-side AES-256 encryption, ciphertext stored on-chain
Drop Zama fhEVM. Encrypt compliance metadata (category + jurisdiction) client-side
before the transaction is sent. Store the encrypted bytes in `ComplianceRegistry`
on HashKey Chain.

**What this means:**
- Public sees opaque ciphertext on-chain — data is NOT exposed
- Merchant holds the encryption key and can always decrypt their own records
- Auditors are granted key access via an off-chain or on-chain mechanism (TBD)
- We lose FHE "compute on encrypted data" — acceptable for this hackathon
- We lose Zama KMS decentralised key management — key management is now our responsibility

**Reframe for judges:** "On-chain encrypted compliance attestations" — HashKey Chain
is compliance-oriented by design; this fits the chain's positioning naturally.

### 4. HSP Integration: Required
HSP (HashKey Settlement Protocol) is the official merchant payment gateway for PayFi.
Registration email sent to `hsp_hackathon@hashkey.com`. Blocking on `app_key` + `app_secret`.

**ES256K keypair generated** at `merchant_private_key.pem` / `merchant_public_key.pem`.
> ⚠️  Do NOT commit `merchant_private_key.pem` to git.

### 5. Tokens: HSK (native) + USDC + USDT (stablecoins)
Stablecoins are required for a credible merchant payment demo (merchants price in USD).
SmartWallet needs ERC-20 transfer support added.

**HashKey Testnet token contracts:**
| Token | Address | Decimals |
|---|---|---|
| USDC | `0x79AEc4EeA31D50792F61D1Ca0733C18c89524C9e` | 6 |
| USDT | `0x372325443233fEbaC1F6998aC750276468c83CC6` | 6 |

### 6. Bundler: Keep Skandha (self-hosted on Railway)
No public bundler confirmed for HashKey Chain testnet yet. Reconfigure existing
Skandha instance to point to `https://testnet.hsk.xyz` with `chainId: 133`.

### 7. Indexer: Keep Envio (RPC mode)
Envio supports any EVM chain via standard RPC. Will not have HyperSync acceleration
but RPC polling is fine for hackathon scale. Update `config.yaml` with new RPC + addresses.

---

## Decisions Still Needed ❓

### A. Encryption Key Management
How does a merchant's encryption key get created and stored?

| Option | Description | Pros | Cons |
|---|---|---|---|
| **Wallet-derived** | Derive key from a wallet signature (e.g. sign a fixed message, use as seed) | Trustless, no DB storage needed, recoverable | Slightly more complex to implement |
| **Server-generated** | Generate random key server-side, store in DB | Simple | Key lives in your DB, centralised trust |
| **User-managed** | User generates and holds their own key | Most trustless | Bad UX, user can lose key |

**Recommendation:** Wallet-derived. Sign a fixed message (`"Complyr encryption key v1"`) with
the merchant's EOA, hash it → use as AES-256 key. Reproducible from their wallet, no DB
dependency, consistent with how MetaMask encryption works.

> ❓ **Decision needed:** Which key management approach do you want?

---

### B. Auditor Decryption Access
Without Zama's ACL system, how do auditors decrypt records?

| Option | Description | Pros | Cons |
|---|---|---|---|
| **Share master key** | Merchant directly shares their encryption key with auditor | Simple | Can't revoke; auditor can share further |
| **Encrypt key for auditor** | Merchant encrypts their key with auditor's public key, stores result on-chain | Auditor uses their private key to decrypt | Requires auditor to have a keypair |
| **Re-encryption proxy** | Use a proxy re-encryption scheme (e.g. NuCypher/Lit) | Proper access control | More complexity |

**Recommendation:** Encrypt the merchant's key with the auditor's Ethereum public key
(standard ECIES). Store the encrypted key on-chain in `ComplianceRegistry`. Auditor
connects wallet, decrypts the key, then decrypts the records. Clean, on-chain, auditable.

> ❓ **Decision needed:** Which auditor access model?

---

### C. HSP Integration Scope
One-time and reusable orders both exist in the HSP API.

| Option | Maps to | Scope |
|---|---|---|
| **One-time only** | Single payments / batch payments | Lower effort |
| **Both** | + Recurring payments via reusable mandates | Maps better to IntentRegistry |

**Recommendation:** Implement both. One-time orders map to single/batch payments.
Reusable orders map perfectly to recurring payment intents — it's a natural fit and
makes the demo significantly stronger.

> ❓ **Decision needed:** One-time only or both?

---

### D. What to Cut if Time is Short
If we hit Day 3 and are behind, which features get dropped?

| Feature | Priority | Cut? |
|---|---|---|
| Single payments + HSP one-time checkout | 🔴 Core | Never |
| Compliance record creation | 🔴 Core | Never |
| Compliance dashboard (decrypt + view) | 🔴 Core | Never |
| Auditor access flow | 🟡 High | Maybe |
| Recurring payments / IntentRegistry | 🟡 High | Maybe |
| CSV tax export | 🟢 Nice | Yes, cut first |
| Contact book | 🟢 Nice | Yes, cut second |

> ❓ **Decision needed:** Confirm cut priority, or adjust.

---

## Network Configuration

| Parameter | Value |
|---|---|
| Chain ID | `133` |
| RPC URL | `https://testnet.hsk.xyz` |
| Block Explorer | `https://testnet-explorer.hsk.xyz` |
| Currency | HSK |
| EntryPoint v0.6 | Verify deployment on chain — check before deploying |

---

## What's Being Removed

| Component | Reason |
|---|---|
| `ComplianceBridge.sol` | LayerZero cross-chain bridge no longer needed |
| `ComplianceReceiver.sol` | Zama OApp receiver no longer needed |
| Zama Sepolia deployment | Entire privacy layer moves to HashKey Chain |
| LayerZero dependencies | `@layerzerolabs/*` packages can be dropped from contracts |
| Flow EVM config | All Flow references replaced with HashKey Chain |

---

## What's Being Added

| Component | Description |
|---|---|
| New `ComplianceRegistry.sol` | Simplified, no FHE. Stores AES-256 ciphertext blobs |
| ERC-20 support in `SmartWallet.sol` | `transferERC20`, `batchTransferERC20` for USDC/USDT |
| `apps/web/src/app/api/hsp/` | Full HSP Merchant API client (create orders, webhooks, query) |
| HMAC-SHA256 signing library | Request authentication for HSP API calls |
| ES256K JWT signing library | `merchant_authorization` for HSP order creation |
| Client-side AES-256 encryption | Replace Zama SDK for compliance metadata encryption |
| Token selector UI | Let users pay/send in HSK, USDC, or USDT |
| Incoming payments view | Show HSP payment statuses in the dashboard |

---

## Contract Migration

### Keep (redeploy to HashKey Chain, minimal changes)
- `SmartWallet.sol` — add ERC-20 transfer functions
- `SmartWalletFactory.sol` — update pre-fund amount to HSK
- `IntentRegistry.sol` — no changes needed
- `VerifyingPaymaster.sol` — no changes needed

### Rewrite
- `ComplianceRegistry.sol` — remove FHE, store encrypted bytes + auditor key grants

### Remove
- `ComplianceBridge.sol`
- `ComplianceReceiver.sol`
- `IComplianceBridge.sol`

---

## HSP API Reference (Quick)

**Base URLs:**
- QA/testnet: `https://merchant-qa.hashkeymerchant.com`
- Production: `https://merchant.hashkey.com`

**Auth:** Every request needs `X-App-Key`, `X-Signature` (HMAC-SHA256), `X-Timestamp`, `X-Nonce`.

**Key endpoints:**
```
POST /api/v1/merchant/orders           # one-time payment order
POST /api/v1/merchant/orders/reusable  # reusable payment order
GET  /api/v1/merchant/payments         # query one-time payments
GET  /api/v1/merchant/payments/reusable # query reusable payments
```

**Payment states:** `payment-required → payment-submitted → payment-verified → payment-processing → payment-included → payment-successful` (terminal) or `payment-failed` (terminal)

**Webhooks:** POSTed to your `webhook_url` on terminal state. Must respond 2xx within 10s.
Retried up to 6 times (1m → 5m → 15m → 1h → 6h → 24h).

---

## Narrative Pivot

| Before | After |
|---|---|
| "Encrypted compliance records on cross-chain FHE infrastructure" | "Compliant merchant payment infrastructure with on-chain encrypted compliance records" |
| Built for PL Genesis: Frontiers of Collaboration | Built for HashKey Chain Horizon Hackathon — PayFi track |
| Flow EVM + Zama fhEVM (two specialist chains) | HashKey Chain (one compliance-native chain) |
| FHE = complex cryptography story | AES-256 client-side = simple, credible, proven encryption |
| Target: Business treasury management | Target: Merchants accepting stablecoin payments with compliance |
