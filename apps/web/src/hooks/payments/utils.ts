import { BalanceCheckParams, AuditMetadata } from "./types";

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

export function assertRequiredAudit(audit: AuditMetadata | undefined, recipientCount: number) {
    const hasAllReferenceIds = audit?.referenceIds?.length === recipientCount
        && audit.referenceIds.every((referenceId) => referenceId.trim().length > 0);
    const hasAllCategories = audit?.categories?.length === recipientCount
        && audit.categories.every((category) => category > 0);
    const hasAllJurisdictions = audit?.jurisdictions?.length === recipientCount
        && audit.jurisdictions.every((jurisdiction) => jurisdiction > 0);

    if (!hasAllReferenceIds || !hasAllCategories || !hasAllJurisdictions) {
        throw new Error("Audit reference, category, and jurisdiction are required for every recipient.");
    }
}

export function createAuditRecordId(): `0x${string}` {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}` as `0x${string}`;
}
