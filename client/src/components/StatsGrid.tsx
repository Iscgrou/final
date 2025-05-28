import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Users, AlertTriangle, TrendingUp, FileText } from "lucide-react";

interface StatsGridProps {
  stats?: {
    totalReps: number;
    outstandingBalance: string;
    monthlyRevenue: string;
    pendingInvoices: number;
  };
  isLoading: boolean;
}

export default function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-lg" />
              </div>
              <Skeleton className="h-4 w-32 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "کل نمایندگان",
      value: formatCurrency(stats.totalReps),
      icon: Users,
      iconColor: "text-primary",
      bgColor: "bg-blue-100",
      change: "۱۲% نسبت به ماه قبل",
      changeColor: "text-secondary",
    },
    {
      title: "مانده طلب",
      value: formatCurrency(stats.outstandingBalance),
      suffix: "تومان",
      icon: AlertTriangle,
      iconColor: "text-accent",
      bgColor: "bg-orange-100",
      change: "",
      changeColor: "text-gray-600",
    },
    {
      title: "درآمد ماهانه",
      value: formatCurrency(stats.monthlyRevenue),
      suffix: "تومان",
      icon: TrendingUp,
      iconColor: "text-secondary",
      bgColor: "bg-green-100",
      change: "۸% نسبت به ماه قبل",
      changeColor: "text-secondary",
    },
    {
      title: "فاکتورهای معوق",
      value: formatCurrency(stats.pendingInvoices),
      icon: FileText,
      iconColor: "text-destructive",
      bgColor: "bg-red-100",
      change: "نیاز به پیگیری",
      changeColor: "text-destructive",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                {stat.suffix && (
                  <p className="text-sm text-gray-600 mt-1">{stat.suffix}</p>
                )}
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            {stat.change && (
              <div className="mt-4 flex items-center">
                <span className={`text-sm ${stat.changeColor}`}>
                  {stat.change}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
