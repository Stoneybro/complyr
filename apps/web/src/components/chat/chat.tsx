/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import {
    useSingleTransfer,
    useBatchTransfer,
    useRecurringPayment,
} from "@/hooks/payments/usePayment";
import { fetchWalletBalance } from "@/utils/helper";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";

import Overlay from "./overlay";

interface ChatProps {
    walletAddress?: string;
    id?: string;
}

function Chat({ walletAddress, id }: ChatProps) {
    const { data: initialMessages, isLoading, error } = useQuery({
        queryKey: ['chat', id],
        queryFn: async () => {
            if (!id) return [];
            const response = await fetch(`/api/chat/${id}`);
            if (!response.ok) {
                // Return empty if 404 or error to allow new chat to start
                return [];
            }
            const data = await response.json();
            return data.messages || [];
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2,
    });

    if (isLoading) {
        return (
            <div className="flex h-full w-full flex-col p-4 md:p-8 gap-4">
                {/* Chat skeleton loader */}
                <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                </div>
                <div className="flex gap-3 justify-end">
                    <div className="flex-1 space-y-2 flex flex-col items-end">
                        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    // If no ID or loaded, render ChatInner
    // If error, likely fallback to empty messages via useQuery default or empty array above
    return (
        <ChatInner
            key={id} // Force re-mount when ID changes to reset useChat
            id={id}
            initialMessages={initialMessages || []}
            walletAddress={walletAddress}
        />
    );
}

function ChatInner({
    walletAddress,
    id,
    initialMessages
}: {
    walletAddress?: string,
    id?: string,
    initialMessages: UIMessage[]
}) {
    const [input, setInput] = useState("");
    const queryClient = useQueryClient();

    const { data: wallet } = useQuery({
        queryKey: ["walletBalance", walletAddress],
        queryFn: () => fetchWalletBalance(walletAddress as `0x${string}`),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: Infinity,
        enabled: !!walletAddress,
    });


    // AI SDK hook
    const { messages, sendMessage, status, error, addToolResult } = useChat({
        id,
        messages: initialMessages || [],
        onFinish: () => {
            // Invalidate chats list to show new chat or title update
            queryClient.invalidateQueries({ queryKey: ['chats', walletAddress] });
        },
        transport: new DefaultChatTransport({
            api: '/api/chat',
            prepareSendMessagesRequest({ messages, id }) {
                return {
                    body: {
                        message: messages[messages.length - 1],
                        chatId: id,
                        walletAddress
                    }
                };
            },
        }),

    });

    // Track previous messages to detect tool result additions
    const prevMessagesRef = React.useRef(messages);

    // Save messages when tool results are added (state changes from input-available to output-*)
    React.useEffect(() => {
        const hasToolResultChange = messages.some((msg, idx) => {
            const prevMsg = prevMessagesRef.current[idx];
            if (!prevMsg) return false;

            // Check if any tool invocation changed from input-available to output-*
            const msgAny = msg as any;
            const prevMsgAny = prevMsg as any;

            if (msgAny.parts && prevMsgAny.parts) {
                return msgAny.parts.some((part: any, partIdx: number) => {
                    const prevPart = prevMsgAny.parts?.[partIdx];
                    if (!prevPart) return false;

                    // Tool state changed from input-available to output-available/output-error
                    return prevPart.state === 'input-available' &&
                        (part.state === 'output-available' || part.state === 'output-error');
                });
            }
            return false;
        });

        if (hasToolResultChange && id) {
            console.log('📦 Saving messages after tool result...');
            fetch('/api/chat/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                keepalive: true,
                body: JSON.stringify({
                    chatId: id,
                    messages,
                    userId: walletAddress
                })
            }).catch(err => console.error('Failed to save messages:', err));
        }

        prevMessagesRef.current = messages;
    }, [messages, id, walletAddress]);

    // Transaction hooks - using native MNT transfers
    const singleMntTransfer = useSingleTransfer(wallet?.availableMntBalance);
    const batchMntTransfer = useBatchTransfer(wallet?.availableMntBalance);
    const recurringMntPayment = useRecurringPayment(wallet?.availableMntBalance);

    const hooks = {
        singleMntTransfer,
        batchMntTransfer,
        recurringMntPayment,
    };

    const handleSubmit = () => {
        if (!input.trim()) return;
        sendMessage({ text: input });
        setInput("");
    };

    // Check if any transaction is pending
    const isTransactionPending =
        singleMntTransfer.isPending ||
        batchMntTransfer.isPending ||
        recurringMntPayment.isPending;

    const isLoading = status === 'submitted' || status === 'streaming';

    return (
        <div className='w-full h-full p-4 md:p-8 md:pb-2 relative flex flex-col gap-6 justify-center'>
            {messages.length === 0 && <Overlay setInput={setInput} walletAddress={walletAddress} />}
            <ChatMessages
                messages={messages}
                addToolResult={addToolResult}
                status={status}
                error={error}
                isTransactionPending={isTransactionPending}
                isLoading={isLoading}
                hooks={hooks}
            />
            <ChatInput
                input={input}
                setInput={setInput}
                handleSubmit={handleSubmit}
                isTransactionPending={isTransactionPending}
                isLoading={isLoading}
            />
        </div>
    );
}

export default Chat;