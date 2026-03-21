

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
  availableMpToken?: string;
  committedMpToken?: string;
  isLoading?: boolean;
}

// Smart balance formatter:
// - Shows 0 for exact zero
// - Shows whole numbers without decimals (1, 2, 100)
// - Preserves small decimals (0.0001)
const formatBalance = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return "0";
  if (num === 0) return "0";

  // Check if it's a whole number
  if (Number.isInteger(num)) return num.toString();

  // For decimals, remove trailing zeros but keep significant digits
  return num.toFixed(2).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
};

export function BalanceCards({ availableMpToken = "0", committedMpToken = "0", isLoading }: BalanceCardsProps) {
  const totalBalance = (parseFloat(availableMpToken) + parseFloat(committedMpToken)).toString();
  const safeTotal = isNaN(Number(totalBalance)) ? "0" : totalBalance;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs  @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(safeTotal)} MNT`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {parseFloat(safeTotal) > 0 ? "Balance is active" : "No activity this month"}
          </div>
          <div className="text-muted-foreground">
            sum of committed balance and free balance
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Reserved Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(committedMpToken)} MNT`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {parseFloat(committedMpToken) > 0 ? "Funds currently reserved" : "No activity this month"}
          </div>
          <div className="text-muted-foreground">
            Value locked in payrolls and subscriptions
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Available Balance</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(availableMpToken)} MNT`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {parseFloat(availableMpToken) > 0 ? "Liquidity available" : "No activity this month"}
          </div>
          <div className="text-muted-foreground">Value available for use and withdrawal</div>
        </CardFooter>
      </Card>

    </div>
  )
}
