'use client';

import { useWalletHistory, TransactionItemProps } from '@/hooks/useWalletHistory';
import { TransactionItem } from './TransactionItem';
import { Loader2, FileText } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent } from '../ui/sidebar';

export const TransactionList = ({ walletAddress }: { walletAddress?: string }) => {
    const { transactions, isLoading, error } = useWalletHistory(walletAddress);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Loading activity...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg text-red-400 text-center">
                Failed to load activity feed.
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="bg-muted/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <FileText size={32} />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No activity yet</h3>
                <p className="text-gray-400 text-sm max-w-sm mx-auto">
                    Transactions and intents will appear here once you start using your wallet.
                </p>
            </div>
        );
    }

    return (
        <SidebarGroup className="px-0">
            <SidebarGroupContent className='px-0'>
                {transactions.map((tx: TransactionItemProps) => (
                    <TransactionItem key={tx.id} item={tx} />
                ))}
            </SidebarGroupContent>
        </SidebarGroup>
    );
};
