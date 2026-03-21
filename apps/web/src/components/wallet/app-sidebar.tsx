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

import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TransactionList } from "@/components/transaction-history/TransactionList";
import { ContactList } from "@/components/contacts/ContactList";


type AppSidebarProps = {
  walletAddress?: string;
};

const data = {
  navMain: [
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

  const queryClient = useQueryClient();
  const [activeItem, setActiveItem] = React.useState(data.navMain[0]);
  const [showContactForm, setShowContactForm] = React.useState(false);


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
          { activeItem.title === "Transactions" ? (
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