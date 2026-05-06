
import { useQuery } from "@tanstack/react-query";
import { envioClient, ActivityType, GET_ALL_TRANSACTIONS } from "@/lib/envio/client";
import { JURISDICTION_DISPLAY, CATEGORY_DISPLAY } from "@/lib/audit-enums";
import { MockUSDCAddress } from "@/lib/CA";

export type AuditData = {
    date: Date;
    txHash: string;
    amount: string; // raw unit string
    formattedAmount: number; // numeric value for aggregation
    currency: string;
    entityId: string;
    jurisdiction: string;
    category: string;
    periodId: string;
    reference: string;
    details: any; // Raw details
    recipientAddress: string;
};

export type AuditStats = {
    totalCategorized: number;
    totalUncategorized: number;
    byJurisdiction: Record<string, { count: number; amount: number }>;
    byCategory: Record<string, { count: number; amount: number }>;
    healthScore: number;
};

export const useAuditData = (walletAddress?: string) => {
    return useQuery({
        queryKey: ["audit-data", walletAddress],
        queryFn: async () => {
            if (!walletAddress) return { transactions: [], stats: null };

            // Fetch ALL transactions for this wallet
            const response = await envioClient.request(GET_ALL_TRANSACTIONS, {
                walletId: walletAddress.toLowerCase()
            });
            const data = (response as any).Transaction || [];

            const transactions: AuditData[] = [];
            const stats: AuditStats = {
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

                // Determine decimals and currency based on token
                // Indexer might put token address in 'token' or 'target'
                // For IntentExecution, native value is denominated in ETH wei
                const tokenAddr = (details.token || details.target || "").toLowerCase();
                const isUsdc = tokenAddr === MockUSDCAddress.toLowerCase();
                const decimals = isUsdc ? 1e6 : 1e18;
                const currency = isUsdc ? "USDC" : "ETH";

                // 1. Single Execution
                if (tx.transactionType === ActivityType.EXECUTE) {
                    const audit = details.audit || {};
                    const entityId = audit.entityIds?.[0] || "";

                    const jurVal = Number(audit.jurisdiction || 0);
                    const catVal = Number(audit.category || 0);

                    const jurisdiction = JURISDICTION_DISPLAY[jurVal] || "None";
                    const category = CATEGORY_DISPLAY[catVal] || "None";

                    const rawAmount = details.value || details.amount || "0";
                    const amountVal = Number(rawAmount) / decimals;

                    const item: AuditData = {
                        date: new Date(Number(tx.timestamp) * 1000),
                        txHash: tx.txHash,
                        amount: rawAmount,
                        formattedAmount: amountVal,
                        currency: currency,
                        entityId,
                        jurisdiction,
                        category,
                        periodId: audit.referenceId || "",
                        reference: details.functionCall || "Transfer",
                        details,
                        recipientAddress: details.target || details.recipient || ""
                    };
                    transactions.push(item);

                    // Stats
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
                    const audit = details.audit || {}; // Global object with arrays

                    const entityIds = audit.entityIds || [];

                    // Parsing the stored string arrays (from Intent)
                    let jurisdictions: string[] = [];
                    let categories: string[] = [];

                    if (typeof audit.jurisdiction === 'string' && audit.jurisdiction.includes(',')) {
                        jurisdictions = audit.jurisdiction.split(',');
                    } else if (Array.isArray(audit.jurisdiction)) {
                        jurisdictions = audit.jurisdiction;
                    } else {
                        jurisdictions = [audit.jurisdiction || ""];
                    }

                    if (typeof audit.category === 'string' && audit.category.includes(',')) {
                        categories = audit.category.split(',');
                    } else if (Array.isArray(audit.category)) {
                        categories = audit.category;
                    } else {
                        categories = [audit.category || ""];
                    }


                    recipients.forEach((r: any, index: number) => {
                        const rawAmount = r.amount || r.value || "0";
                        const amountVal = Number(rawAmount) / decimals;

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

                        const item: AuditData = {
                            date: new Date(Number(tx.timestamp) * 1000),
                            txHash: tx.txHash,
                            amount: rawAmount,
                            formattedAmount: amountVal,
                            currency: currency,
                            entityId: entId,
                            jurisdiction: jur,
                            category: cat,
                            periodId: audit.referenceId || "",
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
        enabled: !!walletAddress
    });
};
