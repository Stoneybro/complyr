"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth";
import { getSmartAccountClient } from "@/lib/smartAccountClient";
import CustomSmartAccount from "@/lib/customSmartAccount";
import type { SmartAccountClient } from "permissionless";


const INIT_MAX_RETRIES = 5;
const INIT_BASE_BACKOFF_MS = 1000; 
const INIT_MAX_BACKOFF_MS = 60_000; 
const GETCLIENT_ATTEMPTS = 4;
const GETCLIENT_RETRY_MS = 1500;

type ContextValue = {
  client: SmartAccountClient | null;
  isInitializing: boolean;
  error: Error | null;
  getClient: (opts?: { timeoutMs?: number }) => Promise<SmartAccountClient>;
};

const SmartAccountContext = createContext<ContextValue | undefined>(undefined);

export function SmartAccountProvider({ children }: { children: React.ReactNode }) {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets?.find((w) => w.walletClientType === "privy");

  const { initCustomAccount, isLoading: isCustomLoading, error: customError } =
    CustomSmartAccount();

  const [client, setClient] = useState<SmartAccountClient | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // concurrency / lifecycle refs
  const initPromiseRef = useRef<Promise<SmartAccountClient | null> | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const backoffRef = useRef<number>(INIT_BASE_BACKOFF_MS);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  const clearRetry = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    backoffRef.current = INIT_BASE_BACKOFF_MS;
  }, []);

  const initialize = useCallback(
    async (force = false): Promise<SmartAccountClient | null> => {

      if (initPromiseRef.current && !force) return initPromiseRef.current;

      const promise = (async (): Promise<SmartAccountClient | null> => {
        setError(null);

        // Pre-checks
        if (!ready) {
          console.debug("[SmartAccount] init skipped: privy not ready");
          return null;
        }
        if (!authenticated) {
          console.debug("[SmartAccount] init skipped: user not authenticated");
          return null;
        }
        if (!embeddedWallet) {
          console.debug("[SmartAccount] init skipped: no embedded wallet found");
          return null;
        }

        if (customError) {
          console.error("[SmartAccount] custom account hook error", customError);
          setError(new Error("Custom account initialization error"));
          return null;
        }

        // reuse client if appears valid
        if (client && !force) {
          try {
            if (client.account && typeof client.sendUserOperation === "function") {
              return client;
            }
          } catch (e) {
            console.warn("[SmartAccount] existing client invalidating", e);
            setClient(null);
          }
        }

        setIsInitializing(true);
        try {
          // attempt creation with bounded retries to handle transient RPC/bundler outages
          let lastErr: unknown = null;
          for (let attempt = 0; attempt < INIT_MAX_RETRIES; attempt++) {
            try {
              console.debug("[SmartAccount] initializing custom account");
              const custom = await initCustomAccount();
              if (!custom) throw new Error("Custom smart account unavailable");

              console.debug("[SmartAccount] creating smart account client");
              const c = await getSmartAccountClient(custom);
              // sanity check
              if (!c || !c.account) throw new Error("SmartAccountClient invalid");

              if (isMountedRef.current) {
                setClient(c);
                clearRetry();
              }
              console.info("[SmartAccount] initialized");
              return c;
            } catch (err) {
              lastErr = err;
              const backoff = Math.min(backoffRef.current, INIT_MAX_BACKOFF_MS);
              console.warn(`[SmartAccount] init attempt ${attempt + 1} failed. retrying in ${backoff}ms`, err);
              // small sleep before retry
              await new Promise((r) => setTimeout(r, backoff));
              backoffRef.current = Math.min(backoffRef.current * 2, INIT_MAX_BACKOFF_MS);
            }
          }

          // after retries, schedule a background retry with exponential backoff
          const thrown = lastErr instanceof Error ? lastErr : new Error(String(lastErr));
          setError(thrown);
          clearRetry();
          const delay = backoffRef.current;
          retryTimerRef.current = window.setTimeout(() => {
            // fire-and-forget background re-init
            initialize(true).catch(() => {});
          }, delay);
          backoffRef.current = Math.min(backoffRef.current * 2, INIT_MAX_BACKOFF_MS);
          return null;
        } finally {
          if (isMountedRef.current) setIsInitializing(false);
          initPromiseRef.current = null;
        }
      })();

      initPromiseRef.current = promise;
      return promise;
    },
    [
      ready,
      authenticated,
      embeddedWallet,
      customError,
      client,
      initCustomAccount,
      clearRetry,
    ]
  );

  // robust getClient that retries a few times before giving up
  const getClient = useCallback(
    async (opts?: { timeoutMs?: number }): Promise<SmartAccountClient> => {
      // quick guard: attempt to initialize once now
      for (let attempt = 0; attempt < GETCLIENT_ATTEMPTS; attempt++) {
        const c = await initialize();
        if (c) return c;
        // if not available, wait a bit and retry
        await new Promise((r) => setTimeout(r, GETCLIENT_RETRY_MS));
      }

      // final attempt with timeout if requested
      if (opts?.timeoutMs) {
        const deadline = Date.now() + opts.timeoutMs;
        while (Date.now() < deadline) {
          const c = await initialize();
          if (c) return c;
          await new Promise((r) => setTimeout(r, 500));
        }
      }

      // final failure
      const err = new Error("Smart account client not available after retries. Reconnect or try again.");
      setError(err);
      throw err;
    },
    [initialize]
  );

  // attempt init when auth/wallet ready
  useEffect(() => {
    if (ready && authenticated && embeddedWallet) {
      // start initialization (do not await here)
      initialize().catch((e) => {
        // ensure any unexpected error gets surfaced to console
        console.error("[SmartAccount] initialization error", e);
      });
    } else {
      // reset state when user logs out or wallet changes
      setClient(null);
      setError(null);
      clearRetry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, embeddedWallet?.address]);

  // re-trigger initialization on window focus if not initialized
  useEffect(() => {
    const onFocus = () => {
      if (!client && ready && authenticated && embeddedWallet) {
        initialize().catch(() => {});
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client, ready, authenticated, embeddedWallet?.address]);

  return (
    <SmartAccountContext.Provider
      value={{
        client,
        isInitializing,
        error,
        getClient,
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
}

export function useSmartAccountContext() {
  const ctx = useContext(SmartAccountContext);
  if (!ctx) throw new Error("useSmartAccountContext must be used inside SmartAccountProvider");
  return ctx;
}
