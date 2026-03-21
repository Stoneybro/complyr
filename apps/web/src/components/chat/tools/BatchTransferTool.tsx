/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Loader2 } from 'lucide-react';
import { FaUsers, FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { stringsToJurisdictions, stringsToCategories } from "@/lib/compliance-enums";

type BatchTransferInput = {
    recipients: string[];
    amounts: string[];
    entityIds?: string[];
    jurisdictions?: string[];
    categories?: string[];
    referenceId?: string;
};

interface BatchTransferToolProps {
    part: any;
    callId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
    mutation: any;
    type: 'ETH' | 'MNT';
}

export function BatchTransferTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation,
    type
}: BatchTransferToolProps) {
    const toolName = type === 'ETH' ? 'executeBatchEthTransfer' : 'execute_batch_mp_token_transfer';
    const explorerUrl = "https://explorer.testnet.mantle.xyz/tx/";

    if ('state' in part) {
        switch (part.state) {
            case 'input-streaming':
                return (
                    <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Preparing batch {type} transfer...</span>
                    </div>
                );

            case 'input-available':
                const batchInput = part.input as BatchTransferInput;
                const totalAmount = batchInput.amounts.reduce((sum: number, amt: string) =>
                    sum + parseFloat(amt), 0
                ).toFixed(type === 'ETH' ? 4 : 2);

                return (
                    <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <FaUsers />
                            <p className="font-medium">Batch {type} Transfer</p>
                        </div>

                        <div className="text-sm space-y-1 mb-4">
                            <p><strong>Recipients:</strong> {batchInput.recipients.length}</p>
                            <p><strong>Total:</strong> {type === 'MNT' ? '$' : ''}{totalAmount} {type}</p>
                            <div className="mt-2 space-y-1 pl-2 max-h-40 overflow-y-auto">
                                {batchInput.recipients.map((addr: string, idx: number) => (
                                    <p key={idx} className="text-xs">• {addr}: {type === 'MNT' ? '$' : ''}{batchInput.amounts[idx]} {type}</p>
                                ))}
                            </div>

                            {/* Compliance Display */}
                            {batchInput.referenceId && <p><strong>Ref ID:</strong> {batchInput.referenceId}</p>}
                            {batchInput.entityIds && batchInput.entityIds.length > 0 && (
                                <p><strong>Entities:</strong> {batchInput.entityIds.join(", ")}</p>
                            )}
                            {batchInput.jurisdictions && batchInput.jurisdictions.length > 0 && (
                                <p><strong>Jurisdictions:</strong> {batchInput.jurisdictions.join(", ")}</p>
                            )}
                            {batchInput.categories && batchInput.categories.length > 0 && (
                                <p><strong>Categories:</strong> {batchInput.categories.join(", ")}</p>
                            )}
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button
                                onClick={async () => {
                                    try {
                                        const result = await mutation.mutateAsync({
                                            recipients: batchInput.recipients as `0x${string}`[],
                                            amounts: batchInput.amounts,
                                            compliance: {
                                                entityIds: batchInput.entityIds,
                                                jurisdictions: stringsToJurisdictions(batchInput.jurisdictions || []),
                                                categories: stringsToCategories(batchInput.categories || []),
                                                referenceId: batchInput.referenceId
                                            }
                                        });

                                        addToolResult({
                                            tool: toolName,
                                            toolCallId: callId,
                                            output: result.receipt.transactionHash
                                        });
                                    } catch (error: any) {
                                        addToolResult({
                                            tool: toolName,
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
                                        Processing...
                                    </>
                                ) : (
                                    'Confirm'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    addToolResult({
                                        tool: toolName,
                                        toolCallId: callId,
                                        state: 'output-error',
                                        errorText: 'User cancelled'
                                    });
                                }}
                                disabled={isTransactionPending}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                );

            case 'output-available':
                return (
                    <div key={callId} className="my-2 text-sm flex flex-col">
                        <div className="flex items-center gap-1"><FaCheck /> Batch {type} transfer confirmed</div>
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
