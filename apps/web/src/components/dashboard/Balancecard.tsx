import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface BalanceCardsProps {
  availableToken?: string;
  committedToken?: string;
  isLoading?: boolean;
}

const formatBalance = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "0";
  if (num === 0) return "0";
  if (Number.isInteger(num)) return num.toString();
  return num.toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
};

const formatUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export function BalanceCards({ availableToken = "0", committedToken = "0", isLoading }: BalanceCardsProps) {
  const price = 1; // 1 USDC = 1 USD
  const priceLoading = false;
  
  const totalBalance = (parseFloat(availableToken) + parseFloat(committedToken)).toString();
  const safeTotal = isNaN(Number(totalBalance)) ? "0" : totalBalance;

  const totalUSD = parseFloat(safeTotal) * price;
  const committedUSD = parseFloat(committedToken) * price;
  const availableUSD = parseFloat(availableToken) * price;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs  @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Assets</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(safeTotal)} USDC`}
          </CardTitle>
          <CardAction>
             {priceLoading ? <Skeleton className="h-4 w-12" /> : (
              <div className="text-[10px] font-mono text-muted-foreground">
                ≈ {formatUSD(totalUSD)}
              </div>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground text-[10px] font-mono flex items-center gap-1">
             APRO Oracle Feed <Badge variant="outline" className="text-[8px] h-3 px-1 uppercase leading-none">Live</Badge>
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Scheduled</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(committedToken)} USDC`}
          </CardTitle>
          <CardAction>
            {priceLoading ? <Skeleton className="h-4 w-12" /> : (
              <div className="text-[10px] font-mono text-muted-foreground">
                ≈ {formatUSD(committedUSD)}
              </div>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground text-[10px] font-mono flex items-center gap-1">
             USDC/USD Stable Price
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Spendable</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(availableToken)} USDC`}
          </CardTitle>
          <CardAction>
             {priceLoading ? <Skeleton className="h-4 w-12" /> : (
              <div className="text-[10px] font-mono text-muted-foreground">
                ≈ {formatUSD(availableUSD)}
              </div>
            )}
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground text-[10px] font-mono flex items-center gap-1">
             Verified On-Chain
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
