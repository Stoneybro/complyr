"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { File, Inbox, Command, LogOut, Users } from "lucide-react";
import { useLogout } from "@privy-io/react-auth";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import CopyText from "@/components/ui/copy";
import { truncateAddress } from "@/utils/format";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { generateId } from "ai";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChatList } from "./sidebar/chat-list";
import { TransactionList } from "@/components/transaction-history/TransactionList";
import { ContactList } from "@/components/contacts/ContactList";

type Chat = {
  id: string;
  title: string | null;
  createdAt: Date;
  userId: string | null;
};

type AppSidebarProps = {
  walletAddress?: string;
};

const data = {
  navMain: [
    {
      title: "Chats",
      url: "#",
      icon: Inbox,
      isActive: true,
    },
    {
      title: "Transactions",
      url: "#",
      icon: File,
      isActive: false,
    },
    {
      title: "Contacts",
      url: "#",
      icon: Users,
      isActive: false,
    },
  ],
};

export function AppSidebar({
  walletAddress,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentChatId = searchParams.get("chatId");
  const queryClient = useQueryClient();
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const [showContactForm, setShowContactForm] = React.useState(false);

  const { data: chats = [], isLoading } = useQuery({
    queryKey: ["chats", walletAddress],
    queryFn: async () => {
      if (!walletAddress) return [];
      const response = await fetch(`/api/chats?userId=${walletAddress}`);
      if (!response.ok) {
        throw new Error("Failed to fetch chats");
      }
      const data = await response.json();
      return data.chats as Chat[];
    },
    enabled: !!walletAddress,
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - cache persists even when unmounted
  });

  const handleNewChat = () => {
    const newChatId = generateId();
    router.replace(`/wallet?chatId=${newChatId}`);
  };

  const handleSelectChat = (chatId: string) => {
    router.push(`/wallet?chatId=${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/${chatId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete chat");
      }

      toast.success("Chat deleted");
      queryClient.invalidateQueries({ queryKey: ["chats", walletAddress] });

      if (chatId === currentChatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["chats", walletAddress] });
  };

  const { logout } = useLogout({
    onSuccess: () => {
      localStorage.removeItem("wallet-deployed");
      router.push("/login");
    },
  });

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
      >
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                {data.navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      onClick={() => {
                        setActiveItem(item);
                      }}
                      isActive={activeItem?.title === item.title}
                      className="px-2.5 md:px-2"
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter></SidebarFooter>
      </Sidebar>

      <Sidebar collapsible="none" className="hidden flex-1 md:flex">
        <SidebarHeader className="gap-3.5 border-b p-4">
          <div className="flex w-full items-center justify-between">
            <div className="text-foreground text-xl font-medium">
              {activeItem?.title}
            </div>
            {activeItem.title === "Chats" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
              >
                + New Chat
              </Button>
            )}
            {activeItem.title === "Contacts" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContactForm(true)}
              >
                + Add Contact
              </Button>
            )}
          </div>
        </SidebarHeader>
        <SidebarContent>
          {activeItem.title === "Chats" ? (
            <ChatList
              chats={chats}
              isLoading={isLoading}
              currentChatId={currentChatId}
              onSelectChat={handleSelectChat}
              onDeleteChat={handleDeleteChat}
              onNewChat={handleNewChat}
              onRefresh={handleRefresh}
            />
          ) : activeItem.title === "Transactions" ? (
            <TransactionList walletAddress={walletAddress} />
          ) : (
            <ContactList
              walletAddress={walletAddress}
              showForm={showContactForm}
              onCloseForm={() => setShowContactForm(false)}
            />
          )}
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <div className="flex gap-3 ">
            <div className="flex items-center justify-center gap-2 text-lg ml-[10%]">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {walletAddress ? truncateAddress(walletAddress) : "No Wallet"}
                </span>
              </div>
              {walletAddress && <CopyText text={walletAddress} />}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => logout()}
                    className="bg-gray-900 hover:bg-gray-800 text-white ml-auto"
                    size="sm"
                  >
                    <LogOut className=" h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </SidebarFooter>
      </Sidebar>
    </Sidebar>
  );
}