import { WalletOverview } from "./wallet-overview";

type DashboardProps = {
    walletAddress: `0x${string}`;
};

export function Dashboard({ walletAddress }: DashboardProps) {

    return (
        <div className="flex flex-col gap-4 p-4">
            <WalletOverview walletAddress={walletAddress} />
        </div>
    )
}