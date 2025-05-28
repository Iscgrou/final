import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Representatives table with Android-converted web features
export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  telegramId: text("telegram_id"),
  telegramUsername: text("telegram_username"),
  phone: text("phone"),
  email: text("email"),
  storeName: text("store_name"),
  
  // Web-based flexible pricing structure (converted from Android)
  price1Month: text("price_1_month").notNull().default("50000"),
  price2Month: text("price_2_month").notNull().default("95000"),
  price3Month: text("price_3_month").notNull().default("135000"),
  price4Month: text("price_4_month").notNull().default("170000"),
  price5Month: text("price_5_month").notNull().default("200000"),
  price6Month: text("price_6_month").notNull().default("225000"),
  unlimitedMonthlyPrice: text("unlimited_monthly_price").notNull().default("300000"),
  
  // Legacy pricing (kept for backward compatibility)
  pricePerGb: decimal("price_per_gb", { precision: 10, scale: 2 }).notNull().default("50000"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).default("0"),
  
  parentRepId: integer("parent_rep_id"),
  parentId: integer("parent_id"),
  status: text("status").notNull().default("active"), // active, inactive, suspended
  isSpecialOffer: boolean("is_special_offer").default(false),
  isFreeUser: boolean("is_free_user").default(false),
  isReferred: boolean("is_referred").default(false),
  referredBy: text("referred_by"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").notNull(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  month: text("month").notNull(), // e.g., "1404/03"
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  finalAmount: decimal("final_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, sent, paid, overdue
  dueDate: timestamp("due_date").notNull(),
  pdfPath: text("pdf_path"),
  imagePath: text("image_path"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invoice items table for detailed billing
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id").notNull(),
  invoiceId: integer("invoice_id"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: text("payment_method"), // cash, bank_transfer, card, etc.
  description: text("description"),
  referenceNumber: text("reference_number"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Billing data from Excel imports
export const billingData = pgTable("billing_data", {
  id: serial("id").primaryKey(),
  adminUsername: text("admin_username").notNull(),
  dataUsageGb: decimal("data_usage_gb", { precision: 10, scale: 3 }).notNull(),
  month: text("month").notNull(),
  importedAt: timestamp("imported_at").defaultNow().notNull(),
  processed: boolean("processed").default(false),
  rawData: jsonb("raw_data"), // Store original Excel row data
});

// System settings
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const representativesRelations = relations(representatives, ({ one, many }) => ({
  parentRep: one(representatives, {
    fields: [representatives.parentRepId],
    references: [representatives.id],
  }),
  childReps: many(representatives),
  invoices: many(invoices),
  payments: many(payments),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  representative: one(representatives, {
    fields: [invoices.representativeId],
    references: [representatives.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  representative: one(representatives, {
    fields: [payments.representativeId],
    references: [representatives.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRepresentativeSchema = createInsertSchema(representatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Make fields optional for better form handling
  phone: z.string().optional(),
  email: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  telegramId: z.string().optional(),
  telegramUsername: z.string().optional(),
  storeName: z.string().optional(),
  referredBy: z.string().optional(),
  notes: z.string().optional(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertBillingDataSchema = createInsertSchema(billingData).omit({
  id: true,
  importedAt: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Representative = typeof representatives.$inferSelect;
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type BillingData = typeof billingData.$inferSelect;
export type InsertBillingData = z.infer<typeof insertBillingDataSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
