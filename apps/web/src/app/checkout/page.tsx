"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";

function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const flowId = searchParams.get("flow_id");
    const [status, setStatus] = useState<"loading" | "ready" | "processing" | "success">("loading");

    useEffect(() => {
        if (flowId) {
            // Simulate fetching order details from HashKey
            const timer = setTimeout(() => {
                setStatus("ready");
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [flowId]);

    const handlePay = () => {
        setStatus("processing");
        // Simulate payment processing
        setTimeout(() => {
            setStatus("success");
            toast.success("HSP Payment successful!");
            
            // Redirect back to wallet after a brief delay
            setTimeout(() => {
                router.push("/wallet");
            }, 2000);
        }, 2000);
    };

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading HashKey Checkout Gateway...</p>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold tracking-tight">Payment Complete</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    Your transaction has been securely processed by the HashKey Settlement Protocol.
                </p>
                <div className="mt-8 flex items-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Redirecting back to Complyr...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg flex items-center justify-between border">
                <div>
                    <p className="text-sm text-muted-foreground">Order Ref: {flowId}</p>
                    <p className="font-mono mt-1 font-semibold">Complyr Merchant Demo</p>
                </div>
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-mono">See Order Amount</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="font-mono text-green-500">Sponsored</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">Total to Pay</span>
                    <span className="font-mono font-bold text-lg">See Order Amount</span>
                </div>
            </div>

            <Button 
                className="w-full h-12 text-lg mt-8" 
                onClick={handlePay}
                disabled={status === "processing"}
            >
                {status === "processing" ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing on HashKey...
                    </>
                ) : (
                    <>
                        Confirm Payment <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                )}
            </Button>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg border-primary/20">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <CardTitle className="text-2xl font-bold">HashKey Checkout</CardTitle>
                    <CardDescription>
                        Secure Payment Gateway (Mock Environment)
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <Suspense fallback={
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    }>
                        <CheckoutContent />
                    </Suspense>
                </CardContent>
                <CardFooter className="flex justify-center border-t p-4 mt-6 bg-muted/30">
                    <p className="text-xs text-muted-foreground flex items-center">
                        <LockIcon className="h-3 w-3 mr-1" /> Secured by HashKey Settlement Protocol
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}

function LockIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}