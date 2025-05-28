import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Representatives from "@/pages/Representatives";
import ExcelImport from "@/pages/ExcelImport";
import InvoiceGenerator from "@/pages/InvoiceGenerator";
import InvoiceCenter from "@/pages/InvoiceCenter";
import TelegramManager from "@/pages/TelegramManager";
import AccountingDashboard from "@/pages/AccountingDashboard";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/representatives" component={Representatives} />
      <Route path="/excel-import" component={ExcelImport} />
      <Route path="/invoice-generator" component={InvoiceGenerator} />
      <Route path="/invoice-center" component={InvoiceCenter} />
      <Route path="/telegram" component={TelegramManager} />
      <Route path="/accounting" component={AccountingDashboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div dir="rtl" className="min-h-screen bg-background font-sans">
          <Layout>
            <Router />
          </Layout>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
