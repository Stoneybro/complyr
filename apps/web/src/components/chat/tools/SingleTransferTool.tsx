/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { Loader2, Check, X } from 'lucide-react';
import { BsArrowUpRight } from "react-icons/bs";
import { FaDollarSign, FaCheck, FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { stringsToJurisdictions, stringsToCategories } from "@/lib/compliance-enums";

type SingleTransferInput = {
    to: string;
    amount: string;
    entityIds?: string[];
    jurisdictions?: string[];
    categories?: string[];
    referenceId?: string;
};

interface SingleTransferToolProps {
    part: any;
    callId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
    mutation: any;
    type: 'ETH' | 'MNT';
}

export function SingleTransferTool({
    part,
    callId,
    addToolResult,
    isTransactionPending,
    mutation,
    type
}: SingleTransferToolProps) {
    const toolName = type === 'ETH' ? 'executeSingleEthTransfer' : 'execute_single_mp_token_transfer';
    const Icon = type === 'ETH' ? BsArrowUpRight : FaDollarSign;
    const explorerUrl = "https://explorer.testnet.mantle.xyz/tx/";

    if ('state' in part) {
        switch (part.state) {
            case 'input-streaming':
                return (
                    <div key={callId} className="inline-flex items-center gap-2 text-sm text-muted-foreground my-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Preparing {type} transfer...</span>
                    </div>
                );

            case 'input-available':
                const input = part.input as SingleTransferInput;

                return (
                    <div key={callId} className="my-4 p-4 border bg-background rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <Icon />
                            <p className="font-medium">Single {type} Transfer</p>
                        </div>
                        <div className="text-sm space-y-1 mb-4">
                            <p><strong>To:</strong> {input.to}</p>
                            <p><strong>Amount:</strong> {type === 'MNT' ? '$' : ''}{input.amount} {type}</p>

                            {/* Compliance Display */}
                            {input.referenceId && <p><strong>Ref ID:</strong> {input.referenceId}</p>}
                            {input.entityIds && input.entityIds.length > 0 && (
                                <p><strong>Entities:</strong> {input.entityIds.join(", ")}</p>
                            )}
                            {input.jurisdictions && input.jurisdictions.length > 0 && (
                                <p><strong>Jurisdictions:</strong> {input.jurisdictions.join(", ")}</p>
                            )}
                            {input.categories && input.categories.length > 0 && (
                                <p><strong>Categories:</strong> {input.categories.join(", ")}</p>
                            )}
                        </div>

                        <div className="flex gap-2 w-full">
                            <Button
                                onClick={async () => {
                                    try {
                                        const result = await mutation.mutateAsync({
                                            to: input.to as `0x${string}`,
                                            amount: input.amount,
                                            compliance: {
                                                entityIds: input.entityIds,
                                                jurisdictions: stringsToJurisdictions(input.jurisdictions || []),
                                                categories: stringsToCategories(input.categories || []),
                                                referenceId: input.referenceId
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
                        <div className="flex items-center gap-1"><FaCheck /> {type} transfer confirmed</div>
                        <div>Hash: <a href={`${explorerUrl}${part.output}`} className="underline" target="_blank" rel="noopener noreferrer">{part.output as string}</a></div>
                    </div>
                );

            case 'output-error':
                return (
                    <div key={callId} className="my-2 flex items-center gap-1 text-sm ">
                        <FaTimes /> Error: {part.errorText}
                    </div>
                );
        }
    }
    return null;
}
