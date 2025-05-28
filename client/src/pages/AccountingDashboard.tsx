import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatPersianDate, formatPersianTime } from "@/lib/utils";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  Search,
  Filter,
  Eye,
  Plus,
  Download,
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote
} from "lucide-react";
import PaymentDialog from "@/components/PaymentDialog";
import PaymentHistoryDialog from "@/components/PaymentHistoryDialog";
import type { Representative, Invoice, Payment } from "@shared/schema";

interface AccountingSummary {
  representative: Representative;
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  status: 'creditor' | 'debtor' | 'balanced';
  lastPayment?: Date;
  oldestUnpaid?: Date;
}

export default function AccountingDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const { toast } = useToast();

  // Get representatives
  const { data: representatives = [], isLoading: repsLoading } = useQuery({
    queryKey: ["/api/representatives"],
  });

  // Get invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Get payments
  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  // Calculate accounting summary for each representative
  const accountingSummary: AccountingSummary[] = representatives.map((rep: Representative) => {
    const repInvoices = invoices.filter((inv: Invoice) => inv.representativeId === rep.id);
    const repPayments = payments.filter((pay: Payment) => pay.representativeId === rep.id);
    
    const totalInvoiced = repInvoices.reduce((sum: number, inv: Invoice) => 
      sum + parseFloat(inv.finalAmount), 0
    );
    
    const totalPaid = repPayments.reduce((sum: number, pay: Payment) => 
      sum + parseFloat(pay.amount), 0
    );
    
    const outstanding = totalInvoiced - totalPaid;
    
    const lastPayment = repPayments.length > 0 
      ? new Date(Math.max(...repPayments.map((p: Payment) => new Date(p.paymentDate).getTime())))
      : undefined;
    
    const unpaidInvoices = repInvoices.filter((inv: Invoice) => inv.status === 'pending');
    const oldestUnpaid = unpaidInvoices.length > 0
      ? new Date(Math.min(...unpaidInvoices.map((inv: Invoice) => new Date(inv.createdAt).getTime())))
      : undefined;

    let status: 'creditor' | 'debtor' | 'balanced' = 'balanced';
    if (outstanding > 0) status = 'debtor';
    else if (outstanding < 0) status = 'creditor';

    return {
      representative: rep,
      totalInvoices: repInvoices.length,
      totalInvoiced,
      totalPaid,
      outstanding,
      status,
      lastPayment,
      oldestUnpaid,
    };
  });

  // Filter summaries
  const filteredSummaries = accountingSummary.filter(summary => {
    const matchesSearch = summary.representative.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         summary.representative.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "debtor" && summary.status === "debtor") ||
                         (statusFilter === "creditor" && summary.status === "creditor") ||
                         (statusFilter === "balanced" && summary.status === "balanced") ||
                         (statusFilter === "overdue" && summary.oldestUnpaid && 
                          new Date().getTime() - summary.oldestUnpaid.getTime() > 30 * 24 * 60 * 60 * 1000);
    
    return matchesSearch && matchesStatus;
  });

  const handleAddPayment = (rep: Representative) => {
    setSelectedRep(rep);
    setShowPaymentDialog(true);
  };

  const handleViewHistory = (rep: Representative) => {
    setSelectedRep(rep);
    setShowHistoryDialog(true);
  };

  const getStatusBadge = (status: 'creditor' | 'debtor' | 'balanced', amount: number) => {
    if (status === 'creditor') {
      return <Badge variant="default" className="bg-green-100 text-green-800">بستانکار ({formatCurrency(Math.abs(amount))})</Badge>;
    } else if (status === 'debtor') {
      return <Badge variant="destructive">بدهکار ({formatCurrency(amount)})</Badge>;
    } else {
      return <Badge variant="secondary">متعادل</Badge>;
    }
  };

  const exportAccountingReport = () => {
    const data = filteredSummaries.map(summary => ({
      'نام': summary.representative.name,
      'نام کاربری': summary.representative.username,
      'تعداد فاکتور': summary.totalInvoices,
      'مجموع صورتحساب': summary.totalInvoiced,
      'مجموع پرداخت': summary.totalPaid,
      'مانده': summary.outstanding,
      'وضعیت': summary.status === 'debtor' ? 'بدهکار' : 
                summary.status === 'creditor' ? 'بستانکار' : 'متعادل',
      'آخرین پرداخت': summary.lastPayment ? formatPersianDate(summary.lastPayment) : 'ندارد',
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `accounting_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "موفقیت",
      description: "گزارش حسابداری دانلود شد",
    });
  };

  if (repsLoading || invoicesLoading || paymentsLoading) {
    return (
      <main className="flex-1 p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  // Calculate overall statistics
  const totalOutstanding = filteredSummaries.reduce((sum, s) => sum + Math.max(0, s.outstanding), 0);
  const totalOverpaid = filteredSummaries.reduce((sum, s) => sum + Math.abs(Math.min(0, s.outstanding)), 0);
  const debtorCount = filteredSummaries.filter(s => s.status === 'debtor').length;
  const creditorCount = filteredSummaries.filter(s => s.status === 'creditor').length;

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">حسابداری و پرداخت</h2>
        <p className="text-gray-600">
          مدیریت پرداخت‌ها و وضعیت مالی نمایندگان
        </p>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalOutstanding)}</p>
                <p className="text-sm text-gray-600">مجموع طلب (تومان)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalOverpaid)}</p>
                <p className="text-sm text-gray-600">مجموع اضافه پرداخت (تومان)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{debtorCount}</p>
                <p className="text-sm text-gray-600">تعداد بدهکاران</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{creditorCount}</p>
                <p className="text-sm text-gray-600">تعداد بستانکاران</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="border border-gray-200 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calculator className="w-5 h-5 ml-2" />
              فهرست حسابداری ({filteredSummaries.length})
            </div>
            <Button variant="outline" onClick={exportAccountingReport}>
              <Download className="w-4 h-4 ml-2" />
              خروجی گزارش
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="جستجو در نام یا نام کاربری..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="فیلتر وضعیت مالی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="debtor">بدهکاران</SelectItem>
                <SelectItem value="creditor">بستانکاران</SelectItem>
                <SelectItem value="balanced">متعادل</SelectItem>
                <SelectItem value="overdue">معوق (بیش از ۳۰ روز)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="w-4 h-4 ml-2" />
              {filteredSummaries.length} نتیجه یافت شد
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounting Table */}
      <Card className="border border-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-900">نماینده</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">فاکتورها</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">مجموع صورتحساب</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">پرداخت شده</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">وضعیت مالی</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">آخرین پرداخت</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-900">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredSummaries.map((summary) => (
                  <tr key={summary.representative.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{summary.representative.name}</p>
                        <p className="text-sm text-gray-600">@{summary.representative.username}</p>
                        {summary.oldestUnpaid && (
                          <p className="text-xs text-orange-600">
                            قدیمی‌ترین معوق: {formatPersianDate(summary.oldestUnpaid)}
                          </p>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-gray-400 ml-1" />
                        <span className="font-mono">{summary.totalInvoices}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-gray-900">
                        {formatCurrency(summary.totalInvoiced)} تومان
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <span className="font-mono text-green-600">
                        {formatCurrency(summary.totalPaid)} تومان
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(summary.status, summary.outstanding)}
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      {summary.lastPayment ? (
                        <div className="text-sm">
                          <p className="text-gray-900">{formatPersianDate(summary.lastPayment)}</p>
                          <p className="text-gray-500">{formatPersianTime(summary.lastPayment)}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400">بدون پرداخت</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2 space-x-reverse">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddPayment(summary.representative)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewHistory(summary.representative)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredSummaries.length === 0 && (
        <Card className="border border-gray-200 mt-8">
          <CardContent className="p-12 text-center">
            <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              هیچ نتیجه‌ای یافت نشد
            </h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== "all"
                ? "تغییر فیلترها را امتحان کنید"
                : "هنوز هیچ تراکنش مالی ثبت نشده است"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && selectedRep && (
        <PaymentDialog
          representative={selectedRep}
          onClose={() => setShowPaymentDialog(false)}
        />
      )}

      {/* Payment History Dialog */}
      {showHistoryDialog && selectedRep && (
        <PaymentHistoryDialog
          representative={selectedRep}
          onClose={() => setShowHistoryDialog(false)}
        />
      )}
    </main>
  );
}