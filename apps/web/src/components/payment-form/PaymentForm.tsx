"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Users, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRecurringPayment } from "@/hooks/payments/useRecurringPayment";
import { useSingleTransfer } from "@/hooks/payments/useSingleTransfer";
import { useBatchTransfer } from "@/hooks/payments/useBatchTransfer";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";
import type { Contact } from "@/lib/contact-store";
import { MockUSDCAddress } from "@/lib/CA";
import {
    stringsToJurisdictions,
    stringsToCategories,
    getJurisdictionOptions,
    getCategoryOptions
} from "@/lib/compliance-enums";
import { useQuery } from "@tanstack/react-query";
import { fetchWalletBalance } from "@/utils/helper";

// Compliance options
const JURISDICTION_OPTIONS = getJurisdictionOptions();
const CATEGORY_OPTIONS = getCategoryOptions();

const KYC_LEVEL_LABELS: Record<number, string> = {
    0: "None", 1: "Basic", 2: "Advanced", 3: "Premium", 4: "Ultimate",
};

// Recipient with optional compliance data from contact
type RecipientData = {
    address: string;
    amount: string;
    referenceId?: string;
    jurisdiction?: string;
    category?: string;
    contactName?: string;
};

const KycCheck = ({ address }: { address: string }) => {
    const isValid = /^0x[a-fA-F0-9]{40}$/.test(address);

    if (!isValid) return null;

    return (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mt-1 ml-1 bg-muted/10 px-1.5 py-0.5 rounded border border-border w-fit">
            <Info className="h-2.5 w-2.5" /> External KYC required
        </div>
    );
};

// Extracted outside to prevent re-creation on every render (fixes focus loss)
const RecipientRow = React.memo(({
    recipient,
    index,
    type,
    showRemove,
    tokenSymbol,
    onUpdate,
    onRemove,
}: {
    recipient: RecipientData;
    index: number;
    type: "batch" | "recurring";
    showRemove: boolean;
    tokenSymbol: string;
    onUpdate: (type: "batch" | "recurring", index: number, field: keyof RecipientData, value: string) => void;
    onRemove: (type: "batch" | "recurring", index: number) => void;
}) => (
    <div className="space-y-4 p-4 border rounded-lg">
        <div className="flex gap-2 items-start">
            <div className="flex-1 space-y-2">
                <Label className="text-xs text-muted-foreground">Recipient Address</Label>
                <Input
                    placeholder="0x..."
                    value={recipient.address}
                    onChange={(e) => onUpdate(type, index, "address", e.target.value)}
                    className="font-mono text-sm"
                />
                <KycCheck address={recipient.address} />
            </div>
            <div className="relative w-32 space-y-2">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                <div className="relative">
                    <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={recipient.amount}
                        onChange={(e) => onUpdate(type, index, "amount", e.target.value)}
                        className="pr-12"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">{tokenSymbol}</span>
                </div>
            </div>
            {showRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(type, index)}
                    className="mt-8"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
        <div className="pt-3 border-t border-dashed">
            <h4 className="text-sm font-medium mb-3">Compliance Records (Encrypted)</h4>
            <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Reference ID</Label>
                    <Input
                        placeholder="Max 7 char"
                        value={recipient.referenceId || ''}
                        onChange={(e) => onUpdate(type, index, "referenceId", e.target.value.substring(0, 7))}
                        className="h-8 text-xs bg-muted/30"
                        maxLength={7}
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Recipient Jurisdiction</Label>
                    <Select
                        value={recipient.jurisdiction || ''}
                        onValueChange={(value) => onUpdate(type, index, "jurisdiction", value)}
                    >
                        <SelectTrigger className="w-full h-8 text-xs bg-muted/30">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {JURISDICTION_OPTIONS.map((j) => (
                                <SelectItem key={j.value} value={j.value}>
                                    {j.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Expense Category</Label>
                    <Select
                        value={recipient.category || ''}
                        onValueChange={(value) => onUpdate(type, index, "category", value)}
                    >
                        <SelectTrigger className="w-full h-8 text-xs bg-muted/30">
                            <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                            {CATEGORY_OPTIONS.map((c) => (
                                <SelectItem key={c.value} value={c.value}>
                                    {c.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
        {/* Show contact name if loaded from contact */}
        {(recipient.contactName) && (
            <div className="flex flex-wrap gap-1 text-xs mt-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                    Contact: {recipient.contactName}
                </span>
            </div>
        )}
    </div>
));
RecipientRow.displayName = "RecipientRow";

interface PaymentFormProps {
    walletAddress?: `0x${string}`;
}

type PaymentType = "single" | "batch" | "recurring";

export function PaymentForm({ walletAddress }: PaymentFormProps) {
    const [onchainTab, setOnchainTab] = useState<"single" | "batch" | "recurring">("single");

    const currentPaymentType: PaymentType = onchainTab;

    // Fetch balances
    const { data: wallet } = useQuery({
        queryKey: ["walletBalance", walletAddress],
        queryFn: () => fetchWalletBalance(walletAddress as `0x${string}`),
        enabled: !!walletAddress,
    });

    const activeBalance = wallet?.availableUsdcBalance;

    // Single payment state
    const [singleRecipient, setSingleRecipient] = useState<RecipientData>({ address: "", amount: "" });

    // Batch payment state
    const [batchRecipients, setBatchRecipients] = useState<RecipientData[]>([{ address: "", amount: "" }]);

    // Recurring payment state
    const [recurringName, setRecurringName] = useState("");
    const [recurringRecipients, setRecurringRecipients] = useState<RecipientData[]>([{ address: "", amount: "" }]);
    const [recurringInterval, setRecurringInterval] = useState("60"); // 1 min default for demo
    const [recurringDuration, setRecurringDuration] = useState("300"); // 5 min default for demo
    const [recurringStartDate, setRecurringStartDate] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState<string>("");

    // Contacts hook
    const { data: contacts = [] } = useContacts(walletAddress);

    // Mutations
    const singleMutation = useSingleTransfer(activeBalance);
    const batchMutation = useBatchTransfer(activeBalance);
    const recurringMutation = useRecurringPayment(); 

    // Update processing state when mutation changes
    React.useEffect(() => {
        const processing = singleMutation.isPending || batchMutation.isPending || recurringMutation.isPending;
        setIsProcessing(processing);
        if (!processing) {
            // Short delay before clearing status after completion
            const timer = setTimeout(() => setTransactionStatus(""), 2000);
            return () => clearTimeout(timer);
        }
    }, [singleMutation.isPending, batchMutation.isPending, recurringMutation.isPending]);

    // Load contact for single transfer
    const loadContactForSingle = (contactId: string) => {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact || contact.addresses.length === 0) return;

        const addr = contact.addresses[0]; // Use first address
        setSingleRecipient({
            address: addr.address,
            amount: singleRecipient.amount, // Keep existing amount
            referenceId: addr.entityId,
            jurisdiction: addr.jurisdiction,
            category: addr.category,
            contactName: contact.name,
        });
    };

    // Load contact for batch/recurring (adds as new recipient)
    const loadContactForList = (contactId: string, type: "batch" | "recurring") => {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact) return;

        const newRecipients = contact.addresses.map(addr => ({
            address: addr.address,
            amount: "",
            referenceId: addr.entityId,
            jurisdiction: addr.jurisdiction,
            category: addr.category,
            contactName: contact.name,
        }));

        if (type === "batch") {
            // Replace empty first row or add to list
            const hasOnlyEmptyRow = batchRecipients.length === 1 && !batchRecipients[0].address;
            setBatchRecipients(hasOnlyEmptyRow ? newRecipients : [...batchRecipients, ...newRecipients]);
        } else {
            const hasOnlyEmptyRow = recurringRecipients.length === 1 && !recurringRecipients[0].address;
            setRecurringRecipients(hasOnlyEmptyRow ? newRecipients : [...recurringRecipients, ...newRecipients]);
        }
    };

    const addRecipient = (type: "batch" | "recurring") => {
        if (type === "batch") {
            setBatchRecipients([...batchRecipients, { address: "", amount: "" }]);
        } else {
            setRecurringRecipients([...recurringRecipients, { address: "", amount: "" }]);
        }
    };

    const removeRecipient = (type: "batch" | "recurring", index: number) => {
        if (type === "batch") {
            if (batchRecipients.length > 1) {
                setBatchRecipients(batchRecipients.filter((_, i) => i !== index));
            } else {
                setBatchRecipients([{ address: "", amount: "" }]);
            }
        } else {
            if (recurringRecipients.length > 1) {
                setRecurringRecipients(recurringRecipients.filter((_, i) => i !== index));
            } else {
                setRecurringRecipients([{ address: "", amount: "" }]);
            }
        }
    };

    const updateRecipient = (type: "batch" | "recurring", index: number, field: keyof RecipientData, value: string) => {
        if (type === "batch") {
            const updated = [...batchRecipients];
            updated[index] = { ...updated[index], [field]: value };
            setBatchRecipients(updated);
        } else {
            const updated = [...recurringRecipients];
            updated[index] = { ...updated[index], [field]: value };
            setRecurringRecipients(updated);
        }
    };

    // Build compliance metadata from recipients (per-recipient arrays, converted to enum values)
    const buildCompliance = (recipients: RecipientData[]) => {
        // Collect per-recipient data as string arrays
        const jurisdictionStrings = recipients.map(r => r.jurisdiction);
        const categoryStrings = recipients.map(r => r.category);
        const referenceIdStrings = recipients.map(r => r.referenceId || "");

        // Filter out empty arrays for optional fields
        const hasJurisdictions = jurisdictionStrings.some(j => j && j !== "none");
        const hasCategories = categoryStrings.some(c => c && c !== "none");
        const hasReferences = referenceIdStrings.some(r => r !== "");

        // Convert strings to enum values (numbers)
        return {
            jurisdictions: hasJurisdictions ? stringsToJurisdictions(jurisdictionStrings) : undefined,
            categories: hasCategories ? stringsToCategories(categoryStrings) : undefined,
            referenceIds: hasReferences ? referenceIdStrings : undefined,
        };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransactionStatus("Initializing...");

        const tokenAddress = MockUSDCAddress as `0x${string}`;

        try {
            if (currentPaymentType === "single") {
                if (!singleRecipient.address || !singleRecipient.amount) {
                    toast.error("Please fill in recipient and amount");
                    setTransactionStatus("");
                    return;
                }
                await singleMutation.mutateAsync({
                    to: singleRecipient.address as `0x${string}`,
                    amount: singleRecipient.amount,
                    tokenAddress,
                    compliance: buildCompliance([singleRecipient]),
                    onStatusUpdate: setTransactionStatus,
                });
                setSingleRecipient({ address: "", amount: "", referenceId: "" });
            } else if (currentPaymentType === "batch") {
                const addressesOnly = batchRecipients.filter(r => r.address);
                if (addressesOnly.length < 2) {
                    toast.error("Batch payments require at least 2 recipients");
                    setTransactionStatus("");
                    return;
                }
                
                const validRecipients = batchRecipients.filter(r => r.address && r.amount);
                if (validRecipients.length !== addressesOnly.length) {
                    toast.error("Please provide an amount for all recipients");
                    setTransactionStatus("");
                    return;
                }
                
                await batchMutation.mutateAsync({
                    recipients: validRecipients.map(r => r.address as `0x${string}`),
                    amounts: validRecipients.map(r => r.amount),
                    tokenAddress,
                    compliance: buildCompliance(validRecipients),
                    onStatusUpdate: setTransactionStatus,
                });
                setBatchRecipients([{ address: "", amount: "", referenceId: "" }]);
            } else if (currentPaymentType === "recurring") {
                if (!recurringName) {
                    toast.error("Please provide a name for this recurring payment");
                    setTransactionStatus("");
                    return;
                }
                const addressesOnly = recurringRecipients.filter(r => r.address);
                if (addressesOnly.length === 0) {
                    toast.error("Please add at least one recipient");
                    setTransactionStatus("");
                    return;
                }
                const validRecipients = recurringRecipients.filter(r => r.address && r.amount);
                if (validRecipients.length !== addressesOnly.length) {
                    toast.error("Please provide an amount for all recipients");
                    setTransactionStatus("");
                    return;
                }
                if (!recurringDuration) {
                    toast.error("Please specify the duration");
                    setTransactionStatus("");
                    return;
                }
                await recurringMutation.mutateAsync({
                    name: recurringName,
                    recipients: validRecipients.map(r => r.address as `0x${string}`),
                    amounts: validRecipients.map(r => r.amount),
                    tokenAddress,
                    interval: parseInt(recurringInterval),
                    duration: parseInt(recurringDuration),
                    transactionStartTime: recurringStartDate ? Math.floor(new Date(recurringStartDate).getTime() / 1000) : 0,
                    compliance: buildCompliance(validRecipients),
                    onStatusUpdate: setTransactionStatus,
                });
                // Reset
                setRecurringName("");
                setRecurringRecipients([{ address: "", amount: "", referenceId: "" }]);
                setRecurringDuration("");
                setRecurringStartDate("");
            }
        } catch (error) {
            console.error("Payment error:", error);
            setTransactionStatus("Failed");
        }
    };

    // Contact selector component
    const ContactSelector = ({ onSelect, label = "Load from Contacts" }: { onSelect: (contactId: string) => void; label?: string }) => (
        <div className="space-y-4">
            <Select onValueChange={onSelect}>
                <SelectTrigger className="w-full">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder={label} />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {contacts.length === 0 ? (
                        <SelectItem value="empty" disabled className="text-sm text-foreground py-3 max-w-[250px] whitespace-normal pointer-events-none data-[disabled]:opacity-100">
                            No contacts found. Use the sidebar to add a contact and automate compliance data.
                        </SelectItem>
                    ) : (
                        contacts.map((contact) => (
                            <SelectItem key={contact.id} value={contact.id}>
                                <div className="flex items-center gap-2">
                                    <span>{contact.name}</span>
                                    {contact.addresses.length > 1 && (
                                        <span className="text-xs text-muted-foreground">
                                            ({contact.addresses.length} addresses)
                                        </span>
                                    )}
                                    {contact.addresses[0]?.jurisdiction && (
                                        <span className="text-xs bg-muted px-1 rounded">
                                            {contact.addresses[0].jurisdiction}
                                        </span>
                                    )}
                                </div>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            <Alert variant="default" className="bg-muted/50 text-muted-foreground border-none py-3">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                    You can create and manage contacts in the sidebar to automate compliance data.
                </AlertDescription>
            </Alert>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-6">
            <Card>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Tabs value={onchainTab} onValueChange={(v) => setOnchainTab(v as "single" | "batch" | "recurring")} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="single">Single</TabsTrigger>
                                        <TabsTrigger value="batch">Batch</TabsTrigger>
                                        <TabsTrigger value="recurring">Recurring</TabsTrigger>
                                    </TabsList>
                                    
                                    <TabsContent value="single" className="space-y-6 mt-6">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Send a payment to a single recipient.
                                        </p>
                                        <ContactSelector onSelect={loadContactForSingle} />
                                        
                                        <div className="space-y-4 p-4 border rounded-lg">
                                            <div className="grid grid-cols-[1fr_120px] gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="single-recipient" className="text-xs text-muted-foreground">Recipient Address</Label>
                                                    <Input
                                                        id="single-recipient"
                                                        placeholder="0x..."
                                                        value={singleRecipient.address}
                                                        onChange={(e) => setSingleRecipient({ ...singleRecipient, address: e.target.value })}
                                                        className="font-mono text-sm"
                                                    />
                                                    <KycCheck address={singleRecipient.address} />
                                                </div>
                                                <div className="space-y-2 relative">
                                                    <Label htmlFor="single-amount" className="text-xs text-muted-foreground">Amount</Label>
                                                    <div className="relative">
                                                        <Input
                                                            id="single-amount"
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={singleRecipient.amount}
                                                            onChange={(e) => setSingleRecipient({ ...singleRecipient, amount: e.target.value })}
                                                            className="pr-12"
                                                        />
                                                        <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">USDC</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="pt-3 border-t border-dashed">
                                                <h4 className="text-sm font-medium mb-3">Compliance Records (Encrypted)</h4>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <Label htmlFor="single-ref" className="text-xs text-muted-foreground">Reference ID</Label>
                                                        <Input
                                                            id="single-ref"
                                                            placeholder="Max 7 char"
                                                            value={singleRecipient.referenceId || ''}
                                                            onChange={(e) => setSingleRecipient({ ...singleRecipient, referenceId: e.target.value.substring(0, 7) })}
                                                            className="h-8 text-xs bg-muted/30"
                                                            maxLength={7}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="single-jurisdiction" className="text-xs text-muted-foreground">Recipient Jurisdiction</Label>
                                                        <Select
                                                            value={singleRecipient.jurisdiction || ''}
                                                            onValueChange={(value) => setSingleRecipient({ ...singleRecipient, jurisdiction: value })}
                                                        >
                                                            <SelectTrigger id="single-jurisdiction" className="w-full h-8 text-xs bg-muted/30">
                                                                <SelectValue placeholder="Select..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {JURISDICTION_OPTIONS.map((j) => (
                                                                    <SelectItem key={j.value} value={j.value}>
                                                                        {j.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label htmlFor="single-category" className="text-xs text-muted-foreground">Expense Category</Label>
                                                        <Select
                                                            value={singleRecipient.category || ''}
                                                            onValueChange={(value) => setSingleRecipient({ ...singleRecipient, category: value })}
                                                        >
                                                            <SelectTrigger id="single-category" className="w-full h-8 text-xs bg-muted/30">
                                                                <SelectValue placeholder="Select..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {CATEGORY_OPTIONS.map((c) => (
                                                                    <SelectItem key={c.value} value={c.value}>
                                                                        {c.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Show contact name if loaded from contact */}
                                            {(singleRecipient.contactName) && (
                                                <div className="flex flex-wrap gap-1 text-xs pt-2">
                                                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                                                        Contact: {singleRecipient.contactName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="batch" className="space-y-6 mt-6">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Send payments to multiple recipients in one transaction.
                                        </p>
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <ContactSelector
                                                    onSelect={(id) => loadContactForList(id, "batch")}
                                                    label="Select Contacts"
                                                />
                                            </div>
                                            <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addRecipient("batch")}
                                                    className="h-10"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" /> Add Recipient
                                                </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {batchRecipients.map((recipient, index) => (
                                                <RecipientRow
                                                    key={`batch-${index}`}
                                                    recipient={recipient}
                                                    index={index}
                                                    type="batch"
                                                    showRemove={batchRecipients.length > 1 || !!recipient.address || !!recipient.amount}
                                                    tokenSymbol="USDC"
                                                    onUpdate={updateRecipient}
                                                    onRemove={removeRecipient}
                                                />
                                            ))}
                                        </div>
                                    </TabsContent>
                                    
                                    <TabsContent value="recurring" className="space-y-6 mt-6">
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Set up automated scheduled payments.
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="recurring-name" className="text-sm font-medium">Payment Name</Label>
                                                <Input
                                                    id="recurring-name"
                                                    placeholder="e.g., Monthly Payroll"
                                                    value={recurringName}
                                                    onChange={(e) => setRecurringName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="recurring-start" className="text-sm font-medium">Start Date (Optional)</Label>
                                                <Input
                                                    id="recurring-start"
                                                    type="datetime-local"
                                                    value={recurringStartDate}
                                                    onChange={(e) => setRecurringStartDate(e.target.value)}
                                                    className="w-full"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">Leave empty to start immediately.</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <ContactSelector
                                                    onSelect={(id) => loadContactForList(id, "recurring")}
                                                    label="Select Contacts"
                                                />
                                            </div>
                                            <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => addRecipient("recurring")}
                                                    className="h-10"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" /> Add Recipient
                                                </Button>
                                        </div>

                                        <div className="space-y-4">
                                            {recurringRecipients.map((recipient, index) => (
                                                <RecipientRow
                                                    key={`recurring-${index}`}
                                                    recipient={recipient}
                                                    index={index}
                                                    type="recurring"
                                                    showRemove={recurringRecipients.length > 1 || !!recipient.address || !!recipient.amount}
                                                    tokenSymbol="USDC"
                                                    onUpdate={updateRecipient}
                                                    onRemove={removeRecipient}
                                                />
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Frequency</Label>
                                                <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="60">Every Minute (demo)</SelectItem>
                                                        <SelectItem value="3600">Hourly</SelectItem>
                                                        <SelectItem value="86400">Daily</SelectItem>
                                                        <SelectItem value="604800">Weekly</SelectItem>
                                                        <SelectItem value="2592000">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium">Duration</Label>
                                                <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select duration" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="300">5 Minutes (demo)</SelectItem>
                                                        <SelectItem value="3600">1 Hour</SelectItem>
                                                        <SelectItem value="86400">1 Day</SelectItem>
                                                        <SelectItem value="604800">1 Week</SelectItem>
                                                        <SelectItem value="2592000">1 Month</SelectItem>
                                                        <SelectItem value="7776000">3 Months</SelectItem>
                                                        <SelectItem value="15552000">6 Months</SelectItem>
                                                        <SelectItem value="31536000">1 Year</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            <div className="col-span-2 mt-2">
                                                <Alert variant="default" className="bg-muted/50 text-muted-foreground border-none">
                                                    <Info className="h-4 w-4" />
                                                    <AlertDescription className="text-xs">
                                                        Schedules represent automated payments that trigger regularly until the duration expires.
                                                    </AlertDescription>
                                                </Alert>
                                            </div>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                        <div className="pt-4 mt-6">
                            <Alert variant="default" className="bg-muted/50 text-muted-foreground border-none">
                                <Info className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    Compliance records are encrypted end-to-end and stored on-chain.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    {transactionStatus !== "Encrypting..." && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {transactionStatus === "Encrypting..." ? "Encrypting metadata..." : (transactionStatus || "Processing...")}
                                </>
                            ) : (
                                transactionStatus === "Complete" ? "Payment Successful" :
                                (currentPaymentType === "recurring" ? "Create Schedule" : "Confirm Payment")
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
