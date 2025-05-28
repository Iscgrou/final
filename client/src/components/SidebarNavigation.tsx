import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  FileText,
  Calculator,
  BarChart3,
  MessageSquare,
  Settings,
  FileSpreadsheet,
} from "lucide-react";

const navigationItems = [
  {
    name: "نمای کلی",
    href: "/",
    icon: Home,
  },
  {
    name: "مدیریت نمایندگان",
    href: "/representatives",
    icon: Users,
  },
  {
    name: "وارد کردن اکسل",
    href: "/excel-import",
    icon: FileText,
  },
  {
    name: "مرکز فاکتور",
    href: "/invoices",
    icon: FileText,
  },
  {
    name: "حسابداری و پرداخت",
    href: "/payments",
    icon: Calculator,
  },
  {
    name: "مرکز تحلیل هوشمند",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "مدیریت تلگرام",
    href: "/telegram",
    icon: MessageSquare,
  },
  {
    name: "تنظیمات",
    href: "/settings",
    icon: Settings,
  },
];

export default function SidebarNavigation() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-sm min-h-screen border-l border-gray-200">
      <div className="p-6">
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-blue-50 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-5 h-5 ml-3" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
