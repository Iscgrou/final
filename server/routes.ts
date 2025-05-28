import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRepresentativeSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard routes
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/top-representatives", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const topReps = await storage.getTopRepresentatives(limit);
      res.json(topReps);
    } catch (error) {
      console.error("Error fetching top representatives:", error);
      res.status(500).json({ error: "Failed to fetch top representatives" });
    }
  });

  app.get("/api/dashboard/monthly-revenue", async (req, res) => {
    try {
      const monthlyRevenue = await storage.getMonthlyRevenue();
      res.json(monthlyRevenue);
    } catch (error) {
      console.error("Error fetching monthly revenue:", error);
      res.status(500).json({ error: "Failed to fetch monthly revenue" });
    }
  });

  // Representatives routes
  app.get("/api/representatives", async (req, res) => {
    try {
      const representatives = await storage.getRepresentatives();
      res.json(representatives);
    } catch (error) {
      console.error("Error fetching representatives:", error);
      res.status(500).json({ error: "Failed to fetch representatives" });
    }
  });

  app.get("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const representative = await storage.getRepresentative(id);
      if (!representative) {
        return res.status(404).json({ error: "Representative not found" });
      }
      res.json(representative);
    } catch (error) {
      console.error("Error fetching representative:", error);
      res.status(500).json({ error: "Failed to fetch representative" });
    }
  });

  app.post("/api/representatives", async (req, res) => {
    try {
      const validatedData = insertRepresentativeSchema.parse(req.body);
      const representative = await storage.createRepresentative(validatedData);
      res.status(201).json(representative);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating representative:", error);
      res.status(500).json({ error: "Failed to create representative" });
    }
  });

  app.put("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRepresentativeSchema.partial().parse(req.body);
      const representative = await storage.updateRepresentative(id, validatedData);
      res.json(representative);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error updating representative:", error);
      res.status(500).json({ error: "Failed to update representative" });
    }
  });

  app.delete("/api/representatives/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRepresentative(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting representative:", error);
      res.status(500).json({ error: "Failed to delete representative" });
    }
  });

  // Invoices routes
  app.get("/api/invoices", async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ error: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/representative/:repId", async (req, res) => {
    try {
      const repId = parseInt(req.params.repId);
      const invoices = await storage.getInvoicesByRepresentative(repId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching representative invoices:", error);
      res.status(500).json({ error: "Failed to fetch representative invoices" });
    }
  });

  // Payments routes
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/representative/:repId", async (req, res) => {
    try {
      const repId = parseInt(req.params.repId);
      const payments = await storage.getPaymentsByRepresentative(repId);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching representative payments:", error);
      res.status(500).json({ error: "Failed to fetch representative payments" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(validatedData);
      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation error", details: error.errors });
      }
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  });

  // Billing data routes
  app.get("/api/billing-data", async (req, res) => {
    try {
      const month = req.query.month as string;
      const billingData = await storage.getBillingData(month);
      res.json(billingData);
    } catch (error) {
      console.error("Error fetching billing data:", error);
      res.status(500).json({ error: "Failed to fetch billing data" });
    }
  });

  app.post("/api/billing-data", async (req, res) => {
    try {
      const billingDataArray = req.body;
      if (!Array.isArray(billingDataArray)) {
        return res.status(400).json({ error: "Expected array of billing data" });
      }

      const savedData = await storage.createBillingData(billingDataArray);
      res.status(201).json(savedData);
    } catch (error) {
      console.error("Error creating billing data:", error);
      res.status(500).json({ error: "Failed to create billing data" });
    }
  });

  // Settings routes
  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSetting(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }
      res.json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const { key, value } = req.body;
      if (!key || !value) {
        return res.status(400).json({ error: "Key and value are required" });
      }
      const setting = await storage.setSetting(key, value);
      res.json(setting);
    } catch (error) {
      console.error("Error setting value:", error);
      res.status(500).json({ error: "Failed to set value" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
