
import { useQuery } from "@tanstack/react-query";
import { envioClient, ActivityType, GET_ALL_TRANSACTIONS } from "@/lib/envio/client";
import { JURISDICTION_DISPLAY, CATEGORY_DISPLAY } from "@/lib/compliance-enums";

export type ComplianceData = {
    date: Date;
    txHash: string;
    amount: string;
    currency: string;
    entityId: string;
    jurisdiction: string;
    category: string;
    periodId: string;
    reference: string;
    details: any; // Raw details
    recipientAddress: string;
};

export type ComplianceStats = {
    totalCategorized: number;
    totalUncategorized: number;
    byJurisdiction: Record<string, { count: number; amount: number }>;
    byCategory: Record<string, { count: number; amount: number }>;
    healthScore: number;
};

export const useComplianceData = (walletAddress?: string) => {
    return useQuery({
        queryKey: ["compliance-data", walletAddress],
        queryFn: async () => {
            if (!walletAddress) return { transactions: [], stats: null };

            // Fetch ALL transactions for this wallet
            const response = await envioClient.request(GET_ALL_TRANSACTIONS, {
                walletId: walletAddress.toLowerCase()
            });
            console.log(response);
            const data = (response as any).Transaction || [];

            const transactions: ComplianceData[] = [];
            const stats: ComplianceStats = {
                totalCategorized: 0,
                totalUncategorized: 0,
                byJurisdiction: {},
                byCategory: {},
                healthScore: 0
            };

            for (const tx of data) {
                if (!tx.details) continue;

                let details: any = {};
                try {
                    details = JSON.parse(tx.details);
                } catch (e) {
                    continue;
                }

                // --- Parsing Logic ---

                // 1. Single Execution
                if (tx.transactionType === ActivityType.EXECUTE) {
                    const compliance = details.compliance || {};
                    const entityId = compliance.entityIds?.[0] || "";

                    const jurVal = Number(compliance.jurisdiction || 0);
                    const catVal = Number(compliance.category || 0);

                    const jurisdiction = JURISDICTION_DISPLAY[jurVal] || "None";
                    const category = CATEGORY_DISPLAY[catVal] || "None";

                    const item: ComplianceData = {
                        date: new Date(Number(tx.timestamp) * 1000),
                        txHash: tx.txHash,
                        amount: details.value || details.amount || "0",
                        currency: "FLOW",
                        entityId,
                        jurisdiction,
                        category,
                        periodId: compliance.referenceId || "",
                        reference: details.functionCall || "Transfer",
                        details,
                        recipientAddress: details.target || details.recipient || ""
                    };
                    transactions.push(item);

                    // Stats
                    const amountVal = Number(item.amount) / 1e18;
                    const isCategorized = jurVal !== 0 || catVal !== 0;

                    if (isCategorized) stats.totalCategorized++;
                    else stats.totalUncategorized++;

                    if (jurVal !== 0) {
                        const jurLabel = JURISDICTION_DISPLAY[jurVal];
                        if (!stats.byJurisdiction[jurLabel]) stats.byJurisdiction[jurLabel] = { count: 0, amount: 0 };
                        stats.byJurisdiction[jurLabel].count++;
                        stats.byJurisdiction[jurLabel].amount += amountVal;
                    }

                    if (catVal !== 0) {
                        const catLabel = CATEGORY_DISPLAY[catVal];
                        if (!stats.byCategory[catLabel]) stats.byCategory[catLabel] = { count: 0, amount: 0 };
                        stats.byCategory[catLabel].count++;
                        stats.byCategory[catLabel].amount += amountVal;
                    }
                }

                // 2. Batch Execution / Intent Execution
                else if (tx.transactionType === ActivityType.EXECUTE_BATCH || tx.transactionType === ActivityType.INTENT_EXECUTION) {
                    const recipients = details.recipients || details.calls || [];
                    const compliance = details.compliance || {}; // Global object with arrays

                    const entityIds = compliance.entityIds || [];

                    // Parsing the stored string arrays (from Intent)
                    let jurisdictions: string[] = [];
                    let categories: string[] = [];

                    if (typeof compliance.jurisdiction === 'string' && compliance.jurisdiction.includes(',')) {
                        jurisdictions = compliance.jurisdiction.split(',');
                    } else if (Array.isArray(compliance.jurisdiction)) {
                        jurisdictions = compliance.jurisdiction;
                    } else {
                        jurisdictions = [compliance.jurisdiction || ""];
                    }

                    if (typeof compliance.category === 'string' && compliance.category.includes(',')) {
                        categories = compliance.category.split(',');
                    } else if (Array.isArray(compliance.category)) {
                        categories = compliance.category;
                    } else {
                        categories = [compliance.category || ""];
                    }


                    recipients.forEach((r: any, index: number) => {
                        const amount = r.amount || r.value || "0";
                        const amountVal = Number(amount) / 1e18;

                        // Resolve per-recipient metadata
                        const entId = entityIds[index] || "";

                        let jurRaw = "0";
                        if (jurisdictions.length === recipients.length) jurRaw = jurisdictions[index];
                        else if (jurisdictions.length === 1) jurRaw = jurisdictions[0]; // Broadcast

                        let catRaw = "0";
                        if (categories.length === recipients.length) catRaw = categories[index];
                        else if (categories.length === 1) catRaw = categories[0]; // Broadcast

                        const jurVal = Number(jurRaw || 0);
                        const catVal = Number(catRaw || 0);

                        const jur = JURISDICTION_DISPLAY[jurVal] || "None";
                        const cat = CATEGORY_DISPLAY[catVal] || "None";

                        const item: ComplianceData = {
                            date: new Date(Number(tx.timestamp) * 1000),
                            txHash: tx.txHash,
                            amount: amount,
                            currency: "FLOW",
                            entityId: entId,
                            jurisdiction: jur,
                            category: cat,
                            periodId: compliance.referenceId || "",
                            reference: tx.title || "Batch Payment",
                            details,
                            recipientAddress: r.recipient || r.target || r.address || ""
                        };
                        transactions.push(item);

                        // Stats Aggregation
                        const isCategorized = jurVal !== 0 || catVal !== 0 || !!entId;
                        if (isCategorized) stats.totalCategorized++;
                        else stats.totalUncategorized++;

                        if (jurVal !== 0) {
                            if (!stats.byJurisdiction[jur]) stats.byJurisdiction[jur] = { count: 0, amount: 0 };
                            stats.byJurisdiction[jur].count++;
                            stats.byJurisdiction[jur].amount += amountVal;
                        }

                        if (catVal !== 0) {
                            if (!stats.byCategory[cat]) stats.byCategory[cat] = { count: 0, amount: 0 };
                            stats.byCategory[cat].count++;
                            stats.byCategory[cat].amount += amountVal;
                        }
                    });
                }
            }

            // Calculate Health Score (percentage of categorized transactions)
            const totalTx = stats.totalCategorized + stats.totalUncategorized;
            stats.healthScore = totalTx > 0 ? Math.round((stats.totalCategorized / totalTx) * 100) : 100;

            return { transactions, stats };
        },
        enabled: false // !!walletAddress, // Temporarily disabled to prevent incessant calls
    });
};
