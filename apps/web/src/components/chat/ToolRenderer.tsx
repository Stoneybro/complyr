/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { SingleTransferTool } from './tools/SingleTransferTool';
import { BatchTransferTool } from './tools/BatchTransferTool';
import { RecurringPaymentTool } from './tools/RecurringPaymentTool';

interface ToolRendererProps {
    part: any;
    toolCallId: string;
    addToolResult: (result: any) => void;
    isTransactionPending: boolean;
    hooks: {
        singleMntTransfer: any;
        batchMntTransfer: any;
        recurringMntPayment: any;
    };
}

export function ToolRenderer({
    part,
    toolCallId,
    addToolResult,
    isTransactionPending,
    hooks
}: ToolRendererProps) {

    if (part.type === "tool-execute_single_mp_token_transfer") {
        return (
            <SingleTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.singleMntTransfer}
                type="MNT"
            />
        );
    }

    if (part.type === "tool-execute_batch_mp_token_transfer") {
        return (
            <BatchTransferTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.batchMntTransfer}
                type="MNT"
            />
        );
    }

    if (part.type === "tool-execute_recurring_mp_token_payment") {
        return (
            <RecurringPaymentTool
                part={part}
                callId={toolCallId}
                addToolResult={addToolResult}
                isTransactionPending={isTransactionPending}
                mutation={hooks.recurringMntPayment}
                type="MNT"
            />
        );
    }

    return null;
}
