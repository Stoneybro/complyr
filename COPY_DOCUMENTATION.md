# Complyr Copy Documentation

This document provides a comprehensive catalog of all copy (text content) in the Complyr application, organized by page and UI location.

---

## Table of Contents

1. [Home Page (/)](#home-page-)
2. [Login Page (/login)](#login-page-login)
3. [Deploy Page (/deploy)](#deploy-page-deploy)
4. [Wallet Page (/wallet)](#wallet-page-wallet)
5. [Compliance Page (/compliance)](#compliance-page-compliance)
6. [Auditor Portal (/auditor/[proxyAccount])](#auditor-portal-auditorproxyaccount)
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
- **Subheadline**: "A payment system for single, batch, and recurring transactions. Complyr attaches encrypted audit context to every payment and lets approved reviewers run private threshold checks without exposing sensitive business data."
- **CTA Buttons**:
  - Primary: "Try the demo" (links to /login)
  - Secondary: "Read the docs" (links to /docs)
- **Status Indicator**: "SYSTEM_STATUS: OPERATIONAL" (bottom left, animated)

### Problem Section
- **Location**: Section with light background
- **Section Label**: "The gap nobody talks about"
- **Headline**: "Blockchain transactions lack the business context needed for credible audits."
- **Body Text**: "While the transfer itself is permanently recorded, the actual business context, like expense categories, jurisdictions, and reviewer checks, remains scattered across emails and spreadsheets. For a business, this missing connection creates a weak audit trail."

### Features Section
- **Location**: Grid of feature cards
- **Section Label**: "Built for real business operations"
- **Section Headline**: "Everything a corporate treasury needs. Nothing it doesn't."
- **Feature Cards** (6 total):
  1. **Payroll & Subscriptions**: "Automated, stateful recurring payments. Manage employee salaries and subscriptions securely on-chain."
  2. **Batch Payouts**: "Execute mass vendor payments in a single transaction. Highly scalable infrastructure designed to save gas."
  3. **Single Transfers**: "Fast, reliable direct B2B transactions. The foundational layer for moving treasury funds efficiently."
  4. **Private Audit Data**: "Sensitive payment context and reviewer thresholds are secured with Zama FHE on Ethereum Sepolia."
  5. **Account Abstraction**: "Seamless gasless transactions and simple Web2-style social logins for frictionless enterprise onboarding."
  6. **Reviewer Portal**: "An isolated environment for external reviewers to run encrypted threshold tests without exposing underlying corporate data."

### How It Works Section
- **Location**: 4-step process section
- **Section Label**: "The Solution"
- **Section Headline**: "A dual ledger for every payment."
- **Build Version**: "DEMO_BUILD: ALFA" (right aligned)
- **Steps** (4 steps, each with label and description):
  1. **Smart Vaults** (Label: "01 / SYSTEM TREASURY"): "Deploy an audit-aware smart account onchain to act as your business's primary treasury."
  2. **Encryption** (Label: "02 / SECURE METADATA"): "Attach required audit context to your payment. Zama FHE keeps private context and review thresholds encrypted on Ethereum Sepolia."
  3. **Settlement** (Label: "03 / NATIVE EXECUTION"): "The payment settles natively onchain while encrypted audit records are permanently anchored in the same transaction."
  4. **Audit** (Label: "04 / VERIFIABLE PROOFS"): "Approve specific reviewers. They can create private threshold tests and decrypt only the resulting audit signals."

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
- **Technology Items** (6 items with roles):
  1. Ethereum Sepolia - Settlement
  2. Chainlink - Automation
  3. Zama FHE - Encryption
  4. Envio - Data Indexing
  5. ERC-4337 - Account Abstraction
  6. Automation - Scheduled Execution
- **Protocol Schema Label**: "Protocol Schema"
- **Schema Version**: "v0.2.0-beta"
- **Schema Filename**: "COMPLIANCE_PAYLOAD.JSON"

### Final CTA Section
- **Location**: Full-width colored section at bottom
- **Headline**: "Your business is already operating onchain. Your audit infrastructure should be too."
- **Subheadline**: "Complyr is live on Base. Experience the future of institutional-grade onchain finance today."
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
  - Tagline: "MATHEMATICALLY GUARANTEED PRIVACY. ENTERPRISE-GRADE ON-CHAIN SETTLEMENT."

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
- **Loading State**: "Loading…" (shown on button during authentication)

### Loading Skeleton
- **Welcome Text**: "Welcome Back!"
- **Subtext**: "Choose your preferred method to continue."
- **Skeleton placeholders** for 3 buttons

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
  - "Activation Time: Initializing registration takes ~5-10 seconds. Please do not close the window."
  - "Recommended View: Complyr is highly optimized for desktop and may have UI issues on mobile devices."

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
  - "Treasury"
  - "Audit Hub"
  - "Review Access"

### Sidebar (Left Panel)

#### Sidebar Navigation
- **Location**: Left sidebar, icon-only mode
- **Navigation Items**:
  - "Transactions" (File icon)
  - "Contacts" (Users icon)

#### Sidebar Content Panel
- **Location**: Right panel of sidebar (when expanded)
- **Section Headers**:
  - "Transactions" (when Transactions selected)
  - "Contacts" (when Contacts selected)
- **Add Contact Button**: "+ Add Contact" (visible when Contacts selected)

#### Sidebar Footer
- **Location**: Bottom of sidebar
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
- **Location**: Top of payment form
- **Tab Labels**:
  - "Single"
  - "Batch"
  - "Recurring"

#### Single Payment Form
- **Description**: "Send a payment to a single recipient."
- **Contact Selector**:
  - Placeholder: "Load from Contacts"
  - Alert: "You can create and manage contacts in the sidebar to automate audit context."
  - Empty state: "No contacts found. Use the sidebar to add a contact and automate audit context."
- **Form Fields**:
  - "Recipient Address" label with placeholder "0x..."
  - KYC Badge: "External KYC required" (when valid address entered)
  - "Amount" label with placeholder "0.00" and "USDC" suffix
- **Audit Context Section**:
  - Header: "Audit Context (Encrypted)"
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
  1. **Single Payments**:
     - Label: "Single Payments"
     - Value: Count
     - Badge: "+0%"
     - Footer: "One-off corporate payments"
  2. **Batch Payments**:
     - Label: "Batch Payments"
     - Value: Count
     - Badge: "+0%"
     - Footer: "Multi-destination payouts"
  3. **Subscriptions**:
     - Label: "Subscriptions"
     - Value: Count
     - Badge: "+0%"
     - Footer: "Recurring disbursements"
  4. **Payroll**:
     - Label: "Payroll"
     - Value: Count
     - Badge: "+0%"
     - Footer: "Automated distributions"
  5. **HSP Checkouts**:
     - Label: "HSP Checkouts"
     - Value: Count
     - Badge: "+0%"
     - Footer: "Hosted protocol payments"

#### Payment Table
- **Tabs**:
  - "Subscriptions"
  - "Payroll"
- **Table Headers**:
  - "Reference"
  - "Volume"
  - "Destinations"
  - "Status"
  - "Hash"
  - "Date"
  - "Term"
  - "Frequency"
  - "Action"
- **Empty State**: "No active [tab] instances."
- **Status Labels**:
  - "active"
  - "cancelled"
  - "completed"
  - "partial"
  - "failed"
- **Action Button**: "Cancel" (or "..." during cancellation)
- **Recipient Dropdown**: "[N] Recipients" placeholder

### Audit Hub Tab (Main Content)

#### Header Section
- **Headline**: "Audit Hub"
- **Description**: "Internal view of encrypted payment context, private reports, and the audit trail."
- **Buttons**:
  - "Refresh" (RefreshCcw icon)
  - "Decrypt Audit Data" or "Data Decrypted" (Lock/Unlock icon)
- **Alert Box**:
  - Icon: AlertTriangle
  - Text: "Payment context is cryptographically secured and linked to executed transfers. Private fields remain encrypted by default and can only be decrypted by authorized addresses."

#### Loading State
- **Loading Text**: "Securing connection to the encrypted ledger..."
- **Icon**: Loader2 spinner

#### Tabs
- **Tab Labels**:
  - "Overview"
  - "Private Reports"
  - "Audit Trail"

#### Overview Tab
- **Cards** (3 cards):
  1. **Audit Coverage**:
     - Label: "Audit Coverage"
     - Value: "[percentage]%"
     - Badge: "Healthy" (CheckCircle icon) or "Review Required" (AlertCircle icon)
     - Footer: "[classified] classified / [pending] pending context"
     - Progress bar
  2. **Jurisdiction Distribution**:
     - Label: "Jurisdiction Distribution"
     - Description: "Breakdown of payments by jurisdiction after local decryption."
     - List items: Jurisdiction badges with count and amount
     - Empty state: "No audit records available."
  3. **Payment Classification**:
     - Label: "Payment Classification"
     - Description: "Distribution of payments by declared transaction category."
     - List items: Category badges with count and amount
     - Empty state: "No categorized payments recorded."

#### Private Reports Tab
- **Card Header**:
  - Title: "Private Report Generator" (FileText icon)
  - Description: "Generate decrypted internal reports from encrypted audit context."
- **Filter Section** (3 filters):
  1. **Reporting Period**:
     - Label: "Reporting Period"
     - Options: "All Time", "[year] Full Year", "[year]-Q[quarter]"
  2. **Jurisdiction**:
     - Label: "Jurisdiction"
     - Options: "All Jurisdictions", [jurisdiction list]
  3. **Payment Category**:
     - Label: "Payment Category"
     - Options: "All Categories", [category list]
- **Report Preview**:
  - Header: "Private Report Preview"
  - Table Headers:
    - "Date"
    - "Recipient"
    - "KYC"
    - "USDC"
    - "USD (APRO)"
    - "Jur."
    - "Cat."
- **Export Button**: "Export CSV Report" (Download icon)

#### Audit Trail Tab
- **Card Header**:
  - Title: "Audit Trail" (ShieldCheck icon)
  - Description: "Immutable ledger of payments and their encrypted audit context."
- **Buttons**:
  - "Refresh" (RefreshCcw icon)
  - "Authorize View" or "Data Decrypted" (Lock/Unlock icon)
- **Search Input**: Placeholder "Search by transaction hash or recipient address"
- **Summary Cards**:
  - "TRANSACTIONS": Count
  - "VOLUME": Total amount in USDC
- **Empty State**:
  - "No payments recorded yet."
  - "Audit records will appear here after transactions are executed."
- **Record Items**:
  - Timestamp
  - "Record ID: [tx hash]"
  - Status badges: "[ VIEW AUTHORIZED ]" or "[ ENCRYPTED ]"
  - Recipient rows with:
    - KYC badge (UserX icon) with tooltip "Identity not available"
    - Address (truncated)
    - Amount
    - Decrypted badges: "Ref: [id]", "Cat: [category]", "Jur: [jurisdiction]"
    - Encrypted handle (when not decrypted)

### Review Access Tab (Main Content)

#### Card Header
- **Title**: "Review Access" (ShieldCheck icon)
- **Button**: "Share Access Link" or "Link Copied" (Share2/Check icon)
- **Description**: "Approved reviewers can run private encrypted review tests and decrypt permitted audit context."

#### Approved Reviewers Section
- **Section Header**: "Approved Reviewers"
- **Loading State**: Spinner
- **Empty State**:
  - Icon: Fingerprint
  - Text: "No external reviewers have been approved."
- **Reviewer Items**:
  - Address (full, monospace)
  - Access level dropdown: "Reviewer" or "Full Ledger"
  - Delete button (Trash icon)

#### Add New Reviewer Section
- **Section Header**: "Add New Reviewer"
- **Input Fields**:
  - Address input with placeholder "0x... (e.g. 0x123...abc)"
  - Access level dropdown: "Reviewer" or "Full Ledger"
- **Submit Button**: "Approve Reviewer" (UserPlus icon, or spinner during submission)
- **Limit Warning**: "You have reached the maximum limit of 5 external reviewers. Remove one before adding another."
- **Disclaimer**: "Approving an address grants access to the reviewer portal for this wallet. Removed reviewers lose future review-test access, but historical FHE decrypt grants cannot be cryptographically revoked."

---

## Compliance Page (/compliance)

This page uses the same ComplianceDashboard component as the Audit Hub tab in the Wallet page. See "Audit Hub Tab (Main Content)" section above for full copy details.

---

## Auditor Portal (/auditor/[proxyAccount])

### Header
- **Location**: Top sticky header
- **Logo**: Complyr logo
- **Badge**: "External Review Portal"

### Loading State
- **Loading Text**: "Verifying access ledger..."
- **Icon**: Loader2 spinner

### Connect Wallet State
- **Card Header**:
  - Logo: Complyr logo
  - Title: "Review Invite"
  - Description: "You have been approved to review encrypted audit signals for:"
  - Wallet address display (monospace, selectable)
- **Info Box**:
  - Icon: Lock
  - Text: "Private Review Thresholds"
- **Helper Text**: "Connect the approved reviewer key to configure thresholds and decrypt result signals."
- **CTA Button**: "Connect Key" (LogIn icon, or spinner during connection)

### Access Denied State
- **Card Header**:
  - Icon: XCircle (destructive color)
  - Title: "Access Denied" (destructive color)
  - Description: "This key is not approved to review the entity:"
  - Wallet address display
- **Current Key Display**: "Current key: [address]"
- **Button**: "Try Different Account"

### Active Session State
- **Session Card**:
  - Icon: ShieldCheck
  - Title: "Reviewer Session Active" with "[ LIVE ]" badge
  - Description: "You are reviewing encrypted audit signals for [wallet address]. Your key ([address]) can create private thresholds and decrypt the signal queue."
  - Access level: "Access level: [Reviewer or Ledger Reviewer]"
  - Button: "Close Session"

### Main Content Area
- **Headline**: "Private Review Portal"
- **Description**: "Configure encrypted thresholds and decrypt only the review signals generated by new payments."

#### Tabs
- **Tab Labels**:
  - "Review Setup"
  - "Result Queue"
  - "Reports" (disabled if no access)
  - "Evidence" (disabled if no access)
  - "Ledger" (disabled if no access)

#### Review Setup Tab
- **Card**: Create Review Test form
- **Form Fields**:
  - Test type selection: "Large Payment", "Recipient Exposure", "Category Exposure", "Jurisdiction Exposure"
  - Threshold input
  - Recipient scope input (for recipient tests)
  - Category dropdown (for category tests)
  - Jurisdiction dropdown (for jurisdiction tests)
- **Submit Button**: "Create Review Test"
- **Loading States**:
  - "Encrypting private threshold with Zama..."
  - "Requesting signature to create private review test..."
- **Success**: "Private review test created."

#### Result Queue Tab
- **Test List**: Shows created review tests with:
  - Test type label
  - Scope label
  - Threshold
  - Status
- **Decrypt Button**: "Decrypt Results"
- **Loading States**:
  - "Requesting Zama decrypt authorization..."
- **Success**: "Review signals decrypted."

#### Reports Tab
- **Decrypt Button**: "Decrypt Private Reports"
- **Loading State**: "Decrypting private reports..."
- **Success**: "Private reports decrypted."
- **Report Display**: Shows decrypted category and jurisdiction totals

#### Evidence Tab
- **Decrypt Button**: "Decrypt Ledger Evidence"
- **Loading State**: "Decrypting ledger evidence..."
- **Success**: "Ledger evidence decrypted."
- **Evidence Display**: Shows decrypted ledger records

#### Ledger Tab
- **Loading State**: Spinner
- **Record List**: Shows all ledger records with:
  - Transaction hash
  - Timestamp
  - Recipients
  - Amounts (encrypted or decrypted)
  - Categories (encrypted or decrypted)
  - Jurisdictions (encrypted or decrypted)
  - Reference IDs

---

## Documentation Pages (/docs)

Note: The documentation pages use MDX content from the `/content` directory. The specific copy varies based on the documentation content files.

### Layout
- **Navigation**: Standard documentation navigation
- **Content**: Rendered from MDX files in `/content` directory

---

## Common UI Elements

### Toast Notifications
- Success messages:
  - "Contact created"
  - "Contact updated"
  - "Contact deleted"
  - "External reviewer approved."
  - "Reviewer access updated."
  - "External reviewer removed."
  - "Reviewer portal link copied to clipboard."
  - "Private review test created."
  - "Review signals decrypted."
  - "Private reports decrypted."
  - "Ledger evidence decrypted."
- Error messages:
  - "Failed to delete contact"
  - "Failed to update contact"
  - "Invalid checksummed address"
  - "Please connect your wallet"
  - "Failed to approve reviewer"
  - "Failed to update reviewer access"
  - "Failed to remove reviewer"
  - "Failed to copy link"
  - "No Web3 wallet found."
  - "Failed to connect wallet."
  - "Enter a positive threshold amount."
  - "Enter a valid recipient scope address."
  - "Failed to create review test"
  - "Failed to decrypt review signals"
  - "Failed to decrypt reports"
  - "Failed to decrypt ledger"
- Loading messages:
  - "Checking wallet balance..."
  - "Preparing transaction environment..."
  - "Requesting signature to approve reviewer..."
  - "Transaction signed. Approving reviewer..."
  - "Requesting signature to update reviewer access..."
  - "Requesting signature to remove reviewer..."
- Validation errors:
  - "Please fill in recipient and amount"
  - "Reference ID, jurisdiction, and category are required for every recipient"
  - "Batch payments require at least 2 recipients"
  - "Please provide an amount for all recipients"
  - "Please provide a name for this recurring payment"
  - "Please add at least one recipient"
  - "Please specify the duration"
  - "Please enter a contact name"
  - "Please add at least one address"
  - "Please enter valid wallet addresses (0x...)"

### Loading States
- "Loading..."
- "Loading activity..."
- "Securing connection to the encrypted ledger..."
- "Verifying access ledger..."
- "Initializing..."
- "Activating..."
- "Saving..."

### Empty States
- "No contacts yet. Add one to get started!"
- "No activity yet"
- "No payments recorded yet."
- "No audit records available."
- "No categorized payments recorded."
- "No external reviewers have been approved."
- "No active [tab] instances."

### Form Placeholders
- "0x..." (address fields)
- "0.00" (amount fields)
- "Select..." (dropdown fields)
- "Max 7 char" (reference ID)
- "e.g., Alice, Engineering Team" (contact name)
- "e.g., emp-001" (reference ID helper)

### Helper Text
- "Example: emp-001, inv-99, vendor-id (Max 7 characters)"
- "Add multiple addresses to create a group contact"
- "You can create and manage contacts in the sidebar to automate audit context."
- "No contacts found. Use the sidebar to add a contact and automate audit context."

---

## Button Labels

### Primary Actions
- "Try the demo"
- "Read the docs"
- "Activate account"
- "Connect Key"
- "Create Contact"
- "Update Contact"
- "Add Recipient"
- "Add Another Address"
- "Approve Reviewer"
- "Create Review Test"
- "Decrypt Results"
- "Decrypt Private Reports"
- "Decrypt Ledger Evidence"
- "Export CSV Report"
- "Share Access Link"

### Secondary Actions
- "Cancel"
- "Remove"
- "Delete"
- "Close Session"
- "Try Different Account"
- "Refresh"
- "Decrypt Audit Data"
- "Authorize View"

### Navigation
- "Back" (arrow icon)
- "Next" (where applicable)

---

## Status Messages

### Transaction Status
- "Activating..."
- "Success"
- "Initializing..."
- "Failed"

### Access Levels
- "Reviewer"
- "Full Ledger"
- "Ledger Reviewer"

### Test Types
- "Large Payment"
- "Recipient Exposure"
- "Category Exposure"
- "Jurisdiction Exposure"

### Record Status
- "active"
- "cancelled"
- "completed"
- "partial"
- "failed"

### Encryption Status
- "[ VIEW AUTHORIZED ]"
- "[ ENCRYPTED ]"
- "Data Decrypted"

---

## File Naming Conventions

### Export Files
- `private_audit_report_[jurisdiction]_[category].csv`

---

## Notes

- All currency values are displayed in USDC
- All addresses are displayed in truncated format (first 6 and last 4 characters) unless full display is needed
- Monospace font is used for addresses, transaction hashes, and technical identifiers
- Uppercase with tracking-widest is used for labels, badges, and technical text
- The application uses a dark/light mode theme with appropriate text contrast
- Loading states use spinner animations (Loader2 icon)
- Success states use check icons (CheckCircle2, Check)
- Error states use alert icons (AlertTriangle, XCircle, AlertCircle)
- All external links open in new tabs with appropriate rel attributes
