"use client";

import { useState, useEffect } from "react";
import { 
    Sheet, 
    SheetContent, 
    SheetDescription, 
    SheetHeader, 
    SheetTitle,
    SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateHspHeaders, generateMerchantJwt } from "@/lib/hsp/sign";
import { Terminal, ShieldCheck, Code2, Lock, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { keccak256, toHex } from "viem";

interface HspInspectorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    data: {
        amount: string;
        token: string;
        recipient?: string;
        compliance?: any;
    };
}

export function HspInspector({ open, onOpenChange, onConfirm, data }: HspInspectorProps) {
    const [headers, setHeaders] = useState<any>(null);
    const [jwt, setJwt] = useState<string>("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (open) {
            const generateData = async () => {
                const dummyAppKey = "hsp_live_complyr_8829";
                const dummySecret = "sk_test_51PxK88Jv92KkL";
                
                const hspHeaders = await generateHspHeaders(
                    "POST",
                    "/api/v1/payment/orders",
                    data,
                    dummyAppKey,
                    dummySecret
                );
                
                const merchantJwt = await generateMerchantJwt(
                    { items: [{ name: "USDC Payment", amount: data.amount, category: "Transfer" }], total: data.amount },
                    "0xdummy_private_key"
                );
                
                setHeaders(hspHeaders);
                setJwt(merchantJwt);
            };
            generateData();
        }
    }, [open, data]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success("Copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl flex flex-col gap-0 p-0">
                <SheetHeader className="p-6 border-b bg-muted/20">
                    <div className="flex items-center gap-2 mb-1">
                        <Terminal className="h-5 w-5 text-primary" />
                        <SheetTitle>HSP Protocol Inspector</SheetTitle>
                    </div>
                    <SheetDescription>
                        Visualizing the HashKey Settlement Protocol (HSP) security handshake.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                    <ScrollArea className="h-full p-6">
                        <div className="space-y-6 pb-8">
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
                                <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                <div className="text-xs space-y-1">
                                    <p className="font-bold text-primary">Simulation Mode Active</p>
                                    <p className="text-muted-foreground leading-relaxed">
                                        Generating cryptographically sound headers and mandates. In production, these are sent to the HashKey Gateway for high-speed institutional settlement.
                                    </p>
                                </div>
                            </div>

                            <Tabs defaultValue="headers">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="headers" className="text-xs">Auth Headers</TabsTrigger>
                                    <TabsTrigger value="jwt" className="text-xs">Merchant JWT</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="headers" className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">HMAC-SHA256 Request Headers</label>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(JSON.stringify(headers, null, 2))}>
                                                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                        <div className="bg-black rounded-md p-4 overflow-x-auto border border-white/10">
                                            <pre className="text-[11px] text-green-400 font-mono">
                                                {headers ? JSON.stringify(headers, null, 2) : "Generating..."}
                                            </pre>
                                        </div>
                                    </div>
                                    <div className="space-y-2 text-[10px] text-muted-foreground leading-relaxed italic">
                                        <div className="flex items-center gap-1">
                                            <Lock className="h-3 w-3" />
                                            <span>Signature Payload Composition:</span>
                                        </div>
                                        <p className="pl-4">METHOD + PATH + QUERY + SHA256(body) + TIMESTAMP + NONCE</p>
                                    </div>
                                </TabsContent>

                                <TabsContent value="jwt" className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Merchant Authorization (ES256K)</label>
                                            <Badge variant="outline" className="text-[9px] font-normal border-green-500/30 text-green-500 bg-green-500/5">secp256k1</Badge>
                                        </div>
                                        <div className="bg-black rounded-md p-4 break-all border border-white/10">
                                            <code className="text-[11px] text-orange-400 font-mono">
                                                {jwt || "Signing mandate..."}
                                            </code>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-muted rounded-md space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Code2 className="h-3 w-3" />
                                            <span className="text-[10px] font-bold uppercase">Decoded Payload (Simulated)</span>
                                        </div>
                                        <pre className="text-[10px] text-muted-foreground font-mono">
{`{
  "cart_hash": "8829...f92k",
  "iss": "complyr-merchant-service",
  "exp": ${Math.floor(Date.now() / 1000) + 3600},
  "compliance_root": "0x${keccak256(toHex("compliance")).substring(2, 10)}..."
}`}
                                        </pre>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </ScrollArea>
                </div>

                <SheetFooter className="p-6 border-t bg-muted/10 gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancel</Button>
                    <Button onClick={onConfirm} className="w-full sm:w-auto">Proceed to HSP Gateway</Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
