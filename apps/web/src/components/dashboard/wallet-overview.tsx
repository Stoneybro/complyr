"use client";

import * as React from "react";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { WalletQR } from "@/components/wallet/qrcode";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWalletBalance } from "@/utils/helper";
import { truncateAddress } from "@/utils/format";
import CopyText from "@/components/ui/copy";
import { Button } from "@/components/ui/button";
import { BalanceCards } from "./Balancecard";
import { InfoCards } from "./InfoCard";
import { ComplianceSummary } from "./ComplianceSummary";
import { TransactionItemProps, useWalletHistory } from "@/hooks/useWalletHistory";
import { ActivityType } from "@/lib/envio/client";
import { useMemo } from "react";
import PaymentTable from "./PaymentTable";
import { RefreshCcw } from "lucide-react";

type WalletOverviewProps = {
    walletAddress?: string;
};

export function WalletOverview({ walletAddress }: WalletOverviewProps) {
    const queryClient = useQueryClient();
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const { data: wallet, isLoading: walletIsLoading } = useQuery({
        queryKey: ["walletBalance", walletAddress],
        queryFn: () => fetchWalletBalance(walletAddress as `0x${string}`),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        enabled: !!walletAddress,
    });

    const { transactions, isLoading: historyIsLoading } = useWalletHistory(walletAddress);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["walletBalance", walletAddress] }),
            queryClient.invalidateQueries({ queryKey: ["walletHistory", walletAddress] }),
        ]);
        // Small delay to show the animation
        setTimeout(() => setIsRefreshing(false), 500);
    };

    const stats = useMemo(() => {
        if (!transactions) return { single: 0, batch: 0, subscription: 0, payroll: 0 };

        let single = 0;
        let batch = 0;
        let subscription = 0;
        let payroll = 0;

        transactions.forEach((tx: TransactionItemProps) => {
            if (tx.type === ActivityType.EXECUTE) {
                single++;
            } else if (tx.type === ActivityType.EXECUTE_BATCH) {
                batch++;
            } else if (tx.type === ActivityType.INTENT_CREATED) {
                const recipients = tx.details?.recipients || [];
                if (recipients.length > 1) {
                    payroll++;
                } else {
                    subscription++;
                }
            }
        });

        return { single, batch, subscription, payroll };
    }, [transactions]);


    return (
        <>
            <div className="@container/main flex flex-col gap-2  ">
                <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold ml-2 md:ml-4">Balances:</div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <BalanceCards
                    availableMpToken={wallet?.availableMntBalance}
                    committedMpToken={wallet?.committedMntBalance}
                    isLoading={walletIsLoading}
                />
            </div>
            <div className="@container/main flex flex-col gap-2  ">
                <div className="text-lg font-semibold ml-2 md:ml-4">Payment Information:</div>
                <InfoCards
                    singleCount={stats.single}
                    batchCount={stats.batch}
                    subscriptionCount={stats.subscription}
                    payrollCount={stats.payroll}
                    isLoading={historyIsLoading}
                />
            </div>

            <div className="@container/main flex flex-col gap-2  ">

                <PaymentTable walletAddress={walletAddress} />
            </div>
        </>
    );
}
