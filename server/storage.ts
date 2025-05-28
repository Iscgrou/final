import {
  users, representatives, invoices, invoiceItems, payments, billingData, settings,
  type User, type InsertUser, type Representative, type InsertRepresentative,
  type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Payment, type InsertPayment, type BillingData, type InsertBillingData,
  type Setting, type InsertSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Representative methods
  getRepresentatives(): Promise<Representative[]>;
  getRepresentative(id: number): Promise<Representative | undefined>;
  getRepresentativeByUsername(username: string): Promise<Representative | undefined>;
  createRepresentative(rep: InsertRepresentative): Promise<Representative>;
  updateRepresentative(id: number, rep: Partial<InsertRepresentative>): Promise<Representative>;
  deleteRepresentative(id: number): Promise<void>;
  
  // Invoice methods
  getInvoices(): Promise<Invoice[]>;
  getInvoicesByRepresentative(repId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  
  // Invoice item methods
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  
  // Payment methods
  getPayments(): Promise<Payment[]>;
  getPaymentsByRepresentative(repId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Billing data methods
  getBillingData(month?: string): Promise<BillingData[]>;
  createBillingData(data: InsertBillingData[]): Promise<BillingData[]>;
  
  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(key: string, value: string): Promise<Setting>;
  
  // Analytics methods
  getDashboardStats(): Promise<{
    totalReps: number;
    outstandingBalance: string;
    monthlyRevenue: string;
    pendingInvoices: number;
  }>;
  getTopRepresentatives(limit?: number): Promise<Array<Representative & { revenue: string }>>;
  getMonthlyRevenue(): Promise<Array<{ month: string; revenue: number }>>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getRepresentatives(): Promise<Representative[]> {
    return await db.select().from(representatives).orderBy(desc(representatives.createdAt));
  }

  async getRepresentative(id: number): Promise<Representative | undefined> {
    const [rep] = await db.select().from(representatives).where(eq(representatives.id, id));
    return rep || undefined;
  }

  async getRepresentativeByUsername(username: string): Promise<Representative | undefined> {
    const [rep] = await db.select().from(representatives).where(eq(representatives.username, username));
    return rep || undefined;
  }

  async createRepresentative(rep: InsertRepresentative): Promise<Representative> {
    const [newRep] = await db.insert(representatives).values(rep).returning();
    return newRep;
  }

  async updateRepresentative(id: number, rep: Partial<InsertRepresentative>): Promise<Representative> {
    const [updatedRep] = await db
      .update(representatives)
      .set({ ...rep, updatedAt: new Date() })
      .where(eq(representatives.id, id))
      .returning();
    return updatedRep;
  }

  async deleteRepresentative(id: number): Promise<void> {
    await db.delete(representatives).where(eq(representatives.id, id));
  }

  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByRepresentative(repId: number): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.representativeId, repId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }

  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const [newItem] = await db.insert(invoiceItems).values(item).returning();
    return newItem;
  }

  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getPaymentsByRepresentative(repId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.representativeId, repId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async getBillingData(month?: string): Promise<BillingData[]> {
    const query = db.select().from(billingData);
    if (month) {
      return await query.where(eq(billingData.month, month));
    }
    return await query.orderBy(desc(billingData.importedAt));
  }

  async createBillingData(data: InsertBillingData[]): Promise<BillingData[]> {
    return await db.insert(billingData).values(data).returning();
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(key: string, value: string): Promise<Setting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value, updatedAt: new Date() })
        .where(eq(settings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(settings).values({ key, value }).returning();
      return created;
    }
  }

  async getDashboardStats() {
    // Get total representatives
    const totalRepsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(representatives)
      .where(eq(representatives.status, 'active'));
    const totalReps = totalRepsResult[0]?.count || 0;

    // Get outstanding balance (pending invoices)
    const outstandingResult = await db
      .select({ total: sql<string>`sum(final_amount)` })
      .from(invoices)
      .where(eq(invoices.status, 'pending'));
    const outstandingBalance = outstandingResult[0]?.total || "0";

    // Get monthly revenue (current month)
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyRevenueResult = await db
      .select({ total: sql<string>`sum(final_amount)` })
      .from(invoices)
      .where(and(
        eq(invoices.status, 'paid'),
        sql`${invoices.month} = ${currentMonth}`
      ));
    const monthlyRevenue = monthlyRevenueResult[0]?.total || "0";

    // Get pending invoices count
    const pendingInvoicesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(eq(invoices.status, 'pending'));
    const pendingInvoices = pendingInvoicesResult[0]?.count || 0;

    return {
      totalReps,
      outstandingBalance,
      monthlyRevenue,
      pendingInvoices,
    };
  }

  async getTopRepresentatives(limit = 5): Promise<Array<Representative & { revenue: string }>> {
    const result = await db
      .select()
      .from(representatives)
      .where(eq(representatives.status, 'active'))
      .orderBy(desc(representatives.createdAt))
      .limit(limit);

    // For now, return representatives with zero revenue until we have actual invoice data
    return result.map(rep => ({
      ...rep,
      revenue: "0",
    }));
  }

  async getMonthlyRevenue(): Promise<Array<{ month: string; revenue: number }>> {
    const result = await db
      .select({
        month: invoices.month,
        revenue: sql<number>`sum(${invoices.finalAmount})`,
      })
      .from(invoices)
      .where(eq(invoices.status, 'paid'))
      .groupBy(invoices.month)
      .orderBy(invoices.month);

    return result.map(row => ({
      month: row.month,
      revenue: Number(row.revenue) || 0,
    }));
  }
}

export const storage = new DatabaseStorage();
