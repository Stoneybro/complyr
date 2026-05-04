<div align="center">

<img src="./apps/web/public/complyrlogo-light.svg" alt="Complyr" width="90" height="90" />

# Complyr

### Business payments with built-in, encrypted compliance tracking.

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

## The problem

Blockchains are excellent at recording **who** got paid and **how much**, but they completely miss **why**.

For businesses operating onchain, this creates a critical gap:
- Payments happen onchain, but compliance records live offline in spreadsheets
- Auditors require full access to payment data, exposing sensitive business information
- No way to prove payment legitimacy without revealing commercial details
- Recurring payments (payroll, subscriptions) lack audit trails

Complyr bridges this gap by embedding encrypted compliance metadata directly into every transaction.

---

## The solution

Complyr is a smart-account based payment system that attaches encrypted compliance data to every treasury flow.

**What it does:**
- Encrypts payment amounts, categories, and jurisdictions using Zama Fully Homomorphic Encryption (FHE)
- Stores encrypted data onchain alongside the transaction
- Allows authorized auditors to decrypt and verify compliance without exposing data publicly
- Supports single transfers, batch payouts, and automated recurring payments
- Provides a complete, immutable audit trail for every payment

**Who it's for:**
- Companies making onchain B2B payments
- Businesses needing audit-ready payment records
- Teams managing payroll or subscriptions onchain
- Organizations requiring regulatory compliance for crypto transactions

---

## Key features

- **Payroll & Subscriptions** - Automated, stateful recurring payments. Manage employee salaries and subscriptions securely on-chain.
- **Batch Payouts** - Execute mass vendor payments in a single transaction. Highly scalable infrastructure designed to save gas.
- **Single Transfers** - Fast, reliable direct B2B transactions. The foundational layer for moving treasury funds efficiently.
- **Data Privacy** - Sensitive compliance data and payment amounts are secured with Zama FHE on Ethereum Sepolia.
- **Account Abstraction** - Seamless gasless transactions and simple Web2-style social logins for frictionless enterprise onboarding.
- **Auditor Portal** - An isolated environment for external regulators to verify compliance proofs without exposing underlying corporate data.

---

## How it works

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  1. Smart Vault │ ───▶ │  2. Encryption  │ ───▶ │  3. Settlement   │ ───▶ │  4. Audit       │
│                 │      │                 │      │                 │      │                 │
│ Deploy a        │      │ Attach          │      │ Payment settles │      │ Authorize       │
│ compliance-aware│      │ compliance data │      │ natively onchain │      │ specific        │
│ smart account   │      │ Zama FHE keeps  │      │ Encrypted records│      │ auditors to     │
│ as treasury     │      │ amounts hidden  │      │ anchored in tx  │      │ verify without  │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Step 1: Smart Vault** - Deploy a compliance-aware smart account onchain to act as your business's primary treasury.

**Step 2: Encryption** - Attach necessary compliance data to your payment. Zama FHE keeps amounts and metadata hidden on Ethereum Sepolia.

**Step 3: Settlement** - The payment settles natively onchain while your encrypted compliance records are permanently anchored in the same transaction.

**Step 4: Audit** - Authorize specific auditors. They can decrypt and verify the legality of your transactions without exposing your underlying company data to the public.

---

## Core capabilities

- ERC-4337 smart-wallet payment flows (single, batch, recurring)
- Client-side Zama FHE encryption of compliance metadata (amounts, categories, jurisdictions)
- Onchain compliance ledger (`ComplianceRegistry`) with immutable linkage to transaction hashes
- Selective auditor access using FHE permission system (`FHE.allow()`)
- Transaction activity indexing via Envio + GraphQL
- Gas sponsorship through Pimlico bundler/paymaster
- Recurring payment execution through Chainlink Automation-compatible registry methods

---

## Architecture

Complyr is split into three layers:

1. **Application layer (Next.js + Privy + Zama FHE SDK)**
   - Captures payment intent and compliance metadata
   - Encrypts compliance payloads in-browser using Zama FHE before submission

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
- `recipients[]` and `amounts[]`: encrypted transfer context using Zama FHE (euint128 for amounts, euint8 for categories/jurisdictions)
- `referenceIds[]`: plaintext reference identifiers for audit trail usability
- `timestamp`: block-time anchor for audit chronology

Complyr uses Zama FHE to encrypt amounts, categories, and jurisdictions onchain. The master EOA and authorized auditors can decrypt these values using the FHE permission system. Recipients, token addresses, and reference IDs remain plaintext for audit trail usability.

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
| Encryption | Zama FHE (Fully Homomorphic Encryption) |
| Frontend | Next.js 16, Tailwind CSS, shadcn/ui |
| Auth + embedded wallets | Privy |
| Database | Neon PostgreSQL via Drizzle ORM (contacts) |
| Contracts | Solidity + Foundry + OpenZeppelin + @fhevm/solidity |

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
NEXT_PUBLIC_PIMLICO_SPONSOR_ID=...

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

---

## Project structure

Complyr is a monorepo organized as follows:

```
complyr/
├── apps/
│   └── web/                      # Next.js frontend application
│       ├── src/
│       │   ├── app/              # Next.js app router pages
│       │   ├── components/       # React components (UI, home, dashboard)
│       │   ├── hooks/            # Custom React hooks
│       │   │   ├── payments/     # Payment flow hooks (single, batch, recurring)
│       │   │   ├── useAuditLogs.ts
│       │   │   ├── useComplianceData.ts
│       │   │   └── useWalletDeployment.ts
│       │   ├── lib/              # Utilities and configurations
│       │   │   ├── fhe-compliance.ts    # Zama FHE encryption functions
│       │   │   ├── SmartAccountProvider.tsx
│       │   │   └── abi/          # Contract ABIs
│       │   └── db/               # Database schema (Drizzle ORM)
│       └── package.json
├── packages/
│   ├── contracts/                # Solidity smart contracts
│   │   ├── src/
│   │   │   ├── SmartWallet.sol           # ERC-4337 smart account
│   │   │   ├── SmartWalletFactory.sol    # Factory for wallet deployment
│   │   │   ├── ComplianceRegistry.sol    # FHE compliance ledger
│   │   │   ├── IntentRegistry.sol        # Recurring payment registry
│   │   │   ├── MockUSDC.sol              # Testnet stablecoin
│   │   │   └── IComplianceRegistry.sol   # Interfaces
│   │   ├── script/           # Foundry deployment scripts
│   │   ├── test/             # Foundry test suites
│   │   └── foundry.toml
│   └── indexer/               # Envio HyperIndex configuration
│       └── config.yaml
├── package.json               # Root package.json (workspace config)
├── pnpm-workspace.yaml        # pnpm workspace configuration
└── readme.md
```

---

## FHE workflow

Complyr uses Zama's Fully Homomorphic Encryption (FHE) to encrypt sensitive payment data onchain. The encryption/decryption flow works as follows:

### Encryption flow (client-side)

1. **Initialize Zama SDK**: The frontend initializes the Zama FHE SDK using `@zama-fhe/relayer-sdk/web` with Sepolia configuration.

2. **Create encrypted input**: For each payment, the client creates an encrypted input object targeting the `ComplianceRegistry` contract:
   ```typescript
   const input = fhevm.createEncryptedInput(registryAddress, callerAddress);
   input.add128(amount);      // Encrypt amount as euint128
   input.add8(category);       // Encrypt category as euint8
   input.add8(jurisdiction);   // Encrypt jurisdiction as euint8
   ```

3. **Generate handles and proofs**: The SDK encrypts the values and returns:
   - `handles`: Encrypted ciphertext handles (bytes32)
   - `inputProof`: Zero-knowledge proof of valid encryption

4. **Submit to contract**: The encrypted handles and proofs are sent to the smart contract along with plaintext recipients and reference IDs.

### Onchain processing

1. **Convert to FHE types**: The contract converts external handles to internal FHE types:
   ```solidity
   euint128 amount = FHE.fromExternal(amountHandles[i], amountProofs[i]);
   euint8 category = FHE.fromExternal(categoryHandles[i], categoryProofs[i]);
   euint8 jurisdiction = FHE.fromExternal(jurisdictionHandles[i], jurisdictionProofs[i]);
   ```

2. **Set permissions**: The contract grants decryption permissions to:
   - The master EOA (wallet owner)
   - Authorized auditors (up to 3 per wallet)
   ```solidity
   amount = FHE.allow(amount, masterEOA);
   amount = FHE.allow(amount, auditor);
   ```

3. **Store encrypted data**: The encrypted values are stored in the `ComplianceRegistry` as `euint128` and `euint8` types.

### Decryption flow (auditor access)

1. **Generate keypair**: The auditor generates an FHE keypair in their browser.

2. **Create EIP-712 signature**: The auditor signs a permission request with their wallet:
   ```typescript
   const typedData = fhevm.createEIP712(
       keypair.publicKey,
       [contractAddress],
       startTimestamp,
       durationDays
   );
   const signature = await signer.signTypedData(typedData);
   ```

3. **Request decryption**: The auditor calls `userDecrypt` with the handles, their keypair, and signature.

4. **Verify and decrypt**: The Zama network verifies the signature and permissions, then returns the decrypted values.

### Key properties

- **Amounts, categories, and jurisdictions** are encrypted onchain using FHE
- **Recipients, token addresses, and reference IDs** remain plaintext for audit trail usability
- Only the master EOA and authorized auditors can decrypt the encrypted values
- Decryption requires both FHE permissions and a valid EIP-712 signature from the requester

---

## Contract details

### SmartWallet

The ERC-4337 compliant smart account that handles all payment operations.

**Key features:**
- Validates UserOperations via `validateUserOp()` using ECDSA signature recovery
- Enforces compliance metadata on all financial transfers (reverts if missing)
- Manages fund commitments for recurring intents via `increaseCommitment()`/`decreaseCommitment()`
- Supports single and batch transfers for both native ETH and ERC-20 tokens
- Integrates with `ComplianceRegistry` to record encrypted compliance data atomically

**Important functions:**
- `transferERC20WithCompliance()` - Single ERC-20 transfer with FHE compliance
- `batchTransferERC20WithCompliance()` - Batch ERC-20 transfers with FHE compliance
- `transferNativeWithCompliance()` - Single native ETH transfer with FHE compliance
- `batchTransferNativeWithCompliance()` - Batch native ETH transfers with FHE compliance
- `executeBatchIntentTransfer()` - Called by IntentRegistry for recurring payments
- `getAvailableBalance()` - Returns uncommitted balance (total - committed)

**Security notes:**
- All financial calls require compliance metadata (enforced by `_isFinancialCall()`)
- Committed funds cannot be spent outside of intent execution
- Only EntryPoint, wallet owner, or IntentRegistry can execute transfers

### SmartWalletFactory

Factory contract that deploys ERC-1167 minimal proxy clones of SmartWallet.

**Key features:**
- Deploys deterministic wallet addresses using CREATE2
- Auto-registers each wallet with `ComplianceRegistry`
- Drips native ETH and stablecoin to new wallets for onboarding
- One wallet per EOA (returns existing if already deployed)

**Important functions:**
- `createSmartAccount(address owner)` - Deploys or returns existing wallet
- `getPredictedAddress(address owner)` - Returns counterfactual address before deployment
- `setStablecoinDrip()` - Configures stablecoin drip amount (owner only)
- `setNativeDrip()` - Configures native ETH drip amount (owner only)

### ComplianceRegistry

On-chain encrypted compliance ledger using Zama FHE.

**Key features:**
- Stores encrypted amounts (euint128), categories (euint8), and jurisdictions (euint8)
- Stores plaintext recipients, token addresses, and reference IDs
- Manages auditor permissions (up to 3 auditors per wallet)
- Grants FHE decryption permissions to master EOA and authorized auditors
- Links each record to a transaction hash for auditability

**Important functions:**
- `recordTransaction()` - Records encrypted compliance data for a transaction
- `addAuditor()` - Adds an auditor and grants them permissions on all existing records
- `removeAuditor()` - Removes an auditor (revokes future permissions)
- `getRecord()` - Returns record metadata and encrypted handles
- `getEncryptedAmount()/Category()/Jurisdiction()` - Returns specific encrypted fields

**Permission model:**
- Master EOA always has decryption permissions
- Auditors can be added/removed by master EOA
- When an auditor is added, they receive permissions on all historical records
- When removed, they lose permissions but historical permissions remain

### IntentRegistry

Central registry for managing automated recurring payment intents with Chainlink Automation.

**Key features:**
- Implements Chainlink Automation interface (`checkUpkeep`/`performUpkeep`)
- Manages payment schedules with configurable intervals and durations
- Locks wallet funds via commitment system for scheduled payments
- Records compliance metadata once at intent creation
- Supports up to 10 recipients per intent
- Handles failed transfers and tracks failed amounts for recovery

**Important functions:**
- `createIntent()` - Creates a new recurring payment intent with FHE compliance
- `cancelIntent()` - Cancels an intent and unlocks remaining committed funds
- `checkUpkeep()` - Called by Chainlink to check if intents need execution
- `performUpkeep()` - Called by Chainlink to execute intents
- `getIntent()` - Returns intent details
- `getActiveIntents()` - Returns all active intent IDs for a wallet

**Intent parameters:**
- `recipients[]` - Array of recipient addresses (max 10)
- `amounts[]` - Amount per recipient per execution
- `interval` - Seconds between executions (min 30s)
- `duration` - Total duration in seconds (max 1 year)
- `transactionStartTime` - Start time (0 for immediate)
- Compliance metadata (encrypted amounts, categories, jurisdictions, reference IDs)

**Execution flow:**
1. Chainlink calls `checkUpkeep()` periodically
2. Registry checks if any intents are due for execution
3. If due, Chainlink calls `performUpkeep()` with wallet and intent ID
4. Registry calls `executeBatchIntentTransfer()` on the wallet
5. Wallet decreases commitment and executes transfers
6. Failed amounts are tracked for recovery

### MockUSDC

Testnet ERC-20 stablecoin for testing treasury flows on Sepolia.

---

## Payment flows

### Single transfer

1. User enters recipient, amount, and compliance metadata (category, jurisdiction, reference ID)
2. Frontend encrypts compliance data using Zama FHE SDK
3. Frontend calls `transferERC20WithCompliance()` or `transferNativeWithCompliance()` on SmartWallet
4. SmartWallet validates compliance data is present
5. SmartWallet calls `ComplianceRegistry.recordTransaction()` with encrypted handles
6. SmartWallet executes the token transfer
7. Transaction receipt includes both transfer and compliance recording events

**Frontend hook:** `useSingleTransfer()` in `apps/web/src/hooks/payments/useSingleTransfer.ts`

### Batch transfer

1. User enters multiple recipients, amounts, and compliance metadata for each
2. Frontend encrypts all compliance data in a single FHE operation
3. Frontend calls `batchTransferERC20WithCompliance()` or `batchTransferNativeWithCompliance()`
4. SmartWallet validates array lengths match
5. SmartWallet records all compliance data atomically
6. SmartWallet executes all transfers in a loop
7. If any transfer fails, the entire transaction reverts

**Frontend hook:** `useBatchTransfer()` in `apps/web/src/hooks/payments/useBatchTransfer.ts`

### Recurring payment (intent)

1. User enters schedule parameters (recipients, amounts, interval, duration, start time)
2. User provides compliance metadata for the recurring pattern
3. Frontend encrypts compliance data using Zama FHE SDK
4. Frontend calls `IntentRegistry.createIntent()` via UserOperation
5. IntentRegistry validates wallet has sufficient available balance
6. IntentRegistry calculates total commitment (amount × transaction count)
7. IntentRegistry calls `SmartWallet.increaseCommitment()` to lock funds
8. IntentRegistry records compliance data once (applies to all executions)
9. IntentRegistry stores the intent and marks it active
10. Chainlink Automation periodically checks `checkUpkeep()`
11. When due, Chainlink calls `performUpkeep()` which executes the batch transfer
12. After each execution, commitment is decreased
13. When complete, intent is marked inactive

**Frontend hook:** `useRecurringPayment()` in `apps/web/src/hooks/payments/useRecurringPayment.ts`

**Intent cancellation:**
- User can call `cancelIntent()` to stop a recurring payment
- Remaining committed funds are unlocked
- Failed amounts are recovered to the wallet

---

## Auditor access

Auditors are external addresses authorized to decrypt compliance data for verification purposes.

### Adding an auditor

1. Master EOA calls `ComplianceRegistry.addAuditor(proxyAccount, auditorAddress)`
2. Registry validates auditor is not already added and max 3 auditors not reached
3. Registry grants the auditor FHE permissions on all existing compliance records
4. Auditor can now decrypt historical and future records

### Removing an auditor

1. Master EOA calls `ComplianceRegistry.removeAuditor(proxyAccount, auditorAddress)`
2. Registry marks auditor as inactive
3. Auditor is removed from the active auditors list
4. Historical permissions remain (cannot revoke past permissions)

### Decrypting compliance data

1. Auditor generates an FHE keypair in their browser
2. Auditor creates an EIP-712 signature for the decryption request
3. Auditor calls `userDecryptComplianceHandles()` with:
   - The encrypted handles to decrypt
   - Their keypair (public and private keys)
   - The EIP-712 signature
4. Zama network verifies the signature and permissions
5. If valid, the decrypted values are returned to the auditor

**Frontend function:** `userDecryptComplianceHandles()` in `apps/web/src/lib/fhe-compliance.ts`

### Auditor limits

- Maximum 3 auditors per wallet
- Auditors can only decrypt data for wallets they're authorized for
- Decryption requires both FHE permissions and a valid signature
- Permissions are granted per-contract (ComplianceRegistry address)

---

## Security considerations

### FHE security

- **Client-side encryption**: Encryption happens in the browser before submission. Ensure the frontend environment is secure (HTTPS, no XSS vulnerabilities).
- **Key management**: FHE keys are generated client-side. The master EOA's key is derived from their wallet signature.
- **Permission system**: The FHE permission system ensures only authorized addresses can decrypt data.
- **Proof verification**: Zero-knowledge proofs verify that encrypted data was properly encrypted before acceptance.

### Smart contract security

- **Compliance enforcement**: All financial transfers require compliance metadata. Direct transfers without compliance revert.
- **Commitment system**: Funds committed to intents cannot be spent elsewhere, preventing double-spending.
- **Reentrancy guards**: Critical functions use `nonReentrant` modifier to prevent reentrancy attacks.
- **Access control**: Strict modifiers ensure only authorized callers can execute sensitive functions.
- **Input validation**: All inputs are validated (array lengths, address checks, amount checks).

### Account abstraction security

- **Signature validation**: UserOperations are validated using ECDSA signature recovery against the owner's address.
- **EntryPoint integration**: Only the official EntryPoint v0.7 can execute UserOperations.
- **Gas sponsorship**: Pimlico paymaster handles gas sponsorship. Ensure the paymaster is properly funded.

### Operational security

- **Privy authentication**: Use Privy's secure authentication for wallet creation and signing.
- **Environment variables**: Never commit private keys or API keys. Use `.env.local` for local development.
- **Contract upgrades**: The current implementation uses immutable contracts. Plan for upgrade patterns if needed.
- **Auditor management**: Carefully vet auditors before granting them decryption permissions.

---

## Testing

### Contract tests

Contract tests are written in Foundry and located in `packages/contracts/test/`.

Run all contract tests:
```bash
pnpm forge:test
```

Run specific test file:
```bash
cd packages/contracts
forge test --match-path test/SmartWallet.t.sol
```

Run tests with gas reporting:
```bash
forge test --gas-report
```

**Test files:**
- `SmartWallet.t.sol` - Tests for SmartWallet (transfers, compliance, commitments)
- `SmartWalletFactory.t.sol` - Tests for factory deployment and registration
- `IntentRegistry.t.sol` - Tests for intent creation, execution, and Chainlink integration

### Frontend tests

The frontend currently uses manual testing. To add automated tests:

1. Install test dependencies:
```bash
cd apps/web
pnpm add -D @testing-library/react @testing-library/jest-dom vitest
```

2. Create test files in `apps/web/src/**/*.test.tsx`

3. Run tests:
```bash
pnpm test
```

### Integration testing

To test the full flow end-to-end:

1. Deploy contracts to Sepolia using the deployment script
2. Update environment variables with deployed addresses
3. Start the frontend: `pnpm dev`
4. Create a wallet via the UI
5. Test single, batch, and recurring transfers
6. Verify compliance data is recorded onchain
7. Test auditor access and decryption

---

## Troubleshooting

### Common issues

**"Failed to encrypt compliance parameters"**
- Ensure you're running in a browser environment (FHE SDK requires window object)
- Check that `@zama-fhe/relayer-sdk` is properly installed
- Verify the registry address is correct in your environment variables

**"UserOp reverted on-chain"**
- Check the transaction hash on Etherscan for revert reason
- Verify the wallet has sufficient balance (including committed funds)
- Ensure compliance metadata is provided for all financial transfers
- Check that the contract addresses in environment variables are correct

**"Insufficient uncommitted funds"**
- The wallet has funds, but they are locked in intents
- Cancel intents to unlock committed funds
- Use `getAvailableBalance()` to check spendable balance

**"Intent not executable"**
- Check that the current time is past the transaction start time
- Verify the intent is still active (not completed or cancelled)
- Ensure the interval has passed since the last execution

**Chainlink Automation not executing intents**
- Verify the IntentRegistry has the correct compliance registry address
- Check that the wallet is registered in the IntentRegistry
- Ensure the intent parameters are valid (interval, duration, recipients)
- Review Chainlink Automation logs for upkeep check failures

**Auditor cannot decrypt**
- Verify the auditor is added to the wallet's auditor list
- Check that the auditor's signature is valid (EIP-712 format)
- Ensure the decryption request includes the correct contract address
- Verify the permission duration hasn't expired

### Debugging tips

1. **Enable verbose logging**: Add `console.log` statements in hooks to trace execution flow
2. **Check contract events**: Use the Envio indexer or Etherscan to view emitted events
3. **Verify FHE handles**: Check that encrypted handles are non-zero and properly formatted
4. **Test with small amounts**: Use small amounts for initial testing to minimize risk
5. **Use Foundry console**: Use `console.log` in Solidity tests for debugging contract logic

### Getting help

- Check the [Zama FHE documentation](https://docs.zama.ai/) for FHE-specific issues
- Review [ERC-4337 documentation](https://eips.ethereum.org/EIPS/eip-4337) for account abstraction issues
- Consult [Pimlico docs](https://docs.pimlico.io/) for bundler/paymaster issues
- Check [Privy documentation](https://docs.privy.io/) for authentication issues

---

## Development workflow

### Typical development cycle

1. **Make contract changes**:
   ```bash
   cd packages/contracts
   # Edit .sol files in src/
   forge build
   forge test
   ```

2. **Deploy to testnet**:
   ```bash
   PRIVATE_KEY=0x... forge script script/DeployAll.s.sol:DeployAll --rpc-url sepolia --broadcast
   ```

3. **Update frontend addresses**:
   - Copy deployed addresses from deployment output
   - Update `NEXT_PUBLIC_*` variables in `apps/web/.env.local`
   - Update `packages/indexer/config.yaml` with new addresses

4. **Update ABIs** (if contract interfaces changed):
   ```bash
   cd packages/contracts
   forge build
   # Copy ABIs from out/ to apps/web/src/lib/abi/
   ```

5. **Update frontend logic** (if needed):
   - Edit hooks in `apps/web/src/hooks/`
   - Edit components in `apps/web/src/components/`
   - Update FHE encryption logic in `apps/web/src/lib/fhe-compliance.ts`

6. **Test the changes**:
   ```bash
   pnpm dev
   # Open http://localhost:3000
   # Test payment flows in the UI
   ```

7. **Deploy indexer** (if contract events changed):
   - Update `packages/indexer/config.yaml` with new event signatures
   - Redeploy the Envio indexer (follow Envio documentation)

### Code style

- **Solidity**: Follow OpenZeppelin and Foundry conventions
- **TypeScript**: Follow ESLint rules in the project
- **React**: Use functional components with hooks
- **Comments**: Add NatSpec comments to all public contract functions

### Git workflow

1. Create a feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit: `git commit -m "feat: add my feature"`
3. Push and create a PR
4. Ensure tests pass before merging

### Pre-commit checks

Before committing, ensure:
- All contract tests pass: `pnpm forge:test`
- Frontend builds successfully: `pnpm build`
- No linting errors: `pnpm lint`
