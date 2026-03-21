import { db } from "../db/db";
import { contacts, contactAddresses } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { generateId } from "ai";

// Compliance metadata for contacts (optional fields)
export type ContactCompliance = {
    entityId?: string;      // e.g., "EMP-001", "CTR-005", "VENDOR-AWS"
    jurisdiction?: string;  // e.g., "US-CA", "UK", "EU-DE", "NG"
    category?: string;      // e.g., "PAYROLL_W2", "CONTRACTOR", "INVOICE"
};

export type ContactAddress = {
    id: string;
    address: string;
    label?: string;
    entityId?: string;
    jurisdiction?: string;
    category?: string;
};

export type Contact = {
    id: string;
    userId: string;
    name: string;
    type: 'individual' | 'group';
    addresses: ContactAddress[];
    createdAt: Date;
    updatedAt: Date;
};

export type CreateAddressInput = {
    address: string;
    label?: string;
    entityId?: string;
    jurisdiction?: string;
    category?: string;
};

// Create new contact with addresses (including compliance metadata)
export async function createContact(
    userId: string,
    name: string,
    type: 'individual' | 'group',
    addresses: CreateAddressInput[]
): Promise<Contact> {
    const contactId = generateId();

    await db.transaction(async (tx) => {
        // Insert contact
        await tx.insert(contacts).values({
            id: contactId,
            userId,
            name,
            type,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Insert addresses with compliance metadata
        for (const addr of addresses) {
            await tx.insert(contactAddresses).values({
                id: generateId(),
                contactId,
                address: addr.address,
                label: addr.label || null,
                entityId: addr.entityId || null,
                jurisdiction: addr.jurisdiction || null,
                category: addr.category || null,
                createdAt: new Date(),
            });
        }
    });

    return getContact(contactId) as Promise<Contact>;
}

// Get all contacts for user (with addresses and compliance metadata)
export async function getContacts(userId: string): Promise<Contact[]> {
    const results = await db
        .select()
        .from(contacts)
        .leftJoin(contactAddresses, eq(contacts.id, contactAddresses.contactId))
        .where(eq(contacts.userId, userId))
        .orderBy(contacts.name);

    // Group addresses by contact
    const contactMap = new Map<string, Contact>();

    for (const row of results) {
        if (!contactMap.has(row.contacts.id)) {
            contactMap.set(row.contacts.id, {
                id: row.contacts.id,
                userId: row.contacts.userId,
                name: row.contacts.name,
                type: row.contacts.type as 'individual' | 'group',
                addresses: [],
                createdAt: row.contacts.createdAt!,
                updatedAt: row.contacts.updatedAt!,
            });
        }

        if (row.contact_addresses) {
            contactMap.get(row.contacts.id)!.addresses.push({
                id: row.contact_addresses.id,
                address: row.contact_addresses.address,
                label: row.contact_addresses.label || undefined,
                entityId: row.contact_addresses.entityId || undefined,
                jurisdiction: row.contact_addresses.jurisdiction || undefined,
                category: row.contact_addresses.category || undefined,
            });
        }
    }

    return Array.from(contactMap.values());
}

// Get single contact by ID
export async function getContact(contactId: string): Promise<Contact | null> {
    const results = await db
        .select()
        .from(contacts)
        .leftJoin(contactAddresses, eq(contacts.id, contactAddresses.contactId))
        .where(eq(contacts.id, contactId));

    if (results.length === 0) return null;

    const contact: Contact = {
        id: results[0].contacts.id,
        userId: results[0].contacts.userId,
        name: results[0].contacts.name,
        type: results[0].contacts.type as 'individual' | 'group',
        addresses: [],
        createdAt: results[0].contacts.createdAt!,
        updatedAt: results[0].contacts.updatedAt!,
    };

    for (const row of results) {
        if (row.contact_addresses) {
            contact.addresses.push({
                id: row.contact_addresses.id,
                address: row.contact_addresses.address,
                label: row.contact_addresses.label || undefined,
                entityId: row.contact_addresses.entityId || undefined,
                jurisdiction: row.contact_addresses.jurisdiction || undefined,
                category: row.contact_addresses.category || undefined,
            });
        }
    }

    return contact;
}

// Find contact by name (case-insensitive)
export async function getContactByName(
    userId: string,
    name: string
): Promise<Contact | null> {
    const results = await db
        .select()
        .from(contacts)
        .leftJoin(contactAddresses, eq(contacts.id, contactAddresses.contactId))
        .where(
            and(
                eq(contacts.userId, userId),
                sql`LOWER(${contacts.name}) = LOWER(${name})`
            )
        );

    if (results.length === 0) return null;

    const contact: Contact = {
        id: results[0].contacts.id,
        userId: results[0].contacts.userId,
        name: results[0].contacts.name,
        type: results[0].contacts.type as 'individual' | 'group',
        addresses: [],
        createdAt: results[0].contacts.createdAt!,
        updatedAt: results[0].contacts.updatedAt!,
    };

    for (const row of results) {
        if (row.contact_addresses) {
            contact.addresses.push({
                id: row.contact_addresses.id,
                address: row.contact_addresses.address,
                label: row.contact_addresses.label || undefined,
                entityId: row.contact_addresses.entityId || undefined,
                jurisdiction: row.contact_addresses.jurisdiction || undefined,
                category: row.contact_addresses.category || undefined,
            });
        }
    }

    return contact;
}

// Update contact (name/type and optionally replace addresses)
export async function updateContact(
    contactId: string,
    data: {
        name?: string;
        type?: 'individual' | 'group';
        addresses?: CreateAddressInput[];
    }
): Promise<Contact> {
    await db.transaction(async (tx) => {
        // Update contact metadata
        if (data.name || data.type) {
            await tx
                .update(contacts)
                .set({
                    ...(data.name && { name: data.name }),
                    ...(data.type && { type: data.type }),
                    updatedAt: new Date(),
                })
                .where(eq(contacts.id, contactId));
        }

        // If addresses provided, replace all (including compliance metadata)
        if (data.addresses) {
            await tx.delete(contactAddresses).where(eq(contactAddresses.contactId, contactId));

            for (const addr of data.addresses) {
                await tx.insert(contactAddresses).values({
                    id: generateId(),
                    contactId,
                    address: addr.address,
                    label: addr.label || null,
                    entityId: addr.entityId || null,
                    jurisdiction: addr.jurisdiction || null,
                    category: addr.category || null,
                    createdAt: new Date(),
                });
            }

            await tx
                .update(contacts)
                .set({ updatedAt: new Date() })
                .where(eq(contacts.id, contactId));
        }
    });

    return getContact(contactId) as Promise<Contact>;
}

// Delete contact (cascade deletes addresses)
export async function deleteContact(contactId: string): Promise<void> {
    await db.delete(contacts).where(eq(contacts.id, contactId));
}

