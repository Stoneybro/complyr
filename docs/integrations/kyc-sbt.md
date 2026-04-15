# HashKey KYC SBT Integration

Complyr integrates with the **HashKey KYC Soulbound Token (SBT)** as an external identity signal. KYC verification is not performed by Complyr itself; instead, Complyr reads on-chain KYC status and uses it to guide payment workflows and compliance review.

This keeps identity issuance and payment execution decoupled: an independent KYC provider manages credentials, while Complyr consumes those credentials as a control signal.

## Technical Details

- **Credential Standard:** HashKey KYC SBT
- **Functions Used:** `isHuman(address)` and `getKycInfo(address)`
- **Status Model:** `NONE (0)`, `APPROVED (1)`, `REVOKED (2)`
- **Level Model:** `NONE (0)`, `BASIC (1)`, `ADVANCED (2)`, `PREMIUM (3)`, `ULTIMATE (4)`

## Why this integration exists

Business payments are not only about balances and transfers; they are also about counterparty risk and eligibility.

Without a reusable identity signal, payment systems either:

- rely on ad-hoc manual checks,
- duplicate KYC processes in each app,
- or execute first and investigate later.

By reading KYC SBT on-chain, Complyr can apply identity-aware controls directly inside payment workflows and compliance views.

## Implementation

Complyr queries the KYC SBT contract via `viem` using the `useKyc` hook.

```typescript
const [isValid, level] = await publicClient.readContract({
  address: HASHKEY_KYC_SBT,
  abi: KYC_SBT_ABI,
  functionName: "isHuman",
  args: [address],
});
```

The integration also reads `getKycInfo(address)` to retrieve richer context (e.g., level/status metadata) for display and reporting.

## Flow in Complyr

1. User enters or selects a recipient address.
2. Complyr checks KYC SBT status for that address.
3. UI surfaces verification state and level inline.
4. Compliance report views can include KYC status as part of recipient context.

This enables teams to spot risk earlier in the payment lifecycle.

### UI Surfaces

- **Payments Form:** Valid recipient addresses are auto-checked and shown as `KYC · <level>` or `Unverified`.
- **KYC Tab:** Demo flow to simulate external KYC approval and selected level for a target address.
- **Compliance Report Generator:** Manifest review table and CSV exports include KYC status and level for recipient entries.

## Practical controls enabled

KYC SBT integration allows Complyr to support policy decisions such as:

- flagging unverified recipients before execution,
- prioritizing review paths based on KYC level,
- and preserving recipient identity posture in audit evidence.

## Why it matters for Compliance

KYC status is a core control for risk-aware payment operations. By consuming HashKey's on-chain identity credentials, Complyr can enforce and report recipient identity posture consistently across outbound payments, inbound checkout records, and audit workflows.

In short, Complyr does not reinvent KYC — it operationalizes KYC credentials where payment and compliance decisions happen.
