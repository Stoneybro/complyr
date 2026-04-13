# Complyr Smart Contract Pivot Report

This report summarizes the logical fixes and architectural updates made to the Complyr smart contracts to support the pivot to **HashKey Chain (PayFi Track)**.

## 1. Critical Logical Fixes

### 1.1 Authorization Deadlock in `ComplianceRegistry`
*   **Issue:** `recordTransaction` previously only allowed the `proxyAccount` (the wallet) to record compliance data. Since `IntentRegistry` creates records during intent creation, all automated payments were reverting.
*   **Fix:** Added an `authorizedCallers` mapping. The `IntentRegistry` is now authorized during deployment to record transactions on behalf of wallets.
*   **Impact:** Enables seamless on-chain compliance recording for both one-time and recurring (intent-based) payments.

### 1.2 Commitment Deadlock in `IntentRegistry`
*   **Issue:** `shouldExecuteIntent` was checking `getAvailableBalance()`, which subtracted *all* committed funds. Since an intent's funds are committed at creation, the intent was effectively locking itself out of its own funds.
*   **Fix:** Refactored the execution check. Since funds are already locked in `SmartWallet` specifically for the registry's use, we now verify the intent's remaining commitment rather than checking the wallet's global "uncommitted" balance.
*   **Impact:** Automated payments now execute correctly even when 100% of a wallet's balance is committed to intents.

## 2. Architectural Updates for PayFi

### 2.1 Multi-Token Support (ERC-20)
*   **Changes:**
    *   **`IntentRegistry`:** The `Intent` struct now includes a `token` address (`address(0)` for native HSK).
    *   **`SmartWallet`:** Commitment tracking is now a mapping (`address => uint256`), allowing separate locks for HSK, USDC, and USDT.
    *   **`SmartWallet`:** `executeBatchIntentTransfer` updated to handle both native and ERC-20 transfers within the same logic flow.
*   **Security:** Integrated OpenZeppelin's `SafeERC20` for all token interactions to handle non-standard ERC-20 implementations safely.

### 2.2 EntryPoint Compatibility
*   **Status:** Confirmed `SmartWallet.sol` and `VerifyingPaymaster.sol` are fully compatible with **EntryPoint v0.7** (standard for modern Account Abstraction).
*   **Address:** `0x0000000071727De22E5E9d8BAf0edAc6f37da032` (Canonical v0.7 address on HashKey Testnet).

### 2.3 Unified Encrypted Metadata
*   **Design:** For maximum gas efficiency and data integrity, all per-recipient metadata (Expense Category, Regulatory Jurisdiction, and **Reference ID**) is now unified into a single `encryptedPayload` blob.
*   **Specification:** The client-side application is responsible for packing these fields into a JSON object before AES-256 encryption.
*   **Impact:** Reduces on-chain storage costs and ensures that Reference IDs are cryptographically linked to their corresponding payment metadata.

### 2.4 Stablecoin Drip & Factory Refactor
*   **Mock Token:** Deployed `MockUSDC` (6 decimals) to ensure the PayFi demo is always fundable regardless of official faucet availability.
*   **Dual Drip:** 
    *   **Native HSK:** Factory now drips **0.01 HSK** per wallet (fallback for gas if Paymaster is offline).
    *   **Stablecoin:** Factory now drips **500 USDC** (mock) per wallet for settlement testing.
*   **Ownership:** `SmartWalletFactory` is now `Ownable`, allowing the owner to update drip amounts or switch from Mock USDC to official USDC later.

## 3. Deployment & Verification

### 3.1 Final Deployed Addresses (HashKey Testnet)
| Contract | Address |
|---|---|
| **MockUSDC** | `0x43e0BC90661dAF20C6fFbae1079d6E07E88e403A` |
| **IntentRegistry** | `0x6A0C73162c20Bc56212D643112c339f654C45198` |
| **ComplianceRegistry** | `0x6c6b5c86752D8B5330Cb055A967E2f6253D09195` |
| **SmartWallet Implementation** | `0x5D16F29E70e90ac48C7F4fb2c1145911a774eFbF` |
| **SmartWalletFactory** | `0x37c5c677146A19e61295E40F0518bAf3f94305fE` |
| **VerifyingPaymaster** | `0xd63E841AAb10D118a3cb541FbeF011eBae6437C6` |

### 3.2 Deployment Script (`DeployAll.s.sol`)
The master deployment script handled the atomic "wiring" of the system:
1.  Deployed all core registries, implementations, and the `MockUSDC`.
2.  Authorized the `SmartWalletFactory` and `IntentRegistry` in `ComplianceRegistry`.
3.  Configured the factory with 500 USDC drip settings.
4.  Minted 1 million Mock USDC to the factory.
5.  Wires registries and Paymaster together.

### 3.3 Test Results
All **19 test cases** across the suite are passing:
*   `IntentRegistryTest`: 3/3 PASS
*   `SmartWalletTest`: 9/9 PASS
*   `SmartWalletFactoryTest`: 4/4 PASS
*   `VerifyingPaymasterTest`: 3/3 PASS

## 4. Next Steps for Integration
*   **Frontend:** All constants updated in `apps/web/src/lib/CA.ts`.
*   **Frontend:** Switched network to HashKey Testnet in `chains.ts`.
*   **Keeper:** Updated `REGISTRY_ADDRESS` and network configuration.
*   **Indexer:** Updated `config.yaml` with new addresses and HashKey Chain ID (133).

## 5. Client Update Rundown

To fully integrate the new contracts, the following frontend changes are required:

### 5.1 Switch from FHEVM to AES-256
*   **Remove Zama:** Delete `lib/fhevm.ts` and remove the Zama SDK `<Script>` tag from `layout.tsx`.
*   **New Utility:** Create `lib/encryption.ts` using `Web Crypto API` (AES-256-GCM) to encrypt compliance data client-side.
*   **RefID Integration:** Update the metadata object to include `referenceId` (7-char) before encryption.

### 5.2 Update `useRecurringPayment` Hook
*   **Contract Call:** Update `createIntent` to pass the `token` address (e.g., `MockUSDCAddress`).
*   **Argument Count:** Change from 9 arguments (FHEVM handles/proofs) to 8 arguments (AES ciphertext blob).
*   **Removal of Relay:** Eliminate the call to `/api/relay/compliance-record` as the Registry now records data atomically during intent creation.

### 5.3 Update `useBatchTransfer` & `useSingleTransfer`
*   **Direct Compliance:** Update these hooks to call `recordCompliance` directly on the `SmartWallet` within the same UserOperation as the transfer.
*   **Multicall:** Use the `SmartWallet.executeBatch` or standard `UserOperation` batching to combine the `transfer` and `recordCompliance` calls.

### 5.4 Global Refactoring
*   **Tokens:** Update balance checks and UI components to support `MockUSDC` alongside native `HSK`.
*   **Indexer:** Ensure the frontend queries the new Envio indexer URLs for HashKey Chain.
 
 cast send 0x0000000071727De22E5E9d8BAf0edAc6f37 da032 "depositTo(address)" 0xd63E841AAb10D118a3cb541FbeF011eBae6 437C6 --value 0.5ether --rpc-url https://testnet.hsk.xyz --account sepoliakey





 i want to make a list of objectives for this project:
1. all payment transactions work (single and batch is critical, recurring is not priority but should work)
2. the indexer should work
3. the encrypting and decrypting for compliance should work.
4. the auditor portal should work
5. making the demo
6. integration of hsp
7. work on the UI