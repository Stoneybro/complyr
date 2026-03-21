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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { useRecurringPayment } from "@/hooks/payments/useRecurringPayment";
import { useSingleTransfer } from "@/hooks/payments/useSingleTransfer";
import { useBatchTransfer } from "@/hooks/payments/useBatchTransfer";
import { useContacts } from "@/hooks/useContacts";
import { toast } from "sonner";
import type { Contact } from "@/lib/contact-store";
import {
    stringsToJurisdictions,
    stringsToCategories,
    getJurisdictionOptions,
    getCategoryOptions
} from "@/lib/compliance-enums";

// Compliance options
const JURISDICTION_OPTIONS = getJurisdictionOptions();
const CATEGORY_OPTIONS = getCategoryOptions();

// Recipient with optional compliance data from contact
type RecipientData = {
    address: string;
    amount: string;
    entityId?: string;
    jurisdiction?: string;
    category?: string;
    contactName?: string;
};

// Extracted outside to prevent re-creation on every render (fixes focus loss)
const RecipientRow = React.memo(({
    recipient,
    index,
    type,
    showRemove,
    onUpdate,
    onRemove,
}: {
    recipient: RecipientData;
    index: number;
    type: "batch" | "recurring";
    showRemove: boolean;
    onUpdate: (type: "batch" | "recurring", index: number, field: keyof RecipientData, value: string) => void;
    onRemove: (type: "batch" | "recurring", index: number) => void;
}) => (
    <div className="space-y-2 p-3 border rounded-lg">
        <div className="flex gap-2 items-center">
            <Input
                placeholder="0x..."
                value={recipient.address}
                onChange={(e) => onUpdate(type, index, "address", e.target.value)}
                className="flex-1 font-mono text-sm"
            />
            <Input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={recipient.amount}
                onChange={(e) => onUpdate(type, index, "amount", e.target.value)}
                className="w-32"
            />
            {showRemove && (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(type, index)}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </div>
        <div className="flex gap-2">
            <Input
                placeholder="ID (e.g., EMP-001, CTR-004)"
                value={recipient.entityId || ""}
                onChange={(e) => onUpdate(type, index, "entityId", e.target.value)}
                className="flex-1 text-sm bg-muted/20"
            />
        </div>
        {/* Show compliance info if loaded from contact */}
        {(recipient.contactName || recipient.entityId || recipient.jurisdiction || recipient.category) && (
            <div className="flex flex-wrap gap-1 text-xs">
                {recipient.contactName && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                        {recipient.contactName}
                    </span>
                )}
                {recipient.entityId && (
                    <span className="px-2 py-0.5 bg-muted rounded">
                        ID: {recipient.entityId}
                    </span>
                )}
                {recipient.jurisdiction && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                        📍 {recipient.jurisdiction}
                    </span>
                )}
                {recipient.category && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                        📋 {recipient.category}
                    </span>
                )}
            </div>
        )}
    </div>
));
RecipientRow.displayName = "RecipientRow";

interface PaymentFormProps {
    walletAddress?: `0x${string}`;
    availableBalance?: string;
}

type PaymentType = "single" | "batch" | "recurring";
type PayrollCategory = "none" | "PAYROLL_W2" | "PAYROLL_1099" | "CONTRACTOR" | "BONUS" | "INVOICE" | "VENDOR" | "GRANT";


export function PaymentForm({ walletAddress, availableBalance }: PaymentFormProps) {
    const [paymentType, setPaymentType] = useState<PaymentType>("single");

    // Single payment state
    const [singleRecipient, setSingleRecipient] = useState<RecipientData>({ address: "", amount: "" });

    // Batch payment state
    const [batchRecipients, setBatchRecipients] = useState<RecipientData[]>([{ address: "", amount: "" }]);

    // Recurring payment state
    const [recurringName, setRecurringName] = useState("");
    const [recurringRecipients, setRecurringRecipients] = useState<RecipientData[]>([{ address: "", amount: "" }]);
    const [recurringInterval, setRecurringInterval] = useState("86400"); // daily default
    const [recurringDuration, setRecurringDuration] = useState("");
    const [recurringStartDate, setRecurringStartDate] = useState("");

    // Global payroll metadata (used when contact doesn't have it)
    const [periodId, setPeriodId] = useState("");

    // Contacts hook
    const { data: contacts = [] } = useContacts(walletAddress);

    // Mutations
    const singleMutation = useSingleTransfer(availableBalance);
    const batchMutation = useBatchTransfer(availableBalance);
    const recurringMutation = useRecurringPayment(availableBalance);

    const isProcessing = singleMutation.isPending || batchMutation.isPending || recurringMutation.isPending;

    // Check if current recipients have compliance data from contacts
    const getActiveRecipients = (): RecipientData[] => {
        if (paymentType === "single") return [singleRecipient];
        if (paymentType === "batch") return batchRecipients;
        return recurringRecipients;
    };

    const hasContactCompliance = (): { hasJurisdiction: boolean; hasCategory: boolean; hasAny: boolean } => {
        const recipients = getActiveRecipients();
        const hasJurisdiction = recipients.some(r => r.jurisdiction);
        const hasCategory = recipients.some(r => r.category);
        return {
            hasJurisdiction,
            hasCategory,
            hasAny: hasJurisdiction || hasCategory || recipients.some(r => r.entityId)
        };
    };

    const complianceFromContact = hasContactCompliance();


    // Load contact for single transfer
    const loadContactForSingle = (contactId: string) => {
        const contact = contacts.find(c => c.id === contactId);
        if (!contact || contact.addresses.length === 0) return;

        const addr = contact.addresses[0]; // Use first address
        setSingleRecipient({
            address: addr.address,
            amount: singleRecipient.amount, // Keep existing amount
            entityId: addr.entityId,
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
            entityId: addr.entityId,
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
        const entityIds = recipients.map(r => r.entityId || "");
        const jurisdictionStrings = recipients.map(r => r.jurisdiction);
        const categoryStrings = recipients.map(r => r.category);

        // Filter out empty arrays for optional fields
        const hasEntityIds = entityIds.some(id => id);
        const hasJurisdictions = jurisdictionStrings.some(j => j);
        const hasCategories = categoryStrings.some(c => c);

        // Convert strings to enum values (numbers)
        return {
            entityIds: hasEntityIds ? entityIds : undefined,
            jurisdictions: hasJurisdictions ? stringsToJurisdictions(jurisdictionStrings) : undefined,
            categories: hasCategories ? stringsToCategories(categoryStrings) : undefined,
            referenceId: periodId || undefined,
        };
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (paymentType === "single") {
                if (!singleRecipient.address || !singleRecipient.amount) {
                    toast.error("Please fill in recipient and amount");
                    return;
                }
                await singleMutation.mutateAsync({
                    to: singleRecipient.address as `0x${string}`,
                    amount: singleRecipient.amount,
                    compliance: buildCompliance([singleRecipient]),
                });
                setSingleRecipient({ address: "", amount: "" });
                setPeriodId("");
            } else if (paymentType === "batch") {
                const validRecipients = batchRecipients.filter(r => r.address && r.amount);
                if (validRecipients.length < 2) {
                    toast.error("Batch payments require at least 2 recipients");
                    return;
                }
                await batchMutation.mutateAsync({
                    recipients: validRecipients.map(r => r.address as `0x${string}`),
                    amounts: validRecipients.map(r => r.amount),
                    compliance: buildCompliance(validRecipients),
                });
                setBatchRecipients([{ address: "", amount: "" }]);
                setPeriodId("");
            } else if (paymentType === "recurring") {
                if (!recurringName) {
                    toast.error("Please provide a name for this recurring payment");
                    return;
                }
                const validRecipients = recurringRecipients.filter(r => r.address && r.amount);
                if (validRecipients.length === 0) {
                    toast.error("Please add at least one recipient");
                    return;
                }
                if (!recurringDuration) {
                    toast.error("Please specify the duration");
                    return;
                }
                await recurringMutation.mutateAsync({
                    name: recurringName,
                    recipients: validRecipients.map(r => r.address as `0x${string}`),
                    amounts: validRecipients.map(r => r.amount),
                    interval: parseInt(recurringInterval),
                    duration: parseInt(recurringDuration),
                    transactionStartTime: recurringStartDate ? Math.floor(new Date(recurringStartDate).getTime() / 1000) : 0,
                    compliance: buildCompliance(validRecipients),
                });
                // Reset
                setRecurringName("");
                setRecurringRecipients([{ address: "", amount: "" }]);
                setRecurringDuration("");
                setRecurringDuration("");
                setRecurringStartDate("");
                setPeriodId("");
            }
        } catch (error) {
            console.error("Payment error:", error);
        }
    };

    // Contact selector component
    const ContactSelector = ({ onSelect, label = "Load from Contact" }: { onSelect: (contactId: string) => void; label?: string }) => (
        <Select onValueChange={onSelect}>
            <SelectTrigger className="w-full">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <SelectValue placeholder={label} />
                </div>
            </SelectTrigger>
            <SelectContent>
                {contacts.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                        No contacts saved yet
                    </div>
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
    );

    return (
        <div className="max-w-2xl mx-auto py-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manual Payment Form</CardTitle>
                    <CardDescription>
                        Create payments without using the AI chat. Load recipients from saved contacts to auto-fill compliance data.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Payment Type Selection */}
                        <div className="space-y-2">
                            <Label>Payment Type</Label>
                            <Select value={paymentType} onValueChange={(v) => setPaymentType(v as PaymentType)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single Transfer</SelectItem>
                                    <SelectItem value="batch">Batch Transfer (2+ recipients)</SelectItem>
                                    <SelectItem value="recurring">Recurring Payment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Single Transfer Form */}
                        {paymentType === "single" && (
                            <div className="space-y-4">
                                <ContactSelector onSelect={loadContactForSingle} />

                                <div className="space-y-2 p-3 border rounded-lg">
                                    <div className="space-y-2">
                                        <Label htmlFor="single-recipient">Recipient Address</Label>
                                        <Input
                                            id="single-recipient"
                                            placeholder="0x..."
                                            value={singleRecipient.address}
                                            onChange={(e) => setSingleRecipient({ ...singleRecipient, address: e.target.value })}
                                            className="font-mono"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="single-amount">Amount (MNT)</Label>
                                        <Input
                                            id="single-amount"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={singleRecipient.amount}
                                            onChange={(e) => setSingleRecipient({ ...singleRecipient, amount: e.target.value })}
                                        />
                                    </div>
                                    {/* Show compliance if loaded from contact */}
                                    {(singleRecipient.contactName || singleRecipient.entityId || singleRecipient.jurisdiction || singleRecipient.category) && (
                                        <div className="flex flex-wrap gap-1 text-xs pt-2 border-t">
                                            {singleRecipient.contactName && (
                                                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">
                                                    {singleRecipient.contactName}
                                                </span>
                                            )}
                                            {singleRecipient.entityId && (
                                                <span className="px-2 py-0.5 bg-muted rounded">
                                                    ID: {singleRecipient.entityId}
                                                </span>
                                            )}
                                            {singleRecipient.jurisdiction && (
                                                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                                    📍 {singleRecipient.jurisdiction}
                                                </span>
                                            )}
                                            {singleRecipient.category && (
                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                                    📋 {singleRecipient.category}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Batch Transfer Form */}
                        {paymentType === "batch" && (
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <ContactSelector
                                            onSelect={(id) => loadContactForList(id, "batch")}
                                            label="Add from Contact"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addRecipient("batch")}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Manual
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Note: Manual entries bypass contact compliance data. Use contacts for auto-compliance.
                                </p>

                                <Label>Recipients</Label>
                                <div className="space-y-2">
                                    {batchRecipients.map((recipient, index) => (
                                        <RecipientRow
                                            key={`batch-${index}`}
                                            recipient={recipient}
                                            index={index}
                                            type="batch"
                                            showRemove={batchRecipients.length > 1 || !!recipient.address || !!recipient.amount}
                                            onUpdate={updateRecipient}
                                            onRemove={removeRecipient}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Recurring Payment Form */}
                        {paymentType === "recurring" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recurring-name">Payment Name</Label>
                                    <Input
                                        id="recurring-name"
                                        placeholder="e.g., Monthly Payroll"
                                        value={recurringName}
                                        onChange={(e) => setRecurringName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="recurring-start">Start Date (Optional)</Label>
                                    <Input
                                        id="recurring-start"
                                        type="datetime-local"
                                        value={recurringStartDate}
                                        onChange={(e) => setRecurringStartDate(e.target.value)}
                                        className="w-full"
                                    />
                                    <p className="text-xs text-muted-foreground">Leave empty to start immediately.</p>
                                </div>

                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <ContactSelector
                                            onSelect={(id) => loadContactForList(id, "recurring")}
                                            label="Add from Contact"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addRecipient("recurring")}
                                    >
                                        <Plus className="h-4 w-4 mr-2" /> Add Manual
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Note: Manual entries bypass contact compliance data. Use contacts for auto-compliance.
                                </p>


                                <Label>Recipients</Label>
                                <div className="space-y-2">
                                    {recurringRecipients.map((recipient, index) => (
                                        <RecipientRow
                                            key={`recurring-${index}`}
                                            recipient={recipient}
                                            index={index}
                                            type="recurring"
                                            showRemove={recurringRecipients.length > 1 || !!recipient.address || !!recipient.amount}
                                            onUpdate={updateRecipient}
                                            onRemove={removeRecipient}
                                        />
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Frequency</Label>
                                        <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="60">Every Minute (testing)</SelectItem>
                                                <SelectItem value="3600">Hourly</SelectItem>
                                                <SelectItem value="86400">Daily</SelectItem>
                                                <SelectItem value="604800">Weekly</SelectItem>
                                                <SelectItem value="2592000">Monthly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Duration</Label>
                                        <Select value={recurringDuration} onValueChange={setRecurringDuration}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="300">5 Minutes (testing)</SelectItem>
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
                                    <div className="col-span-2 text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                                        💡 Tip: For more advanced schedules (e.g., &quot;every 3 days&quot;, &quot;first of month&quot;), try creating the payment using the AI Chat.
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Global Settings */}
                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <Label className="text-base font-semibold">Additional Details</Label>
                                {complianceFromContact.hasAny && (
                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">
                                        ✓ Using contact compliance data
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="period-id">Reference ID (Optional)</Label>
                                <Input
                                    id="period-id"
                                    placeholder="e.g., Invoice #123, Q1 Payroll, Bonus"
                                    value={periodId}
                                    onChange={(e) => setPeriodId(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    This reference ID will be included with the transaction metadata.
                                </p>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={isProcessing}>
                            {isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                paymentType === "recurring" ? "Create Recurring Payment" : "Send Payment"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

