"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import useWalletDeployment from "@/hooks/useWalletDeployment";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DeploymentGuard({ children }: { children: React.ReactNode }) {
  const { data: isDeployed, isLoading, error, refetch } = useWalletDeployment();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we have a definitive answer (no errors)
    if (!isLoading && !error) {
      const onDeployPage = pathname.startsWith("/deploy");
      const onWalletPage = pathname.startsWith("/wallet");
      if (isDeployed && onDeployPage) {
        router.replace("/wallet");
      } else if (!isDeployed && onWalletPage) {
        router.replace("/deploy");
      }
    }
  }, [isDeployed, isLoading, error, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">
            Verifying wallet status...
          </p>
        </div>
      </div>
    );
  }

  // Show error UI instead of redirecting when network fails
  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md px-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="text-xl font-semibold">Connection Error</h2>
          <p className="text-muted-foreground text-center">
            Unable to verify wallet status. Please check your internet connection or try again.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const onDeployPage = pathname.startsWith("/deploy");
  if ((isDeployed && onDeployPage) || (!isDeployed && !onDeployPage)) {
    return null;
  }

  return <>{children}</>;
}