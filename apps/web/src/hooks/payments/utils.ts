import { BalanceCheckParams, ComplianceMetadata } from "./types";

export function checkSufficientBalance({ availableBalance, requiredAmount, token }: BalanceCheckParams): {
    sufficient: boolean;
    message?: string;
} {
    const available = parseFloat(availableBalance);
    const required = parseFloat(requiredAmount);

    if (required > available) {
        return {
            sufficient: false,
            message: `Insufficient ${token} balance. Required: ${required} ${token}, Available: ${available.toFixed(2)} ${token}`
        };
    }

    return { sufficient: true };
}

export function assertRequiredCompliance(compliance: ComplianceMetadata | undefined, recipientCount: number) {
    const hasAllReferenceIds = compliance?.referenceIds?.length === recipientCount
        && compliance.referenceIds.every((referenceId) => referenceId.trim().length > 0);
    const hasAllCategories = compliance?.categories?.length === recipientCount
        && compliance.categories.every((category) => category > 0);
    const hasAllJurisdictions = compliance?.jurisdictions?.length === recipientCount
        && compliance.jurisdictions.every((jurisdiction) => jurisdiction > 0);

    if (!hasAllReferenceIds || !hasAllCategories || !hasAllJurisdictions) {
        throw new Error("Compliance reference, category, and jurisdiction are required for every recipient.");
    }
}

export function createComplianceRecordId(): `0x${string}` {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}
