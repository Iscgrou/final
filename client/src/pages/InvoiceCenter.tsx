import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatPersianDate, generateInvoiceNumber } from "@/lib/utils";
import { 
  Receipt, 
  Search, 
  Filter,
  Eye,
  Download,
  Send,
  Edit,
  Trash2,
  FileText,
  Calendar,
  DollarSign,
  User,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus
} from "lucide-react";
import InvoicePreview from "@/components/InvoicePreview";
import type { Representative, Invoice, InvoiceItem } from "@shared/schema";

export default function InvoiceCenter() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Get invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Get representatives
  const { data: representatives = [], isLoading: repsLoading } = useQuery({
    queryKey: ["/api/representatives"],
  });

  const isLoading = invoicesLoading || repsLoading;

  // Filter invoices
  const filteredInvoices = invoices.filter((invoice: Invoice) => {
    const rep = representatives.find((r: Representative) => r.id === invoice.representativeId);
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rep?.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    const matchesMonth = monthFilter === "all" || invoice.month === monthFilter;
    
    return matchesSearch && matchesStatus && matchesMonth;
  });

  // Update invoice status
  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "موفقیت",
        description: "وضعیت فاکتور بروزرسانی شد",
      });
    },
  });

  const handlePreview = (invoice: Invoice) => {
    const rep = representatives.find((r: Representative) => r.id === invoice.representativeId);
    if (rep) {
      setSelectedInvoice({
        ...invoice,
        representativeName: rep.name,
        username: rep.username,
      } as any);
      setShowPreview(true);
    }
  };

  const handleStatusChange = (invoiceId: number, newStatus: string) => {
    updateInvoiceMutation.mutate({ id: invoiceId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="destructive">در انتظار پرداخت</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">پرداخت شده</Badge>;
      case 'overdue':
        return <Badge variant="destructive">معوق</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">لغو شده</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const downloadInvoice = (invoice: Invoice) => {
    const rep = representatives.find((r: Representative) => r.id === invoice.representativeId);
    if (!rep) return;

    // Create invoice data for PDF generation
    const invoiceData = {
      representativeId: invoice.representativeId,
      representativeName: rep.name,
      username: rep.username,
      dataUsageGb: 0, // This would come from invoice items
      pricePerGb: parseFloat(invoice.totalAmount) / Math.max(1, 0), // Calculate from total
      discountPercent: 0,
      totalAmount: parseFloat(invoice.totalAmount),
      finalAmount: parseFloat(invoice.finalAmount),
      month: invoice.month,
    };

    // Trigger download (this would typically generate PDF)
    toast({
      title: "دانلود آغاز شد",
      description: `فاکتور ${invoice.invoiceNumber} در حال دانلود است`,
    });
  };

  // Get unique months for filter
  const uniqueMonths = [...new Set(invoices.map((inv: Invoice) => inv.month))].sort().reverse();

  if (isLoading) {
    return (
      <main className="flex-1 p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </main>
    );
  }

  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter((inv: Invoice) => inv.status === 'paid').length;
  const pendingInvoices = filteredInvoices.filter((inv: Invoice) => inv.status === 'pending').length;
  const totalAmount = filteredInvoices.reduce((sum: number, inv: Invoice) => sum + parseFloat(inv.finalAmount), 0);

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">مرکز فاکتورها</h2>
        <p className="text-gray-600">
          مدیریت و پیگیری کلیه فاکتورهای صادر شده
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <Receipt className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{totalInvoices}</p>
                <p className="text-sm text-gray-600">مجموع فاکتورها</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{paidInvoices}</p>
                <p className="text-sm text-gray-600">پرداخت شده</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{pendingInvoices}</p>
                <p className="text-sm text-gray-600">در انتظار پرداخت</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-lg font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
                <p className="text-sm text-gray-600">مجموع ارزش (تومان)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border border-gray-200 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              فهرست فاکتورها ({filteredInvoices.length})
            </div>
            <Button>
              <Plus className="w-4 h-4 ml-2" />
              فاکتور جدید
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="جستجو در شماره فاکتور یا نام..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="وضعیت فاکتور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار پرداخت</SelectItem>
                <SelectItem value="paid">پرداخت شده</SelectItem>
                <SelectItem value="overdue">معوق</SelectItem>
                <SelectItem value="cancelled">لغو شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ماه صدور" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه ماه‌ها</SelectItem>
                {uniqueMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 ml-2" />
              {filteredInvoices.length} فاکتور یافت شد
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices List */}
      <div className="space-y-4">
        {filteredInvoices.map((invoice: Invoice) => {
          const rep = representatives.find((r: Representative) => r.id === invoice.representativeId);
          return (
            <Card key={invoice.id} className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 rounded-lg bg-blue-100 ml-4">
                      <Receipt className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 space-x-reverse mb-2">
                        <p className="font-bold text-gray-900">{invoice.invoiceNumber}</p>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <User className="w-4 h-4 ml-1" />
                          {rep?.name || 'نامشخص'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 ml-1" />
                          {formatPersianDate(new Date(invoice.createdAt))}
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 ml-1" />
                          {formatCurrency(invoice.finalAmount)} تومان
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 ml-1" />
                          {invoice.month}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreview(invoice)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadInvoice(invoice)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>

                    <Select
                      value={invoice.status}
                      onValueChange={(value) => handleStatusChange(invoice.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">در انتظار</SelectItem>
                        <SelectItem value="paid">پرداخت شده</SelectItem>
                        <SelectItem value="overdue">معوق</SelectItem>
                        <SelectItem value="cancelled">لغو شده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredInvoices.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              هیچ فاکتوری یافت نشد
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all" || monthFilter !== "all"
                ? "فیلترهای مختلفی را امتحان کنید"
                : "هنوز هیچ فاکتوری صادر نشده است"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Invoice Preview */}
      {showPreview && selectedInvoice && (
        <InvoicePreview
          invoice={selectedInvoice as any}
          onClose={() => setShowPreview(false)}
        />
      )}
    </main>
  );
}