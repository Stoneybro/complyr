# Complyr Copy Documentation

This document provides the canonical copy and UI strings for the Complyr platform.

## Table of Contents

1. [Home Page (/)](#home-page-)
2. [Login Page (/login)](#login-page-login)
3. [Deploy Page (/deploy)](#deploy-page-deploy)
4. [Wallet Page (/wallet)](#wallet-page-wallet)
5. [Records Page (/records)](#records-page-records)
6. [Auditor Portal (/auditors/[proxyAccount])](#auditor-portal-auditorsproxyaccount)
7. [Documentation Pages (/docs)](#documentation-pages-docs)

---

## Home Page (/)

### Navigation Bar (Top Header)
- **Location**: Fixed top navigation bar
- **Logo Text**: "Complyr" (brand name, uppercase, tracking-tighter)
- **Navigation Links**:
  - "Documentation" (links to /docs)
  - "GitHub" (links to external GitHub repo)
- **CTA Button**: "Try the demo" (links to /login)

### Hero Section
- **Location**: Main hero section, full viewport height
- **Headline**: "Private audit infrastructure for onchain business payments."
- **Subheadline**: "Complyr is a payments system that attaches encrypted audit records to every payment. Auditors can verify payments against defined rules without decrypting the data."
- **CTA Buttons**:
  - Primary: "Try the demo" (links to /login)
  - Secondary: "Read the docs" (links to /docs)
- **Status Indicator**: "SYSTEM_STATUS: OPERATIONAL" (bottom left, animated)

### Problem Section
- **Location**: Section with light background
- **Section Label**: "The gap nobody talks about"
- **Headline**: "Blockchain transactions lack the business context needed for credible audits."
- **Body Text**: "While the transfer itself is permanently recorded, the actual business context, like expense categories, jurisdictions, and references, remains scattered across emails and spreadsheets. For a business, this missing connection creates a weak audit trail."

### Features Section
- **Location**: Grid of feature cards
- **Section Label**: "Built for real business operations"
- **Section Headline**: "Everything a corporate treasury needs. Nothing it doesn't."
- **Feature Cards** (6 total):
  1. **Payroll & Subscriptions**: "Automated, stateful recurring payments. Manage employee salaries and subscriptions securely on-chain."
  2. **Batch Payouts**: "Execute mass vendor payments in a single transaction. Highly scalable infrastructure designed to save gas."
  3. **Single Transfers**: "Fast, reliable direct B2B transactions. The foundational layer for moving treasury funds efficiently."
  4. **Encrypted Audit Layer**: "Zama FHE lets the contract run checks on private data without decrypting it. Auditors get answers, not access."
  5. **Account Abstraction**: "Seamless gasless transactions and simple Web2-style social logins for frictionless enterprise onboarding."
  6. **External Audit Portal**: "Give specific auditors a private portal. They set their own rules, the contract checks payments against those rules, and they decrypt only the outcome."

### How It Works Section
- **Location**: 4-step process section
- **Section Label**: "The Solution"
- **Section Headline**: "A dual ledger for every payment."
- **Build Version**: "DEMO_BUILD: ALFA" (right aligned)
- **Steps** (4 steps, each with label and description):
  1. **Smart Vaults** (Label: "01 / SYSTEM TREASURY"): "Deploy an audit-aware smart account onchain to act as your business's primary treasury."
  2. **Encryption** (Label: "02 / SECURE METADATA"): "Attach required audit context to your payments. Zama FHE keeps private context and review thresholds encrypted on Ethereum Sepolia."
  3. **Settlement** (Label: "03 / NATIVE EXECUTION"): "The payment settles natively onchain while encrypted audit records are permanently anchored in the same transaction."
  4. **Audit** (Label: "04 / VERIFIABLE PROOFS"): "Approve specific reviewers. They can create private threshold tests and decrypt only the resulting audit signals."

### Why Fully Homomorphic Encryption Section
- **Location**: Columnar comparison section
- **Label**: "Why Fully Homomorphic Encryption"
- **Headline**: "Privacy and oversight have always been in conflict. FHE ends that."
- **Column 1 — Conventional Encryption**:
  - "Encrypts data at rest."
  - "To run any check, the data must be decrypted."
  - "Whoever runs the check sees everything."
- **Column 2 — The Audit Problem**:
  - "An auditor cannot verify limits without seeing payment amounts."
  - "This forces businesses to expose sensitive financial data just to prove audit."
- **Column 3 — What FHE Changes**:
  - "The system evaluates audit rules directly on encrypted data."
  - "Only the result is revealed: pass or fail."
  - "The underlying payment data is never exposed."

### Use Cases Section
- **Location**: Two-column layout with use case list
- **Section Label**: "Who is Complyr for?"
- **Section Headline**: "Any business that pays people on-chain needs a private audit layer."
- **Supporting Text**: "From decentralized protocols to established fintech platforms moving to the public ledger."
- **Use Cases** (4 items):
  1. **Web3 Native DAOs**: "Automate contributor payouts while maintaining public accountability and private, auditable records."
  2. **Global Payroll**: "Streamline cross-border contractor payments with integrated, encrypted tax document verification."
  3. **Onchain Treasury**: "Manage corporate capital calls and distributions with institutional-grade audit readiness and metadata."
  4. **Venture Capital & Grants**: "Distribute funding to portfolio companies or grantees while maintaining strict, auditable privacy over exact allocation amounts."

### Technology Section
- **Location**: Technology stack display
- **Section Label**: "The stack"
- **Technology Items** (5 items with roles):
  1. Ethereum Sepolia - Settlement
  2. Chainlink - Automation
  3. Zama FHE - Encryption
  4. Envio - Data Indexing
  5. ERC-4337 - Account Abstraction
- **Protocol Schema Label**: "Protocol Schema"
- **Schema Version**: "v0.2.0-beta"
- **Schema Filename**: "AUDIT_PAYLOAD.JSON"

### Final CTA Section
- **Location**: Full-width colored section at bottom
- **Headline**: "Your business is already operating onchain. Your audit infrastructure should be too."
- **Subheadline**: "Complyr is live on Ethereum Sepolia. Encrypted audit records for the onchain economy."
- **CTA Buttons**:
  - Primary: "Try the demo" (links to /login)
  - Secondary: "Read the docs" (links to /docs)

### Footer
- **Location**: Footer with 4 columns
- **Brand Column**:
  - Logo: "Complyr"
  - Description: "Private audit infrastructure for onchain business payments. Built for the future of institutional treasury."
  - Tagline: "Built for Onchain Auditability"
- **Resources Column**:
  - Header: "Resources"
  - Links: "Demo", "Docs", "GitHub", "Contracts"
- **Powered By Column**:
  - Header: "Powered By"
  - Items: "ETHEREUM SEPOLIA", "ZAMA FHE", "ENVIO"
- **Copyright Row**:
  - Copyright: "© 2026 COMPLYR INFRASTRUCTURE."
- **Footer Tagline**: "ENCRYPTED COMPUTATION. IMMUTABLE AUDIT RECORDS. ONCHAIN SETTLEMENT."

---

## Login Page (/login)

### Login Form
- **Location**: Centered card on page
- **Header Logo**: Complyr logo
- **Welcome Text**: "Welcome Back!"
- **Subtext**: "Choose your preferred method to continue."
- **Login Method Buttons** (3 options):
  1. "Login with Google" (with Google icon)
  2. "Login with GitHub" (with GitHub icon)
  3. "Email" (with Gmail icon)
- **Loading**: "Signing in…" (shown on button during authentication)

---

## Deploy Page (/deploy)

### Activation Page
- **Location**: Centered activation form
- **Headline**: "Activate your Complyr account"
- **Description Lines**:
  - "Your Complyr Business account is ready to activate."
  - "Demo accounts are pre-funded. All platform transactions are gasless."
- **Terms Checkbox**:
  - Label: "Accept terms and conditions."
  - Subtext: "By clicking this checkbox, you agree to the terms and conditions."
- **CTA Button** (states):
  - Default: "Activate account"
  - Loading: "Activating..."
  - Success: "Success"
- **Info Box**:
  - "Recommended View: Complyr is optimised for desktop. Mobile may have layout issues."

---

## Wallet Page (/wallet)

### Header
- **Location**: Top sticky header
- **Logo**: Complyr logo + "Complyr" text
- **Sidebar Trigger**: Hamburger menu icon

### Main Tabs
- **Location**: Tab navigation below header
- **Tab Labels**:
  - "Payments"
  - "Balance"
  - "Records"
  - "Auditors"

### Sidebar (Left Panel)

#### Sidebar Navigation
- **Navigation Items**:
  - "Transactions" (File icon)
  - "Contacts" (Users icon)

#### Sidebar Content Panel
- **Section Headers**:
  - "Transactions" (when Transactions selected)
  - "Contacts" (when Contacts selected)
- **Add Contact Button**: "+ Add Contact" (visible when Contacts selected)

#### Sidebar Footer
- **Wallet Address Display**: Truncated wallet address
- **Copy Button**: Copy address to clipboard
- **Logout Button**: (LogOut icon) with tooltip "Logout"

### Transactions Panel (Sidebar Content)
- **Loading State**: "Loading activity..."
- **Error State**: "Failed to load activity feed."
- **Empty State**:
  - Icon: FileText
  - Header: "No activity yet"
  - Text: "Transactions and intents will appear here once you start using your wallet."

### Contacts Panel (Sidebar Content)
- **Loading State**: Spinner animation
- **Empty State**: "No contacts yet. Add one to get started!"
- **Contact Items**:
  - Contact name
  - Address display (truncated or count)
  - Jurisdiction badge (if set)
  - Category badge (if set)
  - Delete button (Trash icon) on hover

### Contact Form (Sidebar Content)
- **Header**:
  - Back button (Arrow icon)
  - Title: "New Contact" or "Edit Contact"
- **Form Fields**:
  - "Name" label with placeholder "e.g., Alice, Engineering Team"
  - "Wallet Address" or "Address N" label with placeholder "0x..."
  - "Audit Context" separator
  - "Reference ID" label with placeholder "e.g., emp-001" and helper text "Example: emp-001, inv-99, vendor-id (Max 7 characters)"
  - "Jurisdiction" label with dropdown
  - "Category" label with dropdown
- **Buttons**:
  - "Remove" (for additional addresses)
  - "Add Another Address" (Plus icon)
  - Helper text: "Add multiple addresses to create a group contact"
  - Submit: "Create Contact" or "Update Contact" (or "Saving..." during submission)
  - Cancel: "Cancel"

### Payments Tab (Main Content)

#### Payment Type Tabs
- **Tab Labels**:
  - "Single"
  - "Batch"
  - "Recurring"

#### Single Payment Form
- **Description**: "Send a payment to a single recipient."
- **Contact Selector**:
  - Placeholder: "Load from Contacts"
  - Alert: "Contacts pre-fill audit records automatically. Manage them in the sidebar."
  - Empty state: "No contacts found. Use the sidebar to add a contact and automate audit context."
- **Form Fields**:
  - "Recipient Address" label with placeholder "0x..."
  - "Amount" label with placeholder "0.00" and "USDC" suffix
- **Audit Context Section**:
  - Header: "Audit Record (Encrypted)"
  - "Reference ID" label with placeholder "Max 7 char"
  - "Recipient Jurisdiction" label with dropdown placeholder "Select..."
  - "Expense Category" label with dropdown placeholder "Select..."
- **Contact Badge**: "Contact: [name]" (when loaded from contact)

#### Batch Payment Form
- **Description**: "Send payments to multiple recipients in one transaction."
- **Contact Selector**:
  - Placeholder: "Select Contacts"
- **Add Recipient Button**: "Add Recipient" (Plus icon)
- **Recipient Rows**:
  - "Recipient Address" label with placeholder "0x..."
  - "Amount" label with placeholder "0.00" and token symbol
  - "Audit Context (Encrypted)" header
  - "Reference ID" label with placeholder "Max 7 char"
  - "Recipient Jurisdiction" label with dropdown
  - "Expense Category" label with dropdown
  - "Contact: [name]" badge (if loaded)
  - Delete button (Trash icon)
- **Error Messages**:
  - "Batch payments require at least 2 recipients"
  - "Please provide an amount for all recipients"
  - "Reference ID, jurisdiction, and category are required for every recipient"

#### Recurring Payment Form
- **Description**: "Set up automated scheduled payments."
- **Form Fields**:
  - "Payment Name" label
  - Contact selector with placeholder "Select Contacts"
  - "Add Recipient" button
  - Recipient rows (same as batch)
  - Additional scheduling fields (interval, duration, start date)
- **Error Messages**:
  - "Please provide a name for this recurring payment"
  - "Please add at least one recipient"
  - "Please provide an amount for all recipients"
  - "Please specify the duration"

#### Submit Button
- **Text**: Varies by payment type
- **Loading State**: Shows spinner during transaction

### Treasury Tab (Main Content)

#### Balance Cards Section
- **Section Label**: "Capital Allocation"
- **Refresh Button**: (RefreshCcw icon)
- **Balance Cards** (3 cards):
  1. **Total Assets**:
     - Label: "Total Assets"
     - Value: "[amount] USDC"
     - USD equivalent: "≈ $[amount]"
     - Footer: "APRO Oracle Feed" with "Live" badge
  2. **Scheduled**:
     - Label: "Scheduled"
     - Value: "[amount] USDC"
     - USD equivalent: "≈ $[amount]"
     - Footer: "USDC/USD Stable Price"
  3. **Spendable**:
     - Label: "Spendable"
     - Value: "[amount] USDC"
     - USD equivalent: "≈ $[amount]"
     - Footer: "Verified On-Chain"

#### Activity Cards Section
- **Section Label**: "Asset Activity"
- **Activity Cards** (5 cards):
  1. **Single Payments**: "One-off corporate payments"
  2. **Batch Payments**: "Multi-destination payouts"
  3. **Subscriptions**: "Recurring disbursements"
  4. **Payroll**: "Automated distributions"
  5. **HSP Checkouts**: "Hosted protocol payments"

#### Payment Table
- **Tabs**:
  - "Subscriptions"
  - "Payroll"
- **Table Headers**: "Reference", "Volume", "Destinations", "Status", "Hash", "Date", "Term", "Frequency", "Action"
- **Empty State**: "No active [tab] instances."
- **Status Labels**: "active", "cancelled", "completed", "partial", "failed"

### Records Tab (Main Content)

#### Header Section
- **Headline**: "Records"
- **Description**: "Internal view of every payment your account has made, with all encrypted audit records. Decrypt to see the details."
- **Buttons**: "Refresh", "Decrypt Records" or "Records Decrypted"
- **Alert Box**: "Audit records are encrypted at the source and linked permanently to their payment. Only addresses you have authorised can decrypt them."

#### Tabs
- **Tab Labels**:
  - "Summary"
  - "Private Reports"
  - "Payments Trail"

#### Overview Tab
- **Cards** (3 cards):
  1. **Record Coverage**: "[percentage]%", "Healthy" or "Review Required", "[classified] classified / [pending] pending context"
  2. **Jurisdiction Distribution**: "Breakdown of payments by recipient jurisdiction"
  3. **Payment Classification**: "Distribution of payments by declared transaction category."

#### Private Reports Tab
- **Card Header**: "Report Generator", "Generate and download your decrypted audit records as a CSV file."
- **Filter Section**: "Reporting Period", "Jurisdiction", "Payment Category"
- **Report Preview**: "Private Report Preview"
- **Export Button**: "Export CSV Report"

#### Payments Trail Tab
- **Card Header**: "Payments Trail", "Immutable ledger of payments and their encrypted audit records, in order."
- **Search**: "Search by transaction hash or recipient address"
- **Record Items Status**: "[ DECRYPTED ]" or "[ ENCRYPTED ]"

### Auditors Tab (Main Content)

#### Card Header
- **Title**: "Auditors"
- **Button**: "Share Portal Link"
- **Description**: "Give external auditors a private portal link. They can set their own rules and check whether your payments meet them, without seeing your payment data."

#### Approved Auditors Section
- **Section Header**: "Approved Auditors"
- **Empty State**: "No external auditors have been approved."

#### Access Levels
- **Signal Access**: Can create rules and see whether payments triggered them. Cannot see payment amounts or individual records.
- **Full Access**: Can see the full decrypted payment record in addition to audit signals.

#### Add New Auditor Section
- **Section Header**: "Add Auditor"
- **Input Fields**: "Auditor wallet address", Access level dropdown
- **Submit Button**: "Approve Auditor"
- **Disclaimer**: "Adding an auditor gives them access to the external portal for this account. Removing an auditor blocks future access, but any decryption rights previously granted by the FHE layer cannot be reversed."

---

## Auditor Portal (/auditors/[proxyAccount])

### Header
- **Logo**: Complyr logo
- **Badge**: "External Auditor Portal"

### Connect Wallet State
- **Title**: "Audit Invite"
- **Description**: "You have been approved to audit payments made by: [wallet]"
- **Info Box**: "Private Audits"
- **Helper Text**: "The rules you set here are encrypted before they leave your browser. The business cannot see your audit criteria."
- **CTA Button**: "Connect wallet"

### Access Denied State
- **Title**: "Access Denied"
- **Description**: "This wallet has not been approved to audit: [wallet]"
- **Button**: "Try Different Account"

### Active Session State
- **Title**: "Audit Session Active" with "[ LIVE ]" badge
- **Description**: "You are auditing payments made by [wallet]. Your wallet ([address]) can set rules and read your result queue."
- **Access Level Display**: "Access level: [Signal Access / Full Access]"
- **Button**: "End Session"

### Main Content Area
- **Headline**: "Auditor Portal"
- **Description**: "Set private rules and check whether payments meet them. Your rules stay encrypted. The payment data stays private. You see only the outcome."

#### Tabs
- **Tab Labels**: "Rules", "Results", "Reports", "Evidence", "Records"

#### Rules Setup Tab
- **Card**: Create a Rule
- **Description**: "Set a threshold. Every new payment is automatically checked against it. Your threshold is encrypted before it leaves your browser — the business never sees the value you set."
- **Test Types**: "Large Payment", "Recipient Exposure", "Category Exposure", "Jurisdiction Exposure"
- **Submit Button**: "Save Rule"

#### Result Tab
- **Description**: "Encrypted outcomes from the contract checking your rules against new payments. Decrypt to see which rules were triggered."
- **Button**: "Decrypt Results"
- **Result states**: "Triggered", "Not Triggered"

#### Reports Tab
- **Description**: "Aggregate payment summaries. Available to auditors with Signal Access or higher."
- **Button**: "Decrypt Report"

#### Evidence Tab
- **Description**: "Individual payment records linked to triggered rules. Available to auditors with Full Access."
- **Button**: "Decrypt Evidence"

#### Records Tab
- **Description**: "Full payment history for this account. Available to auditors with Full Access only."

---

## Documentation Pages (/docs)

### Layout
- **Navigation**: Standard documentation navigation
- **Content**: Rendered from MDX files in `/content` directory

---

## Common UI Elements

### Toast Messages
- **Success**: "Contact saved.", "Contact updated.", "Contact deleted.", "Auditor approved.", "Access level updated.", "Auditor removed.", "Portal link copied.", "Rule saved.", "Results decrypted.", "Report decrypted.", "Evidence decrypted.", "Records decrypted."
- **Error**: "Failed to delete contact", "Failed to update contact", "Invalid checksummed address", "Please connect your wallet", "Failed to approve auditor", "Failed to update access level", "Failed to remove auditor", "Failed to copy link", "No wallet found.", "Failed to connect wallet.", "Enter a positive threshold amount.", "Enter a valid recipient scope address.", "Failed to create rule", "Failed to decrypt results", "Failed to decrypt reports", "Failed to decrypt evidence"

### Loading States
- "Loading...", "Loading activity...", "Loading your encrypted records...", "Checking access...", "Activating...", "Saving..."

### Status Labels
- "[ DECRYPTED ]", "[ ENCRYPTED ]", "Records Decrypted"

### Navigation
- "Back" (arrow icon)

---

## File Naming Conventions

### Export Files
- `private_audit_report_[jurisdiction]_[category].csv`

---

## Technical Notes

- All currency values are displayed in USDC.
- All addresses are displayed in truncated format (first 6 and last 4 characters) unless full display is needed.
- Monospace font is used for addresses, transaction hashes, and technical identifiers.
- Uppercase with tracking-widest is used for labels, badges, and technical text.
- The application uses a dark/light mode theme with appropriate text contrast.
- Loading states use spinner animations (Loader2 icon).
- Success states use check icons (CheckCircle2, Check).
- Error states use alert icons (AlertTriangle, XCircle, AlertCircle).
- All external links open in new tabs with appropriate rel attributes.
