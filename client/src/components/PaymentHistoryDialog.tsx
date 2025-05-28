import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPersianDate, formatPersianTime } from "@/lib/utils";
import { 
  History, 
  Search, 
  Calendar,
  CreditCard,
  DollarSign,
  Receipt,
  Download,
  Filter,
  X,
  Banknote,
  Clock
} from "lucide-react";
import type { Representative, Payment } from "@shared/schema";

interface PaymentHistoryDialogProps {
  representative: Representative;
  onClose: () => void;
}

export default function PaymentHistoryDialog({ representative, onClose }: PaymentHistoryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  // Get payments for this representative
  const { data: allPayments = [], isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const payments = allPayments.filter((payment: Payment) => 
    payment.representativeId === representative.id
  );

  // Filter payments
  const filteredPayments = payments.filter((payment: Payment) => {
    const matchesSearch = 
      payment.amount.toString().includes(searchTerm) ||
      payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      false;

    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const paymentDate = new Date(payment.paymentDate);
      const now = new Date();
      
      switch (dateFilter) {
        case "today":
          matchesDate = paymentDate.toDateString() === now.toDateString();
          break;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= weekAgo;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= monthAgo;
          break;
        case "year":
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          matchesDate = paymentDate >= yearAgo;
          break;
      }
    }

    return matchesSearch && matchesMethod && matchesDate;
  });

  const paymentMethods = [
    { value: "bank_transfer", label: "انتقال بانکی" },
    { value: "cash", label: "نقدی" },
    { value: "cheque", label: "چک" },
    { value: "card", label: "کارت به کارت" },
    { value: "online", label: "پرداخت آنلاین" },
    { value: "crypto", label: "ارز دیجیتال" },
  ];

  const getMethodLabel = (method: string) => {
    return paymentMethods.find(m => m.value === method)?.label || method;
  };

  const getMethodBadge = (method: string) => {
    const colors: { [key: string]: string } = {
      bank_transfer: "bg-blue-100 text-blue-800",
      cash: "bg-green-100 text-green-800",
      cheque: "bg-yellow-100 text-yellow-800",
      card: "bg-purple-100 text-purple-800",
      online: "bg-indigo-100 text-indigo-800",
      crypto: "bg-orange-100 text-orange-800",
    };

    return (
      <Badge className={colors[method] || "bg-gray-100 text-gray-800"}>
        {getMethodLabel(method)}
      </Badge>
    );
  };

  const exportPaymentHistory = () => {
    const data = filteredPayments.map(payment => ({
      'تاریخ': formatPersianDate(new Date(payment.paymentDate)),
      'مبلغ': payment.amount,
      'روش پرداخت': getMethodLabel(payment.paymentMethod),
      'شماره مرجع': payment.referenceNumber || 'ندارد',
      'توضیحات': payment.description || 'ندارد',
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment_history_${representative.username}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate summary
  const totalAmount = filteredPayments.reduce((sum: number, payment: Payment) => 
    sum + parseFloat(payment.amount), 0
  );

  const latestPayment = filteredPayments.length > 0 
    ? filteredPayments.sort((a: Payment, b: Payment) => 
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      )[0]
    : null;

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>در حال بارگذاری...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <History className="w-5 h-5 ml-2" />
              تاریخچه پرداخت‌ها
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Representative Info */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold ml-4">
                    {representative.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{representative.name}</h3>
                    <p className="text-sm text-gray-600">@{representative.username}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600">{filteredPayments.length}</p>
                    <p className="text-sm text-blue-800">تعداد پرداخت</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</p>
                    <p className="text-sm text-green-800">مجموع پرداخت</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-sm font-medium text-purple-600">
                      {latestPayment ? formatPersianDate(new Date(latestPayment.paymentDate)) : 'ندارد'}
                    </p>
                    <p className="text-sm text-purple-800">آخرین پرداخت</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card className="border border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">فیلتر و جستجو</h3>
                <Button variant="outline" size="sm" onClick={exportPaymentHistory}>
                  <Download className="w-4 h-4 ml-2" />
                  دانلود
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="جستجو در مبلغ، شماره مرجع..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="روش پرداخت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه روش‌ها</SelectItem>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method.value} value={method.value}>
                        {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="بازه زمانی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه زمان‌ها</SelectItem>
                    <SelectItem value="today">امروز</SelectItem>
                    <SelectItem value="week">هفته گذشته</SelectItem>
                    <SelectItem value="month">ماه گذشته</SelectItem>
                    <SelectItem value="year">سال گذشته</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center text-sm text-gray-600">
                  <Filter className="w-4 h-4 ml-2" />
                  {filteredPayments.length} پرداخت
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment List */}
          {filteredPayments.length > 0 ? (
            <div className="space-y-4">
              {filteredPayments
                .sort((a: Payment, b: Payment) => 
                  new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
                )
                .map((payment: Payment) => (
                  <Card key={payment.id} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-3 rounded-lg bg-green-100 ml-4">
                            <Banknote className="w-6 h-6 text-green-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 space-x-reverse mb-1">
                              <p className="text-xl font-bold text-gray-900">
                                {formatCurrency(payment.amount)} تومان
                              </p>
                              {getMethodBadge(payment.paymentMethod)}
                            </div>
                            <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 ml-1" />
                                {formatPersianDate(new Date(payment.paymentDate))}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 ml-1" />
                                {formatPersianTime(new Date(payment.paymentDate))}
                              </div>
                              {payment.referenceNumber && (
                                <div className="flex items-center">
                                  <Receipt className="w-4 h-4 ml-1" />
                                  {payment.referenceNumber}
                                </div>
                              )}
                            </div>
                            {payment.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                {payment.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-left">
                          <p className="text-sm text-gray-500">شناسه پرداخت</p>
                          <p className="font-mono text-sm">{payment.id}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card className="border border-gray-200">
              <CardContent className="p-12 text-center">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm || methodFilter !== "all" || dateFilter !== "all"
                    ? "هیچ پرداختی یافت نشد"
                    : "هنوز پرداختی ثبت نشده"}
                </h3>
                <p className="text-gray-600">
                  {searchTerm || methodFilter !== "all" || dateFilter !== "all"
                    ? "فیلترهای مختلفی را امتحان کنید"
                    : "پرداخت‌های ثبت شده در این قسمت نمایش داده می‌شوند"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}