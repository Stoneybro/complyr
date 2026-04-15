# HashKey Settlement Protocol (HSP) Integration

Complyr integrates the **HashKey Settlement Protocol (HSP)** to support controlled, auditable inbound payment flows.

In practical terms, HSP is how Complyr extends compliance coverage beyond outbound treasury transfers and into incoming revenue collection.

## Why this integration exists

Direct on-chain inbound transfers are difficult to standardize for compliance. A sender can transfer funds to a business wallet without attaching structured business context.

That creates an inbound metadata gap:

- payment arrives successfully,
- but jurisdiction/category/reference context may be missing,
- making audit preparation and tax reconciliation harder.

HSP gives Complyr a controlled checkout rail where compliance context can be captured before settlement.

## Technical Details

- **Authentication:** HMAC-SHA256 request signing
- **Authorization:** ES256K (`secp256k1`) merchant JWT
- **Standard:** EIP-3009 Pay-Mandate compatible
- **Integrity Control:** Canonical JSON hashing with `cart_hash` binding

## How Complyr uses HSP

Complyr uses HSP as an inbound checkout orchestration layer:

1. Business creates an HSP checkout order.
2. Checkout request is signed and authorized.
3. Compliance context is attached to the payment intent.
4. Settlement executes through the HSP path.
5. Inbound payment is recorded with traceable compliance metadata.

This means incoming flows can be reviewed with the same structure as outbound treasury records.

## Security Mechanics

### HMAC-SHA256 header generation

All requests to the HSP gateway are signed with high-entropy headers to ensure authenticity and replay resistance.

```typescript
X-App-Key     Merchant app key
X-Timestamp   Unix epoch seconds (5-minute window)
X-Nonce       Random UUID
X-Signature   HMAC-SHA256( METHOD\nPATH\nQUERY\nSHA256(body)\nTIMESTAMP\nNONCE )
```

### Merchant authorization JWT

Every payment order carries a `merchant_authorization` JWT signed with the merchant private key.

Complyr implements `cart_hash` binding so that any modification to amount, recipient, or order content invalidates authorization.

## Compliance Outcome

With HSP integration, Complyr can:

- capture inbound compliance data before settlement,
- preserve cryptographic authorization evidence,
- reduce manual reconciliation for incoming revenue,
- and present outbound + inbound compliance records in one review surface.

## Hackathon implementation status

In this hackathon build, HSP checkout is shown as a **simulated integration flow** because production merchant signing credentials were not available during the build window.

The protocol wiring, signing model, and compliance integration logic are documented and reflected in product copy and architecture.
