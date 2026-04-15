i just realized that they add points for every hashkey product you use, so these plans are to achieve that.


1. we have to build the full hsp suite including the polling stuff. check the documentation (merchant-docs-all-in-one.content.txt) for it, it doesn't have to be wired since we dont have the keys. i just need to say its built but we didn't have an api key so we had to simulate it. then we would make the simulation advanced, it looks like ours is just a basic simulation.

this is somebody submitted project's hsp deep dive
HSP Integration Deep Dive
HSP Payment Agent integrates with HSP (HashKey Settlement Protocol) at every stage of the payment lifecycle.

HMAC-SHA256 Request Signing
All outbound HSP API calls are signed with four custom headers:


X-App-Key     Merchant app key

X-Timestamp   Unix epoch seconds (5-minute window validated by HSP)

X-Nonce       Random UUID (32 hex chars, no dashes)

X-Signature   HMAC-SHA256( METHOD\nPATH\nQUERY\nSHA256(body)\nTIMESTAMP\nNONCE )
ES256K Merchant JWT with cart_hash Binding
Every order carries a merchant_authorization JWT signed with the merchant's secp256k1 private key:


cart_mandate

  ├── contents          (items, totals, chain config, expiry)

  │     └── SHA-256 digest  ─────────────────────────────────────┐

  └── merchant_authorization  (ES256K JWT)                       │

        └── cart_hash  ◄────────────────────────────────────────┘
The cart_hash is a SHA-256 digest of recursively key-sorted canonical JSON. Any modification to items, amounts, or addresses invalidates the JWT — protecting against man-in-the-middle cart tampering.

EIP-3009 Pay-Mandate — Zero-Click Settlement

Agent Wallet

  └── EIP-712 sign → TransferWithAuthorization {

        from, to, value, validAfter, validBefore, nonce

      }

  └── POST /api/v1/payment/pay-mandate  (x402-v2 payload)

        └── HSP verifies signature on-chain → USDC transfer
The user never sees a MetaMask dialog. The on-chain transfer is cryptographically authorized by the agent wallet, with a strict 5-minute expiry and a per-use random nonce.

Webhook Verification
HSP pushes events to POST /api/webhook. The raw body is captured before JSON parsing and verified with crypto.timingSafeEqual against a reconstructed HMAC. Events with a timestamp delta > 300 seconds are dropped (replay protection).



2. HashKey KYC SBT — The most impactful integration you can check the docs in hashkeykyc.md
 Here are two concrete integration points:

### A. Recipient KYC gating on payments

Before a payment executes, the `SmartWallet` or `IntentRegistry` can optionally check that recipients hold a valid KYC SBT. This is incredibly relevant for payroll/contractor compliance — you can enforce that you're only paying KYC-verified addresses.

**In `SmartWallet.sol`**, add an optional check:

```solidity
interface IKycSBT {
    function isHuman(address account) external view returns (bool, uint8);
}

address public constant KYC_SBT = 0x...; // testnet address

function _checkKyc(address recipient) internal view {
    (bool isVerified,) = IKycSBT(KYC_SBT).isHuman(recipient);
    require(isVerified, "Recipient not KYC verified");
}
```

You could make this a configurable flag per wallet — some companies require KYC'd recipients, others don't.

### B. KYC badge in the Compliance Dashboard

Even more impactful for the demo: in the frontend, when displaying recipients in the Audit Trail or Payment Form, query the KYC SBT and show a badge next to each address. This is purely read-only, requires no gas, and creates a visually compelling "verified recipient" indicator that judges will immediately understand.

In your existing `useAuditLogs.ts` or a new hook:

```typescript
import { createPublicClient, http } from 'viem';
import { hashkeyTestnet } from '@/lib/chains';

const KYC_SBT_ADDRESS = '0x...'; // testnet address
const KYC_ABI = [...]; // isHuman(address) -> [bool, uint8]

export async function checkKycStatus(address: string) {
  const publicClient = createPublicClient({
    chain: hashkeyTestnet,
    transport: http("https://testnet.hsk.xyz"),
  });
  
  const [isHuman, level] = await publicClient.readContract({
    address: KYC_SBT_ADDRESS,
    abi: KYC_ABI,
    functionName: 'isHuman',
    args: [address as `0x${string}`],
  }) as [boolean, number];
  
  return { isVerified: isHuman, level };
}
```

Then in your `AuditTrail.tsx` or `PaymentForm.tsx`, show a `✓ KYC Verified` badge or a warning when a recipient is unverified. You could also add this to the Compliance Overview with a "KYC Coverage" stat.

### C. KYC level in the compliance metadata

You could extend the encrypted payload to include the recipient's KYC level at the time of payment. This creates an immutable record not just of *what* you paid, but that the recipient was *verified* at that moment — extremely valuable for audit purposes.

---
also i want you to research if this is feasible on testnet and if yes how do addresses get kyc, tell me the process

3. APRO Oracle — USDC/USD price feed for accurate reporting

Your compliance reports currently show raw USDC amounts. Integrating the APRO oracle (`0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27` for USDC/USD on testnet) lets you display the **USD-denominated value** of payments at time of transaction in the tax reports.

This matters because the Oracle docs list a live USDC/USD feed specifically for HashKey Testnet. In `TaxReportGenerator.tsx` you could show "Amount (USDC)" alongside "USD Value at Payment Time" — which is exactly what tax authorities need for crypto payment reporting.

The integration would be a simple read in the frontend when fetching transaction history:

```typescript
const APRO_USDC_USD = '0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27';
const APRO_ABI = [/* latestRoundData() */];

// Returns (roundId, price, startedAt, timestamp, answeredInRound)
const [, price,,] = await publicClient.readContract({
  address: APRO_USDC_USD,
  abi: APRO_ABI,
  functionName: 'latestRoundData',
});
// price has 8 decimals, so divide by 1e8
```

---

## note i want you to give me your recommendation on what can be achieved (which is the most feasible without breaking stuff) and how you would achieve it, dont code yet

