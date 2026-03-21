// Compliance enum mappings - mirrors the Solidity enums
// Used to convert between human-readable strings and contract enum values

// Jurisdiction enum values (must match MpIntentRegistry.Jurisdiction)
export const Jurisdiction = {
    NONE: 0,
    US_CA: 1,
    US_NY: 2,
    US_TX: 3,
    US_FL: 4,
    US_OTHER: 5,
    UK: 6,
    EU_DE: 7,
    EU_FR: 8,
    EU_OTHER: 9,
    NG: 10,
    SG: 11,
    AE: 12,
    OTHER: 13,
} as const;

// Category enum values (must match MpIntentRegistry.Category)
export const Category = {
    NONE: 0,
    PAYROLL_W2: 1,
    PAYROLL_1099: 2,
    CONTRACTOR: 3,
    BONUS: 4,
    INVOICE: 5,
    VENDOR: 6,
    GRANT: 7,
    DIVIDEND: 8,
    REIMBURSEMENT: 9,
    OTHER: 10,
} as const;

export type JurisdictionValue = typeof Jurisdiction[keyof typeof Jurisdiction];
export type CategoryValue = typeof Category[keyof typeof Category];

// String to enum conversion maps
export const JURISDICTION_MAP: Record<string, number> = {
    "": 0,
    "none": 0,
    "US-CA": 1,
    "US-NY": 2,
    "US-TX": 3,
    "US-FL": 4,
    "US-OTHER": 5,
    "UK": 6,
    "EU-DE": 7,
    "EU-FR": 8,
    "EU-OTHER": 9,
    "NG": 10,
    "SG": 11,
    "AE": 12,
    "OTHER": 13,
};

export const CATEGORY_MAP: Record<string, number> = {
    "": 0,
    "none": 0,
    "PAYROLL_W2": 1,
    "PAYROLL_1099": 2,
    "CONTRACTOR": 3,
    "BONUS": 4,
    "INVOICE": 5,
    "VENDOR": 6,
    "GRANT": 7,
    "DIVIDEND": 8,
    "REIMBURSEMENT": 9,
    "OTHER": 10,
};

// Reverse maps for display purposes
export const JURISDICTION_LABELS: Record<number, string> = {
    0: "",
    1: "US-CA",
    2: "US-NY",
    3: "US-TX",
    4: "US-FL",
    5: "US-OTHER",
    6: "UK",
    7: "EU-DE",
    8: "EU-FR",
    9: "EU-OTHER",
    10: "NG",
    11: "SG",
    12: "AE",
    13: "OTHER",
};

export const CATEGORY_LABELS: Record<number, string> = {
    0: "",
    1: "PAYROLL_W2",
    2: "PAYROLL_1099",
    3: "CONTRACTOR",
    4: "BONUS",
    5: "INVOICE",
    6: "VENDOR",
    7: "GRANT",
    8: "DIVIDEND",
    9: "REIMBURSEMENT",
    10: "OTHER",
};

// Human-readable labels for UI display
export const JURISDICTION_DISPLAY: Record<number, string> = {
    0: "Not Specified",
    1: "US - California",
    2: "US - New York",
    3: "US - Texas",
    4: "US - Florida",
    5: "US - Other",
    6: "United Kingdom",
    7: "Germany",
    8: "France",
    9: "Other EU",
    10: "Nigeria",
    11: "Singapore",
    12: "UAE",
    13: "Other",
};

export const CATEGORY_DISPLAY: Record<number, string> = {
    0: "Not Specified",
    1: "Payroll (W2)",
    2: "Payroll (1099)",
    3: "Contractor",
    4: "Bonus",
    5: "Invoice",
    6: "Vendor",
    7: "Grant",
    8: "Dividend",
    9: "Reimbursement",
    10: "Other",
};

/**
 * Convert a jurisdiction string to enum value
 * @param jurisdiction - String like "US-CA", "UK", etc.
 * @returns Enum value (number)
 */
export function stringToJurisdiction(jurisdiction: string | undefined): number {
    if (!jurisdiction) return Jurisdiction.NONE;
    return JURISDICTION_MAP[jurisdiction] ?? Jurisdiction.NONE;
}

/**
 * Convert a category string to enum value
 * @param category - String like "PAYROLL_W2", "CONTRACTOR", etc.
 * @returns Enum value (number)
 */
export function stringToCategory(category: string | undefined): number {
    if (!category) return Category.NONE;
    return CATEGORY_MAP[category] ?? Category.NONE;
}

/**
 * Convert arrays of jurisdiction strings to enum values
 * @param jurisdictions - Array of jurisdiction strings
 * @returns Array of enum values
 */
export function stringsToJurisdictions(jurisdictions: (string | undefined)[]): number[] {
    return jurisdictions.map(j => stringToJurisdiction(j));
}

/**
 * Convert arrays of category strings to enum values
 * @param categories - Array of category strings
 * @returns Array of enum values
 */
export function stringsToCategories(categories: (string | undefined)[]): number[] {
    return categories.map(c => stringToCategory(c));
}

/**
 * Convert enum value to jurisdiction string
 * @param value - Enum value
 * @returns String like "US-CA"
 */
export function jurisdictionToString(value: number): string {
    return JURISDICTION_LABELS[value] ?? "";
}

/**
 * Convert enum value to category string
 * @param value - Enum value
 * @returns String like "PAYROLL_W2"
 */
export function categoryToString(value: number): string {
    return CATEGORY_LABELS[value] ?? "";
}

/**
 * Get dropdown options for jurisdiction select
 */
export function getJurisdictionOptions(): { value: string; label: string }[] {
    return [
        { value: "none", label: "None" },
        { value: "US-CA", label: "US - California" },
        { value: "US-NY", label: "US - New York" },
        { value: "US-TX", label: "US - Texas" },
        { value: "US-FL", label: "US - Florida" },
        { value: "US-OTHER", label: "US - Other" },
        { value: "UK", label: "United Kingdom" },
        { value: "EU-DE", label: "Germany" },
        { value: "EU-FR", label: "France" },
        { value: "EU-OTHER", label: "Other EU" },
        { value: "NG", label: "Nigeria" },
        { value: "SG", label: "Singapore" },
        { value: "AE", label: "UAE" },
        { value: "OTHER", label: "Other" },
    ];
}

/**
 * Get dropdown options for category select
 */
export function getCategoryOptions(): { value: string; label: string }[] {
    return [
        { value: "none", label: "None" },
        { value: "PAYROLL_W2", label: "Payroll (W2)" },
        { value: "PAYROLL_1099", label: "Payroll (1099)" },
        { value: "CONTRACTOR", label: "Contractor" },
        { value: "BONUS", label: "Bonus" },
        { value: "INVOICE", label: "Invoice" },
        { value: "VENDOR", label: "Vendor" },
        { value: "GRANT", label: "Grant" },
        { value: "DIVIDEND", label: "Dividend" },
        { value: "REIMBURSEMENT", label: "Reimbursement" },
        { value: "OTHER", label: "Other" },
    ];
}
