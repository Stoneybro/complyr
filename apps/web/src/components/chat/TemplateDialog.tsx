/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useContacts } from '@/hooks/useContacts';

export type TemplateType = 'SINGLE' | 'BATCH' | 'RECURRING' | 'BATCH_RECURRING';

interface TemplateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: TemplateType;
    onSubmit: (templateString: string) => void;
    walletAddress?: string;
}

export function TemplateDialog({ open, onOpenChange, type, onSubmit, walletAddress }: TemplateDialogProps) {
    // Common state
    const [recipients, setRecipients] = useState<{ address: string; amount: string; entityId: string; category: string; jurisdiction: string; contactName?: string }[]>([{ address: '', amount: '', entityId: '', category: '', jurisdiction: '' }]);

    // Recurring state
    const [name, setName] = useState('');
    const [intervalUnit, setIntervalUnit] = useState('monthly'); // daily, weekly, monthly
    const [durationUnit, setDurationUnit] = useState('months'); // days, weeks, months
    const [durationValue, setDurationValue] = useState('12');
    const [startDate, setStartDate] = useState<Date | undefined>(undefined);
    const [showCompliance, setShowCompliance] = useState(false);
    const [referenceId, setReferenceId] = useState('');

    const isRecurring = type === 'RECURRING' || type === 'BATCH_RECURRING';
    const isBatch = type === 'BATCH' || type === 'BATCH_RECURRING';

    // Fetch contacts
    const { data: contacts = [] } = useContacts(walletAddress);

    // Memoize contacts for combobox
    const contactOptions = useMemo(() => {
        console.log("raw contacts:", contacts);
        const seenAddresses = new Set<string>();
        const opt = contacts.flatMap(c =>
            c.addresses.map(a => ({
                label: c.name + (c.addresses.length > 1 ? ` (${a.address.slice(0, 6)}...)` : ''),
                value: a.address,
                contact: c,
                addressDetails: a
            }))
        );
        console.log("computed options:", opt);
        return opt;
    }, [contacts]);

    const addRecipient = () => {
        if (recipients.length < 10) {
            setRecipients([...recipients, { address: '', amount: '', entityId: '', category: '', jurisdiction: '' }]);
        }
    };

    const removeRecipient = (index: number) => {
        if (recipients.length > 1) {
            const newRecipients = [...recipients];
            newRecipients.splice(index, 1);
            setRecipients(newRecipients);
        }
    };

    const updateRecipient = (index: number, field: string, value: string) => {
        const newRecipients = [...recipients];
        newRecipients[index] = { ...newRecipients[index], [field]: value };
        setRecipients(newRecipients);
    };

    const handleSelectContact = (index: number, address: string) => {
        const option = contactOptions.find(o => o.value.toLowerCase() === address.toLowerCase());

        const newRecipients = [...recipients];
        newRecipients[index].address = address;

        if (option) {
            newRecipients[index].contactName = option.contact.name;
            // Auto-fill compliance if available
            if (option.addressDetails.entityId) newRecipients[index].entityId = option.addressDetails.entityId;
            if (option.addressDetails.jurisdiction) newRecipients[index].jurisdiction = option.addressDetails.jurisdiction;
            if (option.addressDetails.category) newRecipients[index].category = option.addressDetails.category;

            // If contact compliance data was found, auto-show the compliance section
            if (option.addressDetails.entityId || option.addressDetails.jurisdiction || option.addressDetails.category) {
                setShowCompliance(true);
            }
        } else {
            newRecipients[index].contactName = undefined;
        }

        setRecipients(newRecipients);
    };

    const handleSubmit = () => {
        // Construct the template string
        let template = `TEMPLATE_TRIGGER | TYPE: ${type}`;

        if (isRecurring) {
            if (!name) return; // Basic validation
            template += ` | NAME: "${name}"`;

            // Calculate interval
            let interval = 2592000;
            if (intervalUnit === 'daily') interval = 86400;
            if (intervalUnit === 'weekly') interval = 604800;
            if (intervalUnit === 'test_minute') interval = 60;
            // monthly default
            template += ` | INTERVAL: ${interval}`;

            // Calculate duration
            let duration = 31536000;
            const val = parseInt(durationValue) || 12;
            if (durationUnit === 'days') duration = val * 86400;
            if (durationUnit === 'weeks') duration = val * 604800;
            if (durationUnit === 'months') duration = val * 2592000;
            if (durationUnit === 'minutes') duration = val * 60;
            template += ` | DURATION: ${duration}`;

            // Start time
            if (startDate) {
                template += ` | START: ${Math.floor(startDate.getTime() / 1000)}`;
            } else {
                template += ` | START: 0`; // Start now
            }
        }

        const addresses = recipients.map(r => r.address || "0x0000000000000000000000000000000000000000").join(", ");
        const amounts = recipients.map(r => r.amount || "0").join(", ");

        template += ` | TO: "${addresses}" | AMOUNT: ${amounts}`;

        // Compliance Block
        const complianceData: any = {};
        const hasCompliance = recipients.some(r => r.entityId || r.category || r.jurisdiction);

        if (hasCompliance || referenceId) {
            complianceData.entityIds = recipients.map(r => r.entityId || "");
            complianceData.categories = recipients.map(r => r.category || "");
            complianceData.jurisdictions = recipients.map(r => r.jurisdiction || "");
            if (referenceId) complianceData.referenceId = referenceId;
            template += ` | COMPLIANCE: ${JSON.stringify(complianceData)}`;
        }

        onSubmit(template);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {type === 'SINGLE' && "Send Payment"}
                        {type === 'BATCH' && "Send Batch Payment"}
                        {type === 'RECURRING' && "Create Subscription"}
                        {type === 'BATCH_RECURRING' && "Run Payroll"}
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details to generate a payment template.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Recurring Fields */}
                    {isRecurring && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Payment Name (Required)</Label>
                                <Input
                                    placeholder="e.g. Monthly Rent, Q1 Payroll"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label>Frequency</Label>
                                <Select value={intervalUnit} onValueChange={setIntervalUnit}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="daily">Daily</SelectItem>
                                        <SelectItem value="weekly">Weekly</SelectItem>
                                        <SelectItem value="monthly">Monthly</SelectItem>
                                        <SelectItem value="test_minute">Test (1 Minute)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className='flex flex-col gap-2'>
                                <Label>Duration</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={durationValue}
                                        onChange={e => setDurationValue(e.target.value)}
                                        className="w-20"
                                    />
                                    <Select value={durationUnit} onValueChange={setDurationUnit}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="days">Days</SelectItem>
                                            <SelectItem value="weeks">Weeks</SelectItem>
                                            <SelectItem value="months">Months</SelectItem>
                                            <SelectItem value="minutes">Minutes (Test)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>


                            <div className="flex flex-col gap-2 col-span-2">
                                <Label>Start Date (Optional - defaults to Now)</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !startDate && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={startDate}
                                            onSelect={setStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}


                    <div className="grid gap-2">
                        <Label>Reference ID (Optional)</Label>
                        <Input
                            placeholder="e.g. INV-2024-001"
                            value={referenceId}
                            onChange={e => setReferenceId(e.target.value)}
                        />
                    </div>

                    {/* Recipients List */}
                    <div className="space-y-4">
                        <Label>Recipients</Label>
                        {recipients.map((recipient, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-muted/20 space-y-3">
                                <div className="flex gap-2 items-start">
                                    <div className="grid gap-2 flex-1">
                                        {/* Contact Picker / Address Input */}
                                        <div className="relative">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between"
                                                    >
                                                        {recipient.contactName
                                                            ? recipient.contactName
                                                            : recipient.address
                                                                ? (recipient.address.slice(0, 10) + "...")
                                                                : "Select Contact or Enter Address..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                    <div className="max-h-[300px] overflow-y-auto p-1">
                                                        {contactOptions.length === 0 ? (
                                                            <div className="py-6 text-center text-sm text-muted-foreground">
                                                                No contacts found.
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-0.5">
                                                                {contactOptions.map((contact) => (
                                                                    <div
                                                                        key={`${contact.contact.id}-${contact.value}`}
                                                                        className={cn(
                                                                            "flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none cursor-pointer",
                                                                            "hover:bg-accent hover:text-accent-foreground",
                                                                            recipient.address === contact.value && (!recipient.contactName || recipient.contactName === contact.contact.name) ? "bg-accent/50" : ""
                                                                        )}
                                                                        onClick={() => {
                                                                            handleSelectContact(index, contact.value);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4 shrink-0",
                                                                                recipient.address === contact.value && (!recipient.contactName || recipient.contactName === contact.contact.name) ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        <span className="truncate">{contact.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                            {/* Fallback manual input for when user wants to paste address directly */}
                                            <Input
                                                className="mt-2 text-xs font-mono"
                                                placeholder="Or paste 0x address here..."
                                                value={recipient.address}
                                                onChange={(e) => handleSelectContact(index, e.target.value)} // Reusing handleSelectContact to handle manual entry too
                                            />
                                        </div>

                                        <div className="relative">
                                            <Input
                                                type="number"
                                                placeholder="Amount"
                                                value={recipient.amount}
                                                onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                                                className="pl-8"
                                            />
                                            <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">$</span>
                                        </div>
                                    </div>
                                    {isBatch && recipients.length > 1 && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeRecipient(index)}
                                            className="text-destructive hover:text-destructive/90"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {showCompliance && (
                                    <div className="grid grid-cols-3 gap-2 pt-2 border-t mt-2">
                                        <Input
                                            placeholder="Category (e.g. Payroll)"
                                            className="text-xs h-8"
                                            value={recipient.category}
                                            onChange={(e) => updateRecipient(index, 'category', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Jurisdiction (e.g. US-CA)"
                                            className="text-xs h-8"
                                            value={recipient.jurisdiction}
                                            onChange={(e) => updateRecipient(index, 'jurisdiction', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Entity ID (e.g. EMP-001)"
                                            className="text-xs h-8"
                                            value={recipient.entityId}
                                            onChange={(e) => updateRecipient(index, 'entityId', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        ))}

                        {isBatch && recipients.length < 10 && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addRecipient}
                                className="w-full"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Add Recipient
                            </Button>
                        )}

                        <div className="flex items-center space-x-2 pt-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground h-auto p-0 hover:bg-transparent hover:text-primary"
                                onClick={() => setShowCompliance(!showCompliance)}
                            >
                                {showCompliance ? "- Hide Compliance Options" : "+ Show Compliance Options"}
                            </Button>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={handleSubmit}>Generate Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
