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
    txHash: string;
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
        txHash: tx.txHash,
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
                description: details.functionCall === 'Token Transfer' || details.functionCall === 'Native HSK Transfer'
                    ? `Transfer to ${details.recipient?.slice(0, 6)}...` // Use recipient, NOT target (which is token contract)
                    : `${details.functionCall}`,
                details: details,

            };
            
        case ActivityType.ERC20_TRANSFER:
            return {
                ...base,
                type: ActivityType.ERC20_TRANSFER,
                description: `Transfer to ${details.recipient?.slice(0, 6)}...`,
                details: details,
            };
            
        case ActivityType.COMPLIANCE_RECORDED:
            return {
                ...base,
                type: ActivityType.COMPLIANCE_RECORDED,
                description: `Metadata securely anchored`,
                details: details,
            };
            
        case ActivityType.ACCOUNT_REGISTERED:
            return {
                ...base,
                type: ActivityType.ACCOUNT_REGISTERED,
                description: `Auditor configuration created`,
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
                    const isTransfer = tx.details.functionCall === 'Token Transfer' || tx.details.functionCall === 'Native HSK Transfer';
                    if (!isTransfer) return false;
                }

                // Filter out any internal transfers that happen in the SAME transaction as deployment
                // (e.g., initialization calls or ghost transactions)
                const deployedTx = query.data?.deployedTx;
                if (deployedTx && tx.txHash?.toLowerCase() === deployedTx.toLowerCase() && tx.type !== ActivityType.WALLET_CREATED) {
                    return false;
                }

                // Filter out ghost transactions before deployment
                const deployedAt = query.data?.deployedAt ? new Date(Number(query.data.deployedAt) * 1000) : null;
                if (deployedAt) {
                    const txDate = new Date(tx.timestamp);
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
            totalActivity: transactions.length,
            totalValue: 0,
        }
    };
};
