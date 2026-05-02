// Compliance metadata for contract calls
export type ComplianceMetadata = {
    entityIds?: string[];       // Per-recipient identifiers (employee, vendor, customer ID)
    jurisdictions?: number[];   // Per-recipient enum values
    categories?: number[];      // Per-recipient enum values
    referenceIds?: string[];    // Per-recipient Reference IDs (max 7 chars each)
};

// UI-friendly version with strings
export type ComplianceMetadataUI = {
    entityIds?: string[];
    jurisdictions?: string[];   
    categories?: string[];      
    referenceIds?: string[];
};

export type BalanceCheckParams = {
    availableBalance: string;
    requiredAmount: string;
    token: "ETH" | "USDC" | "USDT";
};

export type SingleTransferParams = {
    to: `0x${string}`;
    amount: string;
    tokenAddress?: `0x${string}`; // undefined for native ETH
    compliance?: ComplianceMetadata;
    onStatusUpdate?: (status: string) => void;
};

export type BatchTransferParams = {
    recipients: `0x${string}`[];
    amounts: string[];
    tokenAddress?: `0x${string}`; // undefined for native ETH
    compliance?: ComplianceMetadata;
    onStatusUpdate?: (status: string) => void;
};

export type RecurringPaymentParams = {
    name: string;
    recipients: `0x${string}`[];
    amounts: string[];
    tokenAddress?: `0x${string}`; // undefined for native ETH
    duration: number;
    interval: number;
    transactionStartTime: number;
    revertOnFailure?: boolean;
    compliance?: ComplianceMetadata;
    onStatusUpdate?: (status: string) => void;
};

export type CancelIntentParams = {
    intentId: `0x${string}`;
};

export type PaymentType =
    | "single"
    | "batch"
    | "recurring"
    | "cancel-intent";

export type PaymentParams = {
    "single": SingleTransferParams;
    "batch": BatchTransferParams;
    "recurring": RecurringPaymentParams;
    "cancel-intent": CancelIntentParams;
};
