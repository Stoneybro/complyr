import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    title: text("title"),
    userId: text("user_id"),
});

export const messages = pgTable("messages", {
    id: text("id").primaryKey(),
    chatId: text("chat_id")
        .references(() => chats.id)
        .notNull(),
    role: text("role").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Contacts table
export const contacts = pgTable("contacts", {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    type: text("type").notNull(), // 'individual' or 'group'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contact addresses (one-to-many with contacts)
// Now includes audit metadata for each address
export const contactAddresses = pgTable("contact_addresses", {
    id: text("id").primaryKey(),
    contactId: text("contact_id")
        .references(() => contacts.id, { onDelete: "cascade" })
        .notNull(),
    address: text("address").notNull(),
    label: text("label"),
    // Audit metadata fields
    entityId: text("entity_id"), // e.g., "EMP-001", "CTR-005", "VENDOR-AWS"
    jurisdiction: text("jurisdiction"), // e.g., "US-CA", "UK", "EU-DE", "NG"
    category: text("category"), // e.g., "PAYROLL_W2", "CONTRACTOR", "INVOICE"
    createdAt: timestamp("created_at").defaultNow().notNull(),
});
