# APRO Oracle Integration

Complyr integrates with the **APRO Oracle** to provide real-time USD-denominated values for USDC assets on the HashKey Chain. This integration ensures that treasury balances and tax reports are accurate and compliant with global financial standards.

In short: APRO helps translate on-chain token amounts into a standardized fiat reporting context that finance teams and auditors actually use.

## Why this integration exists

On-chain payments are native to token units. Business reporting and tax workflows are usually denominated in fiat (USD in this integration).

Without a trusted price source, teams typically rely on manual screenshots or external spreadsheets, which creates inconsistency and weakens audit trails.

APRO gives Complyr a verifiable, on-chain pricing reference for USDC/USD valuation.

## Technical Details

- **Oracle Pair:** USDC/USD
- **Contract Address (Testnet):** `0xCdB10dC9dB30B6ef2a63aB4460263655808fAE27`
- **Mechanism:** Push-based data feeds with threshold updates.
- **Heartbeat:** 24h
- **Deviation Threshold:** 0.1%

## Implementation

The integration is implemented via a custom React hook `useAproOracle` that queries the APRO Price Feed contract using `viem`.

### Hook: `useAproOracle.ts`

```typescript
const data = await publicClient.readContract({
    address: APRO_USDC_USD_ORACLE,
    abi: APRO_ORACLE_ABI,
    functionName: "latestRoundData",
});
const price = Number(data[1]) / 1e8; // 8 decimals
```

### Data flow in Complyr

1. App reads latest APRO round data from HashKey chain.
2. Raw oracle answer is normalized to decimal USD price.
3. UI multiplies USDC values by current oracle price.
4. USD-normalized values are displayed in treasury and compliance views.
5. CSV exports include the same valuation context for offline reconciliation.

### UI Components

- **Treasury Overview:** Shows the approximate USD value of "Total Assets", "Scheduled", and "Spendable" USDC balances.
- **Compliance Report Generator:** Uses APRO pricing in the compliance manifest preview to provide USD-normalized reporting context for auditors.
- **CSV Export:** Includes APRO-referenced USD values alongside USDC amounts for downstream reconciliation.

## Practical value for operators

APRO integration helps operators:

- compare payment activity in a single fiat baseline,
- review exposure and spending patterns more intuitively,
- and produce cleaner records for accounting, tax, and external review.

## Why it matters for Compliance

Cryptocurrency payments often need to be reported to tax authorities in fiat currency values. By using a decentralized oracle like APRO, Complyr provides an immutable, verifiable record of the USD value of every transaction, reducing audit risk for businesses.

In Complyr, this improves consistency between treasury monitoring and compliance reporting by grounding both in the same on-chain oracle feed.

While oracle prices are market data (not legal tax advice), they provide a transparent valuation reference that materially improves reporting quality over ad-hoc manual conversion.
