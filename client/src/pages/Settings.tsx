import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Settings as SettingsIcon, 
  Save, 
  Globe,
  DollarSign,
  Bell,
  Mail,
  Shield,
  Database,
  Palette,
  FileText,
  MessageSquare,
  Calendar,
  User
} from "lucide-react";

const settingsSchema = z.object({
  // Company Settings
  companyName: z.string().min(1, "نام شرکت الزامی است"),
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  companyEmail: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  
  // Invoice Settings
  pricePerGb: z.string().min(1, "قیمت هر گیگابایت الزامی است"),
  defaultDiscount: z.string().optional(),
  invoicePrefix: z.string().min(1, "پیشوند فاکتور الزامی است"),
  dueDays: z.string().min(1, "مهلت پرداخت الزامی است"),
  
  // Notification Settings
  emailNotifications: z.boolean(),
  telegramNotifications: z.boolean(),
  overdueReminders: z.boolean(),
  paymentConfirmations: z.boolean(),
  
  // System Settings
  timeZone: z.string(),
  language: z.string(),
  theme: z.string(),
  autoBackup: z.boolean(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("company");
  const { toast } = useToast();

  // Get current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: settings?.companyName || "سیستم مدیریت VPN",
      companyAddress: settings?.companyAddress || "",
      companyPhone: settings?.companyPhone || "",
      companyEmail: settings?.companyEmail || "",
      pricePerGb: settings?.pricePerGb || "50000",
      defaultDiscount: settings?.defaultDiscount || "0",
      invoicePrefix: settings?.invoicePrefix || "INV",
      dueDays: settings?.dueDays || "30",
      emailNotifications: settings?.emailNotifications ?? true,
      telegramNotifications: settings?.telegramNotifications ?? true,
      overdueReminders: settings?.overdueReminders ?? true,
      paymentConfirmations: settings?.paymentConfirmations ?? true,
      timeZone: settings?.timeZone || "Asia/Tehran",
      language: settings?.language || "fa",
      theme: settings?.theme || "light",
      autoBackup: settings?.autoBackup ?? true,
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SettingsFormData) =>
      apiRequest("/api/settings", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "موفقیت",
        description: "تنظیمات با موفقیت ذخیره شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره تنظیمات",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const tabs = [
    { id: "company", label: "اطلاعات شرکت", icon: User },
    { id: "invoice", label: "تنظیمات فاکتور", icon: FileText },
    { id: "notifications", label: "اعلان‌ها", icon: Bell },
    { id: "system", label: "سیستم", icon: SettingsIcon },
  ];

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تنظیمات سیستم</h2>
        <p className="text-gray-600">
          پیکربندی و سفارشی‌سازی سیستم مدیریت VPN
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card className="border border-gray-200">
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-right text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 ml-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
              {/* Company Settings */}
              {activeTab === "company" && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 ml-2" />
                      اطلاعات شرکت
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نام شرکت</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="نام شرکت یا سازمان" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>آدرس</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="آدرس کامل شرکت..."
                              className="min-h-20"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="companyPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تلفن</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="شماره تلفن" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="companyEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ایمیل</FormLabel>
                            <FormControl>
                              <Input {...field} type="email" placeholder="info@company.com" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Invoice Settings */}
              {activeTab === "invoice" && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 ml-2" />
                      تنظیمات فاکتور
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="pricePerGb"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <DollarSign className="w-4 h-4 ml-1" />
                              قیمت هر گیگابایت (تومان)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="50000"
                                className="text-left"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="defaultDiscount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>تخفیف پیش‌فرض (درصد)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="0"
                                className="text-left"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="invoicePrefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>پیشوند شماره فاکتور</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="INV"
                                className="text-left"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="dueDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>مهلت پرداخت (روز)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="30"
                                className="text-left"
                                dir="ltr"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Bell className="w-5 h-5 ml-2" />
                      تنظیمات اعلان‌ها
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <Mail className="w-4 h-4 ml-2" />
                                اعلان‌های ایمیل
                              </FormLabel>
                              <p className="text-sm text-gray-600">
                                ارسال اعلان‌ها از طریق ایمیل
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={form.control}
                        name="telegramNotifications"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel className="flex items-center">
                                <MessageSquare className="w-4 h-4 ml-2" />
                                اعلان‌های تلگرام
                              </FormLabel>
                              <p className="text-sm text-gray-600">
                                ارسال اعلان‌ها از طریق تلگرام
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={form.control}
                        name="overdueReminders"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel>یادآوری فاکتورهای معوق</FormLabel>
                              <p className="text-sm text-gray-600">
                                ارسال یادآوری برای فاکتورهای سررسید گذشته
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <FormField
                        control={form.control}
                        name="paymentConfirmations"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <FormLabel>تایید پرداخت‌ها</FormLabel>
                              <p className="text-sm text-gray-600">
                                ارسال تایید پس از دریافت پرداخت
                              </p>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* System Settings */}
              {activeTab === "system" && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <SettingsIcon className="w-5 h-5 ml-2" />
                      تنظیمات سیستم
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="timeZone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Calendar className="w-4 h-4 ml-1" />
                              منطقه زمانی
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب منطقه زمانی" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Asia/Tehran">تهران (GMT+3:30)</SelectItem>
                                <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                                <SelectItem value="Asia/Dubai">دبی (GMT+4)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Globe className="w-4 h-4 ml-1" />
                              زبان
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب زبان" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="fa">فارسی</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="ar">العربية</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Palette className="w-4 h-4 ml-1" />
                            تم رنگی
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="انتخاب تم" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">روشن</SelectItem>
                              <SelectItem value="dark">تاریک</SelectItem>
                              <SelectItem value="auto">خودکار</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <FormField
                      control={form.control}
                      name="autoBackup"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="flex items-center">
                              <Database className="w-4 h-4 ml-2" />
                              پشتیبان‌گیری خودکار
                            </FormLabel>
                            <p className="text-sm text-gray-600">
                              ایجاد پشتیبان خودکار از اطلاعات سیستم
                            </p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Save Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      ذخیره تنظیمات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </main>
  );
}