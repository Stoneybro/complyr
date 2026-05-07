

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

interface InfoCardsProps {
  singleCount?: number;
  batchCount?: number;
  subscriptionCount?: number;
  payrollCount?: number;
  isLoading?: boolean;
}

export function InfoCards({
  singleCount = 0,
  batchCount = 0,
  subscriptionCount = 0,
  payrollCount = 0,
  isLoading
}: InfoCardsProps) {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4  *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="font-sans">Single Payments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-sans">
            {isLoading ? <Skeleton className="h-8 w-16" /> : singleCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-sans">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm font-sans">
          <div className="text-muted-foreground">One-off corporate payments</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="font-sans">Batch Payments</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-sans">
            {isLoading ? <Skeleton className="h-8 w-16" /> : batchCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-sans">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm font-sans">
          <div className="text-muted-foreground">Multi-destination payouts</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="font-sans">Subscriptions</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-sans">
            {isLoading ? <Skeleton className="h-8 w-16" /> : subscriptionCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-sans">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm font-sans">
          <div className="text-muted-foreground">Recurring disbursements</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription className="font-sans">Payroll</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl font-sans">
            {isLoading ? <Skeleton className="h-8 w-16" /> : payrollCount}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="font-sans">
              +0%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm font-sans">
          <div className="text-muted-foreground">Automated distributions</div>
        </CardFooter>
      </Card>
    </div>
  )
}
