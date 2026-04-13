"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@radix-ui/react-label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useDeployWallet } from "@/hooks/useDeployWallet";
import useWalletDeployment from "@/hooks/useWalletDeployment";
import { LZStatusTracker } from "@/components/ui/lz-status-tracker";

function Page() {
  const [checked, setChecked] = useState(false);
  const { mutate: deployWallet, isPending, bridgeStatus } = useDeployWallet();
  const { isLoading } = useWalletDeployment();
  if (isLoading) {
    return <div>Loading...</div>;
  }
  return (
    <div>
      <div className='bg-background flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
        <div className='w-full max-w-md flex flex-col gap-6 justify-center items-center text-center'>

          <div className=' text-3xl font-semibold text-center'>
            Activate your Complyr account
          </div>
          <div className='flex flex-col text-sm text-muted-foreground gap-1'>
            <div>Your Complyr Business account is ready to activate.</div>
            <div>Demo accounts are pre-funded. All platform transactions are gasless.</div>
          </div>
          <Label className='hover:bg-muted/50 dark:hover:bg-muted/30 flex items-start gap-3 rounded-lg border p-3 has-[[aria-checked=true]]:border-black has-[[aria-checked=true]]:bg-muted dark:has-[[aria-checked=true]]:border-accent dark:has-[[aria-checked=true]]:bg-muted/50'>
            <Checkbox
              checked={checked}
              onCheckedChange={() => {
                setChecked(!checked);
              }}
              id='toggle-2'
              className='data-[state=checked]:border-black data-[state=checked]:bg-black data-[state=checked]:text-white dark:data-[state=checked]:border-accent dark:data-[state=checked]:bg-muted'
            />
            <div className='flex flex-col items-start justify-center gap-1.5 font-normal'>
              <p className='text-sm leading-none font-medium'>
                Accept terms and conditions.
              </p>
              <p className='text-muted-foreground text-left text-sm'>
                By clicking this checkbox, you agree to the terms and
                conditions.
              </p>
            </div>
          </Label>
          <Button
            variant={"default"}
            className="w-full flex items-center justify-center gap-2"
            onClick={() => deployWallet()}
            disabled={!checked || isPending}
          >
            {isPending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
            {bridgeStatus === "hsk_tx_pending" && "Activating..."}
            {bridgeStatus === "confirmed" && "Success"}
            {bridgeStatus === "idle" && "Activate account"}
          </Button>

          <div className="mt-2 text-xs text-muted-foreground bg-muted p-3 rounded text-left flex flex-col gap-2">
             <p><strong>Activation Time:</strong> Initializing registration takes ~5-10 seconds. Please do not close the window.</p>
             <p><strong>Recommended View:</strong> Complyr is highly optimized for desktop and may have UI issues on mobile devices.</p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Page;