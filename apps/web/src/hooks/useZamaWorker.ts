import { useRef, useCallback, useEffect } from "react";

export function useZamaWorker() {
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize worker on mount
        workerRef.current = new Worker(new URL("../workers/fhevm.worker.ts", import.meta.url));
        workerRef.current.postMessage({ id: "init", type: "INIT" });
        
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const encryptBatch = useCallback(
        (payload: {
            contractAddress: string;
            userAddress: string;
            recipients: string[];
            compliance?: { categories?: number[], jurisdictions?: number[] };
        }): Promise<{ handles: { categories: string[], jurisdictions: string[] }, proofs: { categories: string[], jurisdictions: string[] } }> => {
            return new Promise((resolve, reject) => {
                if (!workerRef.current) {
                    return reject(new Error("Worker not initialized"));
                }
                
                const id = Math.random().toString(36).substring(7);

                const handler = (e: MessageEvent) => {
                    const data = e.data;
                    if (data.id === id) {
                        workerRef.current?.removeEventListener("message", handler);
                        if (data.type === "ENCRYPT_SUCCESS") {
                            resolve(data.payload);
                        } else if (data.type === "ERROR") {
                            reject(new Error(data.error));
                        }
                    }
                };

                workerRef.current.addEventListener("message", handler);
                workerRef.current.postMessage({ id, type: "ENCRYPT_BATCH", payload });
            });
        },
        []
    );

    return { encryptBatch };
}
