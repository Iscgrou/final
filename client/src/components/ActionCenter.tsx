import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileSpreadsheet, 
  FileText, 
  UserPlus, 
  PieChart,
  Upload,
  DollarSign,
  Plus,
  BarChart3
} from "lucide-react";

export default function ActionCenter() {
  const actions = [
    {
      title: "وارد کردن فایل اکسل",
      description: "برای تولید فاکتور",
      icon: FileSpreadsheet,
      color: "text-secondary",
      onClick: () => {
        // TODO: Implement Excel import
        console.log("Import Excel clicked");
      },
    },
    {
      title: "تولید فاکتور",
      description: "برای همه نمایندگان",
      icon: FileText,
      color: "text-primary",
      onClick: () => {
        // TODO: Implement invoice generation
        console.log("Generate invoices clicked");
      },
    },
    {
      title: "اضافه کردن نماینده",
      description: "نماینده جدید",
      icon: UserPlus,
      color: "text-accent",
      onClick: () => {
        // TODO: Implement add representative
        console.log("Add representative clicked");
      },
    },
    {
      title: "تحلیل هوشمند",
      description: "گزارش‌های AI",
      icon: BarChart3,
      color: "text-destructive",
      onClick: () => {
        // TODO: Implement analytics
        console.log("View analytics clicked");
      },
    },
  ];

  return (
    <Card className="border border-gray-200 mb-8">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          مرکز عملیات سریع
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="flex flex-col items-center p-6 h-auto border-2 border-dashed border-gray-300 hover:border-primary hover:bg-blue-50 transition-colors"
              onClick={action.onClick}
            >
              <action.icon className={`w-8 h-8 ${action.color} mb-3`} />
              <span className="font-medium text-gray-900 text-center">
                {action.title}
              </span>
              <span className="text-sm text-gray-600 mt-1 text-center">
                {action.description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
