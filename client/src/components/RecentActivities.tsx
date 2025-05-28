import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, Upload, UserPen, FileText, DollarSign } from "lucide-react";

export default function RecentActivities() {
  // Mock recent activities - in real app, this would come from API
  const activities = [
    {
      id: 1,
      type: "invoice_generated",
      description: "فاکتور برای محمد احمدی تولید شد",
      time: "۱۰ دقیقه پیش",
      icon: Check,
      iconColor: "text-secondary",
      bgColor: "bg-green-100",
    },
    {
      id: 2,
      type: "file_uploaded",
      description: "فایل اکسل جدید وارد شد",
      time: "۳۰ دقیقه پیش",
      icon: Upload,
      iconColor: "text-primary",
      bgColor: "bg-blue-100",
    },
    {
      id: 3,
      type: "user_updated",
      description: "اطلاعات علی کریمی به‌روزرسانی شد",
      time: "۱ ساعت پیش",
      icon: UserPen,
      iconColor: "text-accent",
      bgColor: "bg-orange-100",
    },
    {
      id: 4,
      type: "payment_received",
      description: "پرداخت از فاطمه رضایی دریافت شد",
      time: "۲ ساعت پیش",
      icon: DollarSign,
      iconColor: "text-secondary",
      bgColor: "bg-green-100",
    },
    {
      id: 5,
      type: "invoice_sent",
      description: "فاکتور برای حسین محمدی ارسال شد",
      time: "۳ ساعت پیش",
      icon: FileText,
      iconColor: "text-primary",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            فعالیت‌های اخیر
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            مشاهده همه
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 space-x-reverse">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.bgColor}`}>
                <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">{activity.description}</p>
                <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
