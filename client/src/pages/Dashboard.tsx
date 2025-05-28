import { useQuery } from "@tanstack/react-query";
import StatsGrid from "@/components/StatsGrid";
import RevenueChart from "@/components/RevenueChart";
import TopRepresentatives from "@/components/TopRepresentatives";
import ActionCenter from "@/components/ActionCenter";
import RecentActivities from "@/components/RecentActivities";
import SystemAlerts from "@/components/SystemAlerts";
import { formatPersianDate, formatPersianTime } from "@/lib/utils";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: topReps, isLoading: topRepsLoading } = useQuery({
    queryKey: ["/api/dashboard/top-representatives"],
  });

  const { data: monthlyRevenue, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/dashboard/monthly-revenue"],
  });

  const currentDate = new Date();

  return (
    <main className="flex-1 p-6">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">داشبورد مدیریت</h2>
        <p className="text-gray-600">
          آخرین به‌روزرسانی: {formatPersianDate(currentDate)} - {formatPersianTime(currentDate)}
        </p>
      </div>

      {/* Quick Stats Cards */}
      <StatsGrid stats={stats} isLoading={statsLoading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <RevenueChart data={monthlyRevenue} isLoading={revenueLoading} />

        {/* Top Representatives */}
        <TopRepresentatives data={topReps} isLoading={topRepsLoading} />
      </div>

      {/* Action Center */}
      <ActionCenter />

      {/* Recent Activities and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentActivities />
        <SystemAlerts />
      </div>
    </main>
  );
}
