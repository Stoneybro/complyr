'use client';

import { useState } from 'react';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Contact, CreateAddressInput } from '@/lib/contact-store';
import { getJurisdictionOptions, getCategoryOptions } from '@/lib/compliance-enums';

// Use centralized jurisdiction and category options
const JURISDICTIONS = getJurisdictionOptions();
const CATEGORIES = getCategoryOptions();


type AddressFormData = {
    address: string;
    entityId: string;
    jurisdiction: string;
    category: string;
};

type ContactFormProps = {
    walletAddress?: string;
    contact?: Contact | null;
    onClose: () => void;
};

export function ContactForm({ walletAddress, contact, onClose }: ContactFormProps) {
    const [name, setName] = useState(contact?.name || '');
    const [addresses, setAddresses] = useState<AddressFormData[]>(
        contact?.addresses.map(a => ({
            address: a.address,
            entityId: a.entityId || '',
            jurisdiction: a.jurisdiction || '',
            category: a.category || '',
        })) || [{ address: '', entityId: '', jurisdiction: '', category: '' }]
    );

    const { mutate: createContact, isPending: isCreating } = useCreateContact();
    const { mutate: updateContact, isPending: isUpdating } = useUpdateContact();

    const isPending = isCreating || isUpdating;

    const addAddress = () => {
        setAddresses([...addresses, { address: '', entityId: '', jurisdiction: '', category: '' }]);
    };

    const removeAddress = (index: number) => {
        if (addresses.length === 1) return;
        setAddresses(addresses.filter((_, i) => i !== index));
    };

    const updateAddressField = (index: number, field: keyof AddressFormData, value: string) => {
        const updated = [...addresses];
        updated[index] = { ...updated[index], [field]: value };
        setAddresses(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim()) {
            toast.error('Please enter a contact name');
            return;
        }

        const validAddresses = addresses.filter(a => a.address.trim() !== '');
        if (validAddresses.length === 0) {
            toast.error('Please add at least one address');
            return;
        }

        // Check address format
        const invalidAddresses = validAddresses.filter(
            a => !a.address.startsWith('0x') || a.address.length !== 42
        );
        if (invalidAddresses.length > 0) {
            toast.error('Please enter valid wallet addresses (0x...)');
            return;
        }

        // Determine type based on address count
        const type = validAddresses.length > 1 ? 'group' : 'individual';

        // Prepare addresses with compliance data
        const addressData: CreateAddressInput[] = validAddresses.map(a => ({
            address: a.address.trim(),
            entityId: a.entityId?.trim() || undefined,
            jurisdiction: a.jurisdiction && a.jurisdiction !== 'none' ? a.jurisdiction : undefined,
            category: a.category && a.category !== 'none' ? a.category : undefined,
        }));

        const data = {
            userId: walletAddress!,
            name: name.trim(),
            type: type as 'individual' | 'group',
            addresses: addressData,
        };

        if (contact) {
            updateContact(
                { ...data, contactId: contact.id },
                {
                    onSuccess: () => {
                        toast.success('Contact updated');
                        onClose();
                    },
                    onError: () => toast.error('Failed to update contact'),
                }
            );
        } else {
            createContact(data, {
                onSuccess: () => {
                    toast.success('Contact created');
                    onClose();
                },
                onError: () => toast.error('Failed to create contact'),
            });
        }
    };

    return (
        <div className="p-4">
            {/* Header */}
            <div className="flex items-center  mb-2">
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 flex items-center justify-center">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold">
                    {contact ? 'Edit Contact' : 'New Contact'}
                </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
                <FieldGroup>
                    {/* Contact Name */}
                    <FieldSet>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="contact-name">Name</FieldLabel>
                                <Input
                                    id="contact-name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Alice, Engineering Team"
                                    autoFocus
                                />
                                <FieldDescription>
                                    A friendly name for this contact
                                </FieldDescription>
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    <FieldSeparator />

                    {/* Addresses */}
                    {addresses.map((addr, index) => (
                        <FieldSet key={index}>
                            <div className="flex items-center justify-between">
                                <FieldLegend variant="label">
                                    {addresses.length > 1 ? `Address ${index + 1}` : 'Wallet Address'}
                                </FieldLegend>
                                {addresses.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeAddress(index)}
                                        className="h-7 px-2 text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-3 w-3 mr-1" />
                                        Remove
                                    </Button>
                                )}
                            </div>
                            <FieldGroup className=''>
                                <Field>
                                    <FieldLabel htmlFor={`address-${index}`}>Address</FieldLabel>
                                    <Input
                                        id={`address-${index}`}
                                        value={addr.address}
                                        onChange={(e) => updateAddressField(index, 'address', e.target.value)}
                                        placeholder="0x..."
                                        className="font-mono text-sm"
                                    />
                                </Field>

                                <FieldSeparator>Compliance (optional)</FieldSeparator>

                                <Field>
                                    <FieldLabel htmlFor={`entity-${index}`}>Entity ID</FieldLabel>
                                    <Input
                                        id={`entity-${index}`}
                                        value={addr.entityId}
                                        onChange={(e) => updateAddressField(index, 'entityId', e.target.value)}
                                        placeholder="e.g., EMP-001, CTR-005"
                                    />
                                    <FieldDescription>
                                        Employee, contractor, or vendor identifier
                                    </FieldDescription>
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field>
                                        <FieldLabel htmlFor={`jurisdiction-${index}`}>Jurisdiction</FieldLabel>
                                        <Select
                                            value={addr.jurisdiction || 'none'}
                                            onValueChange={(value) => updateAddressField(index, 'jurisdiction', value)}
                                        >
                                            <SelectTrigger id={`jurisdiction-${index}`}>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {JURISDICTIONS.map((j) => (
                                                    <SelectItem key={j.value} value={j.value}>
                                                        {j.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor={`category-${index}`}>Category</FieldLabel>
                                        <Select
                                            value={addr.category || 'none'}
                                            onValueChange={(value) => updateAddressField(index, 'category', value)}
                                        >
                                            <SelectTrigger id={`category-${index}`}>
                                                <SelectValue placeholder="Select..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CATEGORIES.map((c) => (
                                                    <SelectItem key={c.value} value={c.value}>
                                                        {c.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>
                            </FieldGroup>
                        </FieldSet>
                    ))}

                    {/* Add Address Button */}
                    <Button
                        type="button"
                        variant="outline"
                        onClick={addAddress}
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Another Address
                    </Button>

                    <FieldDescription className="text-center">
                        Add multiple addresses to create a group contact
                    </FieldDescription>

                    <FieldSeparator />

                    {/* Submit */}
                    <Field orientation="horizontal">
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending ? 'Saving...' : contact ? 'Update Contact' : 'Create Contact'}
                        </Button>
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                    </Field>
                </FieldGroup>
            </form>
        </div>
    );
}
