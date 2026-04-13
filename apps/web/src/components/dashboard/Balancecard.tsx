

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

export function BalanceCards({ availableToken = "0", committedToken = "0", isLoading }: BalanceCardsProps) {
  const totalBalance = (parseFloat(availableToken) + parseFloat(committedToken)).toString();
  const safeTotal = isNaN(Number(totalBalance)) ? "0" : totalBalance;

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs  @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Assets</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(safeTotal)} USDC`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Combined balance</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Scheduled</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(committedToken)} USDC`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Locked in payments</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Spendable</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {isLoading ? <Skeleton className="h-8 w-24" /> : `${formatBalance(availableToken)} USDC`}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Ready to send</div>
        </CardFooter>
      </Card>

    </div>
  )
}
