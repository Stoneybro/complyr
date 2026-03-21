/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Loader2, XCircle } from 'lucide-react';
import { FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";

type CancelIntentInput = {
    intentId: string;
};

interface CancelIntentToolProps {
    part: any;
    callId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
    mutation: any;
}

export function CancelIntentTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation
}: CancelIntentToolProps) {
    const explorerUrl = "https://explorer.testnet.mantle.xyz/tx/";

    if ('state' in part) {
        switch (part.state) {
            case 'input-streaming':
                return (
                    <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Preparing to cancel intent...</span>
                    </div>
                );

            case 'input-available':
                const cancelInput = part.input as CancelIntentInput;

                return (
                    <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <XCircle className="h-5 w-5" />
                            <p className="font-medium">Cancel Recurring Payment</p>
                        </div>

                        <div className="text-sm space-y-1 mb-4">
                            <p><strong>Intent ID:</strong></p>
                            <p className="text-xs break-all font-mono bg-muted p-2 rounded">{cancelInput.intentId}</p>
                            <p className=" mt-2">⚠️ This action cannot be undone. The recurring payment will stop immediately.</p>
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    try {
                                        const result = await mutation.mutateAsync({
                                            intentId: cancelInput.intentId as `0x${string}`
                                        });

                                        addToolResult({
                                            tool: 'cancelRecurringPayment',
                                            toolCallId: callId,
                                            output: result.receipt.transactionHash
                                        });
                                    } catch (error: any) {
                                        addToolResult({
                                            tool: 'cancelRecurringPayment',
                                            toolCallId: callId,
                                            state: 'output-error',
                                            errorText: error.message
                                        });
                                    }
                                }}
                                disabled={isTransactionPending}
                            >
                                {mutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Cancelling...
                                    </>
                                ) : (
                                    'Confirm Cancellation'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    addToolResult({
                                        tool: 'cancelRecurringPayment',
                                        toolCallId: callId,
                                        state: 'output-error',
                                        errorText: 'User cancelled'
                                    });
                                }}
                                disabled={isTransactionPending}
                            >
                                Keep Intent
                            </Button>
                        </div>
                    </div>
                );

            case 'output-available':
                return (
                    <div key={callId} className="my-2 text-sm flex flex-col">
                        <div className="flex items-center gap-1"><FaCheck /> Recurring payment cancelled successfully</div>
                        <div>Hash: <a href={`${explorerUrl}${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
                    </div>
                );

            case 'output-error':
                return (
                    <div key={callId} className="my-2 text-sm flex items-center gap-1 ">
                        <FaTimes /> Error: {part.errorText}
                    </div>
                );
        }
    }
    return null;
}
