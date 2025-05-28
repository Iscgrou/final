import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Wifi, CloudUpload, Clock } from "lucide-react";

export default function SystemAlerts() {
  // Mock system alerts - in real app, this would come from API
  const alerts = [
    {
      id: 1,
      type: "overdue_invoices",
      title: "فاکتورهای معوق",
      description: "۴۳ فاکتور بیش از ۳۰ روز معوق است",
      severity: "error",
      icon: AlertTriangle,
      iconColor: "text-destructive",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      actionText: "مشاهده جزئیات",
      onClick: () => console.log("View overdue invoices"),
    },
    {
      id: 2,
      type: "missing_telegram",
      title: "نمایندگان بدون تلگرام",
      description: "۱۲ نماینده فاقد شناسه تلگرام هستند",
      severity: "warning",
      icon: Wifi,
      iconColor: "text-accent",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      actionText: "اضافه کردن شناسه",
      onClick: () => console.log("Add Telegram IDs"),
    },
    {
      id: 3,
      type: "backup_needed",
      title: "پشتیبان‌گیری خودکار",
      description: "آخرین پشتیبان‌گیری ۲ روز پیش انجام شده",
      severity: "info",
      icon: CloudUpload,
      iconColor: "text-primary",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      actionText: "ایجاد پشتیبان",
      onClick: () => console.log("Create backup"),
    },
  ];

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "error":
        return "destructive";
      case "warning":
        return "default";
      case "info":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            هشدارهای سیستم
          </CardTitle>
          <Badge variant="outline" className="text-gray-600">
            {alerts.length} هشدار فعال
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start p-4 rounded-lg border ${alert.bgColor} ${alert.borderColor}`}
            >
              <alert.icon className={`w-5 h-5 ${alert.iconColor} ml-3 mt-1 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className={`font-medium ${alert.iconColor}`}>{alert.title}</p>
                  <Badge variant={getSeverityBadgeVariant(alert.severity)} className="text-xs">
                    {alert.severity === "error" ? "بحرانی" : 
                     alert.severity === "warning" ? "هشدار" : "اطلاعات"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`${alert.iconColor} hover:${alert.iconColor}/80 p-0 h-auto font-normal`}
                  onClick={alert.onClick}
                >
                  {alert.actionText}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
