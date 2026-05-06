This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Complyr Overview

Complyr is a audit intelligence layer for programmable payments on Ethereum Sepolia. It captures encrypted audit metadata at payment creation time and makes records reviewable in audit workflows.

## Ethereum Sepolia Integrations

- **ERC-4337 smart accounts:** Routes payment operations through account abstraction infrastructure.
- **Pimlico bundler/paymaster:** Sponsors user operations on Ethereum Sepolia.
- **Envio indexer:** Reads Sepolia contract events for dashboard and audit activity.

## Outbound + Inbound Audit Coverage

Complyr covers both sides of the payment lifecycle:

- **Outbound payments (onchain transfers):** Audit metadata is attached when payments are created and submitted.
- **Inbound payments:** Checkout orchestration can capture audit fields before settlement, addressing the metadata gap found in direct inbound onchain transfers.

This model improves audit readiness by making audit evidence available for both funds sent and funds received.

## Integration Status

The current demo build is configured for Ethereum Sepolia. Contract addresses must be updated after the Sepolia deployment.
