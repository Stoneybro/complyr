import { useQuery } from '@tanstack/react-query';
import { envioClient, GET_WALLET_ACTIVITY, Transaction, ActivityType } from '@/lib/envio/client';
import { useMemo } from 'react';

export interface TransactionItemProps {
    type: ActivityType;
    id: string;
    timestamp: string;
    title: string;
    description: string;
    details: any;
    status: 'success' | 'failed' | 'partial';

}

const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const truncateName = (name: string, maxLength: number = 20): string => {
    if (name.length <= maxLength) return name;
    return name.slice(0, maxLength - 3) + '...';
};

const mapTransactionToItem = (tx: Transaction): TransactionItemProps => {
    const base = {
        id: tx.id,
        timestamp: new Date(Number(tx.timestamp) * 1000).toISOString(),
        status: 'success' as const,
        title: tx.title,
    };

    let details: any = {};
    try {
        details = JSON.parse(tx.details);
    } catch (e) {
        console.error("Failed to parse transaction details", e);
    }

    switch (tx.transactionType) {
        case ActivityType.INTENT_CREATED:
            const scheduleType = details.recipientCount === 1 ? "Subscription" : "Payroll";
            const scheduleName = truncateName(details.scheduleName || 'Untitled');
            const createdTime = formatTime(base.timestamp);
            return {
                ...base,
                type: ActivityType.INTENT_CREATED,
                description: `${scheduleType}`,
                details: details,

            };
        case ActivityType.INTENT_EXECUTION:
            // Determine status based on transfers
            let status: 'success' | 'failed' | 'partial' = 'success';
            if (details.failedTransfers > 0) {
                status = details.successfulTransfers > 0 ? 'partial' : 'failed';
            }

            const executionType = details.recipientCount === 1 ? "Subscription" : "Payroll";
            const executionName = truncateName(details.scheduleName || 'Untitled');
            const executionTime = formatTime(base.timestamp);
            return {
                ...base,
                type: ActivityType.INTENT_EXECUTION,
                description: `${executionType}`,
                details: details,
                status: status,

            };

        case ActivityType.INTENT_CANCELLED:
            const cancelledName = truncateName(details.scheduleName || 'Untitled');
            const cancelledTime = formatTime(base.timestamp);
            return {
                ...base,
                type: ActivityType.INTENT_CANCELLED,
                description: `${cancelledName} `,
                details: details,

            };

        case ActivityType.EXECUTE:
            return {
                ...base,
                type: ActivityType.EXECUTE,
                description: details.functionCall === 'Token Transfer'
                    ? `Transfer to ${details.recipient?.slice(0, 6)}...` // Use recipient, NOT target (which is token contract)
                    : `${details.functionCall}`,
                details: details,

            };

        case ActivityType.EXECUTE_BATCH:
            const batchCount = details.batchSize || 0;
            const batchTime = formatTime(base.timestamp);
            return {
                ...base,
                type: ActivityType.EXECUTE_BATCH,
                description: `${batchCount} ${batchCount === 1 ? 'payment' : 'payments'} `,
                details: details,

            };

        case ActivityType.TRANSFER_FAILED:
            return {
                ...base,
                type: ActivityType.TRANSFER_FAILED,
                description: details.reason || 'Transfer failed',
                details: details,
                status: 'failed',

            };

        case ActivityType.WALLET_CREATED:
            return {
                ...base,
                type: ActivityType.WALLET_CREATED,
                description: 'wallet deployed',
                details: details,

            };

        default:
            return {
                ...base,
                type: tx.transactionType,
                title: tx.title || 'Unknown Activity',
                description: 'Unknown transaction type',
                details: details,

            };
    }
};

export const useWalletHistory = (walletAddress?: string) => {
    const query = useQuery({
        queryKey: ['walletHistory', walletAddress],
        queryFn: async () => {
            if (!walletAddress) return null;
            const variables = { walletId: walletAddress.toLowerCase() };
            const data: any = await envioClient.request(GET_WALLET_ACTIVITY, variables);

            return data.Wallet?.[0] || null;
        },
        enabled: !!walletAddress,
        refetchInterval: 10000,
    });

    const transactions = useMemo(() => {

        if (!query.data?.transactions) return [];
        return query.data.transactions
            .map(mapTransactionToItem)
            .filter((tx: TransactionItemProps) => {
                // Filter out contract calls (non-transfer EXECUTE transactions)
                if (tx.type === ActivityType.EXECUTE) {
                    const isTransfer = tx.details.functionCall === 'Token Transfer' || tx.details.functionCall === 'Native FLOW Transfer';
                    return isTransfer;
                }

                // Filter out transactions before deployment (ghost transactions)
                const deployedAt = query.data?.deployedAt ? new Date(Number(query.data.deployedAt) * 1000) : null;
                if (deployedAt) {
                    const txDate = new Date(tx.timestamp);
                    // Allow slight buffer (e.g. 1 minute) or strict inequality? 
                    // Assuming ghost tx is significantly older or specific glitch. 
                    // Using strict comparison might hide WALLET_CREATED if seconds differ slightly.
                    // But WALLET_CREATED should match deployedAt exactly if indexed correctly.
                    // Safest is to allow WALLET_CREATED explicitly.
                    if (tx.type === ActivityType.WALLET_CREATED) return true;
                    return txDate >= deployedAt;
                }

                return true;
            });
    }, [query.data]);

    return {
        ...query,
        transactions,
        walletStats: {
            totalActivity: query.data?.totalTransactionCount || 0,
            // totalValue is no longer easy to aggregate on the client side without specific fields
            // We can leave it as 0 or remove it if not used widely
            totalValue: 0,
        }
    };
};
