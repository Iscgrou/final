import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPersianDate, calculatePercentageChange } from "@/lib/utils";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
  Filter,
  DollarSign,
  Users,
  Receipt,
  Target,
  Zap,
  Award,
  Clock,
  AlertTriangle
} from "lucide-react";
import type { Representative, Invoice, Payment, BillingData } from "@shared/schema";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState<string>("6months");
  const [selectedMetric, setSelectedMetric] = useState<string>("revenue");

  // Get all data
  const { data: representatives = [], isLoading: repsLoading } = useQuery({
    queryKey: ["/api/representatives"],
  });

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments"],
  });

  const { data: billingData = [], isLoading: billingLoading } = useQuery({
    queryKey: ["/api/billing-data"],
  });

  const isLoading = repsLoading || invoicesLoading || paymentsLoading || billingLoading;

  // Calculate analytics
  const calculateAnalytics = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Revenue by month (last 12 months)
    const revenueByMonth = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const monthInvoices = invoices.filter((inv: Invoice) => 
        inv.month === monthKey
      );
      
      const revenue = monthInvoices.reduce((sum: number, inv: Invoice) => 
        sum + parseFloat(inv.finalAmount), 0
      );

      revenueByMonth.push({
        month: date.toLocaleDateString('fa-IR', { month: 'short', year: 'numeric' }),
        revenue,
        invoices: monthInvoices.length
      });
    }

    // Payment collection rate by month
    const collectionByMonth = revenueByMonth.map(item => {
      const monthPayments = payments.filter((pay: Payment) => {
        const payDate = new Date(pay.paymentDate);
        return payDate.getMonth() === (revenueByMonth.indexOf(item) + currentMonth - 11) % 12;
      });
      
      const collected = monthPayments.reduce((sum: number, pay: Payment) => 
        sum + parseFloat(pay.amount), 0
      );

      return {
        ...item,
        collected,
        collectionRate: item.revenue > 0 ? (collected / item.revenue) * 100 : 0
      };
    });

    // Representative performance
    const repPerformance = representatives.map((rep: Representative) => {
      const repInvoices = invoices.filter((inv: Invoice) => inv.representativeId === rep.id);
      const repPayments = payments.filter((pay: Payment) => pay.representativeId === rep.id);
      const repBilling = billingData.filter((bill: BillingData) => bill.adminUsername === rep.username);

      const totalRevenue = repInvoices.reduce((sum: number, inv: Invoice) => 
        sum + parseFloat(inv.finalAmount), 0
      );
      
      const totalPaid = repPayments.reduce((sum: number, pay: Payment) => 
        sum + parseFloat(pay.amount), 0
      );

      const totalUsage = repBilling.reduce((sum: number, bill: BillingData) => 
        sum + parseFloat(bill.dataUsageGb), 0
      );

      return {
        id: rep.id,
        name: rep.name,
        username: rep.username,
        revenue: totalRevenue,
        paid: totalPaid,
        outstanding: totalRevenue - totalPaid,
        usage: totalUsage,
        invoices: repInvoices.length,
        paymentRate: totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Usage analytics
    const usageByMonth = revenueByMonth.map((item, index) => {
      const monthUsage = billingData.filter((bill: BillingData) => {
        const billMonth = bill.month;
        const targetDate = new Date(currentYear, currentMonth - 11 + index, 1);
        const targetMonth = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
        return billMonth === targetMonth;
      });

      const totalUsage = monthUsage.reduce((sum: number, bill: BillingData) => 
        sum + parseFloat(bill.dataUsageGb), 0
      );

      return {
        ...item,
        usage: totalUsage,
        avgUsagePerUser: monthUsage.length > 0 ? totalUsage / monthUsage.length : 0
      };
    });

    // Payment method distribution
    const paymentMethods: { [key: string]: number } = {};
    payments.forEach((payment: Payment) => {
      paymentMethods[payment.paymentMethod] = (paymentMethods[payment.paymentMethod] || 0) + parseFloat(payment.amount);
    });

    const paymentMethodData = Object.entries(paymentMethods).map(([method, amount]) => ({
      method: getMethodLabel(method),
      amount,
      percentage: (amount / Object.values(paymentMethods).reduce((a, b) => a + b, 0)) * 100
    }));

    return {
      revenueByMonth,
      collectionByMonth,
      repPerformance,
      usageByMonth,
      paymentMethodData
    };
  };

  const getMethodLabel = (method: string) => {
    const labels: { [key: string]: string } = {
      bank_transfer: "انتقال بانکی",
      cash: "نقدی",
      cheque: "چک",
      card: "کارت به کارت",
      online: "آنلاین",
      crypto: "ارز دیجیتال"
    };
    return labels[method] || method;
  };

  const analytics = !isLoading ? calculateAnalytics() : null;

  // KPI calculations
  const totalRevenue = analytics?.revenueByMonth.reduce((sum, item) => sum + item.revenue, 0) || 0;
  const totalCollected = analytics?.collectionByMonth.reduce((sum, item) => sum + item.collected, 0) || 0;
  const overallCollectionRate = totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0;
  const avgMonthlyRevenue = analytics?.revenueByMonth.length > 0 ? totalRevenue / analytics.revenueByMonth.length : 0;
  const totalUsage = analytics?.usageByMonth.reduce((sum, item) => sum + item.usage, 0) || 0;

  const exportAnalytics = () => {
    if (!analytics) return;

    const data = {
      'خلاصه عملکرد': {
        'مجموع درآمد': formatCurrency(totalRevenue),
        'درآمد ماهانه میانگین': formatCurrency(avgMonthlyRevenue),
        'نرخ وصولی': `${overallCollectionRate.toFixed(1)}%`,
        'مجموع مصرف': `${totalUsage.toFixed(1)} گیگابایت`
      },
      'درآمد ماهانه': analytics.revenueByMonth,
      'عملکرد نمایندگان': analytics.repPerformance.slice(0, 10),
      'توزیع روش پرداخت': analytics.paymentMethodData
    };

    const jsonContent = "data:application/json;charset=utf-8," + JSON.stringify(data, null, 2);
    const encodedUri = encodeURI(jsonContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `analytics_report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (isLoading) {
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

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تحلیل و گزارش‌گیری</h2>
            <p className="text-gray-600">
              آمار جامع و تحلیل عملکرد سیستم
            </p>
          </div>
          
          <div className="flex items-center space-x-4 space-x-reverse">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="بازه زمانی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">3 ماه گذشته</SelectItem>
                <SelectItem value="6months">6 ماه گذشته</SelectItem>
                <SelectItem value="12months">12 ماه گذشته</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={exportAnalytics}>
              <Download className="w-4 h-4 ml-2" />
              دانلود گزارش
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
                <p className="text-sm text-gray-600">مجموع درآمد (تومان)</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                  <span className="text-sm text-green-600">
                    میانگین: {formatCurrency(avgMonthlyRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{overallCollectionRate.toFixed(1)}%</p>
                <p className="text-sm text-gray-600">نرخ وصولی</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">
                    وصول شده: {formatCurrency(totalCollected)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{representatives.length}</p>
                <p className="text-sm text-gray-600">تعداد نمایندگان فعال</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">
                    فاکتور: {invoices.length}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{totalUsage.toFixed(1)} GB</p>
                <p className="text-sm text-gray-600">مجموع مصرف داده</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm text-gray-600">
                    میانگین: {(totalUsage / Math.max(representatives.length, 1)).toFixed(1)} GB
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Trend */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 ml-2" />
              روند درآمد ماهانه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics?.revenueByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value) + " تومان", "درآمد"]}
                    labelStyle={{ fontFamily: 'Vazir' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Collection Rate */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 ml-2" />
              نرخ وصولی ماهانه
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.collectionByMonth || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "نرخ وصولی"]}
                    labelStyle={{ fontFamily: 'Vazir' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="collectionRate" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Representatives */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 ml-2" />
              برترین نمایندگان
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics?.repPerformance.slice(0, 8).map((rep, index) => (
                <div key={rep.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ml-3 ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{rep.name}</p>
                      <p className="text-sm text-gray-600">@{rep.username}</p>
                    </div>
                  </div>
                  
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{formatCurrency(rep.revenue)}</p>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <Badge variant={rep.paymentRate >= 80 ? "default" : "destructive"} className="text-xs">
                        {rep.paymentRate.toFixed(0)}% وصولی
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="w-5 h-5 ml-2" />
              توزیع روش‌های پرداخت
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics?.paymentMethodData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="amount"
                  >
                    {analytics?.paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value) + " تومان", "مبلغ"]}
                    labelStyle={{ fontFamily: 'Vazir' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 space-y-2">
              {analytics?.paymentMethodData.map((item, index) => (
                <div key={item.method} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full ml-2"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-700">{item.method}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}