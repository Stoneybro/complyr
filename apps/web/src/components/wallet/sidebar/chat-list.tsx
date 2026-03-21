"use client";

import * as React from "react";
import { MoreHorizontalIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";

type Chat = {
    id: string;
    title: string | null;
    createdAt: Date;
    userId: string | null;
};

type ChatListProps = {
    chats: Chat[];
    isLoading: boolean;
    currentChatId: string | null;
    onSelectChat: (chatId: string) => void;
    onDeleteChat: (chatId: string) => void;
    onNewChat: () => void;
    onRefresh: () => void;
};

export function ChatList({
    chats,
    isLoading,
    currentChatId,
    onSelectChat,
    onDeleteChat,
    onNewChat,
    onRefresh,
}: ChatListProps) {
    return (
        <SidebarGroup className="px-0">
            <SidebarGroupContent>
                {isLoading ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        Loading chats...
                    </div>
                ) : chats.length > 0 ? (
                    chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`group flex items-center gap-2 p-2 text-sm rounded hover:bg-muted cursor-pointer ${chat.id === currentChatId ? "bg-muted" : ""
                                }`}
                        >
                            <div
                                className="flex-1 truncate"
                                onClick={() => onSelectChat(chat.id)}
                            >
                                <div className="font-medium truncate">
                                    {(chat.title || "Untitled Chat").slice(0, 20) +
                                        ((chat.title || "Untitled Chat").length > 20 ? "..." : "")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {new Date(chat.createdAt).toLocaleDateString()}{" "}
                                    {new Date(chat.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                    >
                                        <MoreHorizontalIcon className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => onDeleteChat(chat.id)}
                                        className="text-destructive"
                                    >
                                        Delete chat
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    ))
                ) : (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        No chat history
                        <div className="mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                className="w-full"
                            >
                                <RefreshCw className="mr-2 h-4 w-4 " />
                                Refresh
                            </Button>
                        </div>
                    </div>
                )}
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
