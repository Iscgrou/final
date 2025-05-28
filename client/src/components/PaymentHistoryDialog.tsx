import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatPersianDate } from "@/lib/utils";
import { 
  X, 
  History, 
  Search, 
  Filter, 
  DollarSign, 
  Calendar, 
  CreditCard,
  Banknote,
  Smartphone,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { type Representative, type Payment } from "@shared/schema";

interface PaymentHistoryDialogProps {
  representative: Representative;
  onClose: () => void;
}

export default function PaymentHistoryDialog({ representative, onClose }: PaymentHistoryDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Get all payments
  const { data: allPayments = [], isLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  // Filter payments for this representative
  const payments = allPayments.filter((payment: Payment) => 
    payment.representativeId === representative.id
  ) as Payment[];

  // Apply filters
  const filteredPayments = payments.filter((payment: Payment) => {
    const matchesSearch = !searchTerm || 
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatCurrency(payment.amount).includes(searchTerm);
    
    const matchesMethod = methodFilter === "all" || payment.paymentMethod === methodFilter;
    
    return matchesSearch && matchesMethod;
  });

  // Apply sorting
  const sortedPayments = filteredPayments.sort((a: Payment, b: Payment) => 
    sortOrder === "desc" 
      ? new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
      : new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  );

  // Calculate totals
  const totalAmount = filteredPayments.reduce((sum: number, payment: Payment) => 
    sum + payment.amount, 0
  );

  const paymentMethods = [
    { value: "all", label: "همه روش‌ها", icon: DollarSign },
    { value: "cash", label: "نقدی", icon: Banknote },
    { value: "card", label: "کارت بانکی", icon: CreditCard },
    { value: "transfer", label: "انتقال بانکی", icon: Smartphone },
    { value: "crypto", label: "ارز دیجیتال", icon: DollarSign },
  ];

  const getPaymentMethodLabel = (method: string) => {
    const found = paymentMethods.find(m => m.value === method);
    return found ? found.label : method;
  };

  const getPaymentMethodIcon = (method: string) => {
    const found = paymentMethods.find(m => m.value === method);
    return found ? found.icon : DollarSign;
  };

  if (isLoading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <History className="w-5 h-5 ml-2" />
              تاریخچه پرداخت‌ها - {representative.name}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">کل پرداخت‌ها</p>
                    <p className="text-2xl font-bold text-blue-900">{payments.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <History className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">مجموع مبلغ</p>
                    <p className="text-lg font-bold text-green-900">
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600">متوسط پرداخت</p>
                    <p className="text-lg font-bold text-orange-900">
                      {payments.length > 0 ? formatCurrency(totalAmount / payments.length) : "0"}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <Filter className="w-4 h-4 ml-2" />
                فیلتر و جستجو
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">جستجو</label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      placeholder="جستجو در توضیحات یا مبلغ..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">روش پرداخت</label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <SelectItem key={method.value} value={method.value}>
                            <div className="flex items-center">
                              <Icon className="w-4 h-4 ml-2" />
                              {method.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">مرتب‌سازی</label>
                  <Select value={sortOrder} onValueChange={(value: "asc" | "desc") => setSortOrder(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">
                        <div className="flex items-center">
                          <TrendingDown className="w-4 h-4 ml-2" />
                          جدیدترین
                        </div>
                      </SelectItem>
                      <SelectItem value="asc">
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 ml-2" />
                          قدیمی‌ترین
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments List */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                تاریخچه پرداخت‌ها ({sortedPayments.length} مورد)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedPayments.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">هیچ پرداختی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedPayments.map((payment: Payment) => {
                    const PaymentIcon = getPaymentMethodIcon(payment.paymentMethod);
                    return (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4 space-x-reverse">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <PaymentIcon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {formatCurrency(payment.amount)} تومان
                            </p>
                            <div className="flex items-center space-x-4 space-x-reverse text-sm text-gray-600">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 ml-1" />
                                {formatPersianDate(payment.paymentDate)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getPaymentMethodLabel(payment.paymentMethod)}
                              </Badge>
                            </div>
                            {payment.description && (
                              <p className="text-sm text-gray-500 mt-1">
                                {payment.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-left">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            پرداخت شده
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}