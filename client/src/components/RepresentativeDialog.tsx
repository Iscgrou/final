import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { validateTelegramUsername, formatCurrency } from "@/lib/utils";
import { 
  User, 
  Save, 
  X, 
  Phone, 
  MessageSquare, 
  Store,
  DollarSign,
  Calendar,
  Shield,
  Link,
  UserPlus,
  Smartphone,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { insertRepresentativeSchema, type Representative } from "@shared/schema";

// Enhanced schema for Android-focused features
const representativeFormSchema = insertRepresentativeSchema.extend({
  name: z.string().min(1, "نام کامل الزامی است"),
  username: z.string().min(1, "نام کاربری الزامی است"),
  phone: z.string().optional(),
  email: z.string().email("ایمیل نامعتبر است").optional().or(z.literal("")),
  telegramId: z.string().optional(),
  telegramUsername: z.string().optional(),
  storeName: z.string().optional(),
  
  // Pricing structure for different plan durations (Android feature)
  price1Month: z.string().min(1, "قیمت ۱ ماهه الزامی است"),
  price2Month: z.string().min(1, "قیمت ۲ ماهه الزامی است"),
  price3Month: z.string().min(1, "قیمت ۳ ماهه الزامی است"),
  price4Month: z.string().min(1, "قیمت ۴ ماهه الزامی است"),
  price5Month: z.string().min(1, "قیمت ۵ ماهه الزامی است"),
  price6Month: z.string().min(1, "قیمت ۶ ماهه الزامی است"),
  unlimitedMonthlyPrice: z.string().min(1, "قیمت نامحدود ماهانه الزامی است"),
  
  parentId: z.number().optional(),
  status: z.enum(["active", "inactive", "suspended"]),
  isReferred: z.boolean().optional(),
  referredBy: z.string().optional(),
  notes: z.string().optional(),
});

type RepresentativeFormData = z.infer<typeof representativeFormSchema>;

interface RepresentativeDialogProps {
  open: boolean;
  onClose: () => void;
  representative?: Representative | null;
}

export default function RepresentativeDialog({
  open,
  onClose,
  representative,
}: RepresentativeDialogProps) {
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();

  // Get representatives for parent selection
  const { data: representatives = [] } = useQuery({
    queryKey: ["/api/representatives"],
  });

  const form = useForm<RepresentativeFormData>({
    resolver: zodResolver(representativeFormSchema),
    defaultValues: {
      name: representative?.name || "",
      username: representative?.username || "",
      phone: representative?.phone || "",
      email: representative?.email || "",
      telegramId: representative?.telegramId || "",
      telegramUsername: representative?.telegramUsername || "",
      storeName: representative?.storeName || "",
      
      // Default pricing structure (Android feature)
      price1Month: representative?.price1Month || "50000",
      price2Month: representative?.price2Month || "95000",
      price3Month: representative?.price3Month || "135000",
      price4Month: representative?.price4Month || "170000",
      price5Month: representative?.price5Month || "200000",
      price6Month: representative?.price6Month || "225000",
      unlimitedMonthlyPrice: representative?.unlimitedMonthlyPrice || "300000",
      
      parentId: representative?.parentId || undefined,
      status: representative?.status || "active",
      isReferred: representative?.isReferred || false,
      referredBy: representative?.referredBy || "",
      notes: representative?.notes || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: RepresentativeFormData) =>
      apiRequest("/api/representatives", "POST", {
        ...data,
        parentId: data.parentId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "موفقیت",
        description: "نماینده جدید با موفقیت اضافه شد",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ایجاد نماینده",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: RepresentativeFormData) =>
      apiRequest(`/api/representatives/${representative?.id}`, "PATCH", {
        ...data,
        parentId: data.parentId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      toast({
        title: "موفقیت",
        description: "اطلاعات نماینده بروزرسانی شد",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در بروزرسانی نماینده",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RepresentativeFormData) => {
    if (representative) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const validateTelegramInfo = () => {
    const telegramId = form.getValues("telegramId");
    const telegramUsername = form.getValues("telegramUsername");
    
    if (telegramUsername && !validateTelegramUsername(telegramUsername)) {
      toast({
        title: "خطا",
        description: "نام کاربری تلگرام نامعتبر است",
        variant: "destructive",
      });
      return false;
    }
    
    if (!telegramId && !telegramUsername) {
      toast({
        title: "هشدار",
        description: "حداقل یکی از شناسه یا نام کاربری تلگرام را وارد کنید",
        variant: "destructive",
      });
      return false;
    }
    
    toast({
      title: "موفقیت",
      description: "اطلاعات تلگرام معتبر است",
    });
    return true;
  };

  const tabs = [
    { id: "basic", label: "اطلاعات پایه", icon: User },
    { id: "pricing", label: "ساختار قیمت‌گذاری", icon: DollarSign },
    { id: "telegram", label: "تلگرام", icon: MessageSquare },
    { id: "advanced", label: "تنظیمات پیشرفته", icon: Shield },
  ];

  const parentOptions = representatives.filter((rep: Representative) => 
    rep.id !== representative?.id
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <UserPlus className="w-5 h-5 ml-2" />
              {representative ? "ویرایش نماینده" : "افزودن نماینده جدید"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tab Navigation */}
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

            {/* Android-Style Feature Highlight */}
            <Card className="border border-green-200 bg-green-50 mt-4">
              <CardContent className="p-4">
                <div className="flex items-start">
                  <Smartphone className="w-5 h-5 text-green-600 mt-0.5 ml-2" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">ویژگی‌های اندروید:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>قیمت‌گذاری انعطاف‌پذیر</li>
                      <li>تلگرام یکپارچه</li>
                      <li>مدیریت زیرمجموعه</li>
                      <li>رهگیری ارجاعات</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tab Content */}
          <div className="lg:col-span-3">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                
                {/* Basic Information Tab */}
                {activeTab === "basic" && (
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <User className="w-5 h-5 ml-2" />
                        اطلاعات پایه نماینده
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام کامل *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="نام و نام خانوادگی" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام کاربری (Admin Username) *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="admin_username"
                                  className="text-left"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-500">
                                این نام کاربری باید با پنل Marzban مطابقت داشته باشد
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Phone className="w-4 h-4 ml-1" />
                                شماره تلفن
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="09123456789"
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
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ایمیل</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  type="email"
                                  placeholder="example@domain.com"
                                  className="text-left"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="storeName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Store className="w-4 h-4 ml-1" />
                              نام فروشگاه (اختیاری)
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value || ""}
                                placeholder="نام فروشگاه یا برند"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>وضعیت</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب وضعیت" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">فعال</SelectItem>
                                <SelectItem value="inactive">غیرفعال</SelectItem>
                                <SelectItem value="suspended">معلق</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Pricing Structure Tab (Android Feature) */}
                {activeTab === "pricing" && (
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <DollarSign className="w-5 h-5 ml-2" />
                        ساختار قیمت‌گذاری (ویژگی اندروید)
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        قیمت‌ها برای محاسبه خودکار فاکتورها استفاده می‌شوند
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Limited Plans Pricing */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Calendar className="w-4 h-4 ml-2" />
                          قیمت هر گیگابایت برای پلن‌های محدود
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="price1Month"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>۱ ماهه (تومان)</FormLabel>
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
                            name="price2Month"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>۲ ماهه (تومان)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="95000"
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
                            name="price3Month"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>۳ ماهه (تومان)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="135000"
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
                            name="price4Month"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>۴ ماهه (تومان)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="170000"
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
                            name="price5Month"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>۵ ماهه (تومان)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="200000"
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
                            name="price6Month"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>۶ ماهه (تومان)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="225000"
                                    className="text-left"
                                    dir="ltr"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Unlimited Plan Pricing */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">قیمت‌گذاری پلن نامحدود</h4>
                        <FormField
                          control={form.control}
                          name="unlimitedMonthlyPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>قیمت ماهانه نامحدود (تومان)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="300000"
                                  className="text-left w-60"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-500">
                                محاسبه: قیمت_ماهانه × تعداد_ماه
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Pricing Preview */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h5 className="font-medium text-blue-900 mb-2">پیش‌نمایش قیمت‌ها:</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>۱ماه: {formatCurrency(form.watch("price1Month") || "0")}</div>
                          <div>۲ماه: {formatCurrency(form.watch("price2Month") || "0")}</div>
                          <div>۳ماه: {formatCurrency(form.watch("price3Month") || "0")}</div>
                          <div>نامحدود: {formatCurrency(form.watch("unlimitedMonthlyPrice") || "0")}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Telegram Tab */}
                {activeTab === "telegram" && (
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MessageSquare className="w-5 h-5 ml-2" />
                        اطلاعات تلگرام
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="telegramId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>شناسه تلگرام (Telegram ID)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="123456789"
                                  className="text-left"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-500">
                                شناسه عددی تلگرام
                              </p>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="telegramUsername"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>نام کاربری تلگرام</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="@username"
                                  className="text-left"
                                  dir="ltr"
                                />
                              </FormControl>
                              <FormMessage />
                              <p className="text-xs text-gray-500">
                                نام کاربری با @ شروع می‌شود
                              </p>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={validateTelegramInfo}
                        >
                          <CheckCircle className="w-4 h-4 ml-2" />
                          تایید اطلاعات تلگرام
                        </Button>
                      </div>

                      {/* Telegram Status */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          {(form.watch("telegramId") || form.watch("telegramUsername")) ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="text-sm text-green-800">
                                اطلاعات تلگرام موجود - آماده ارسال فاکتور
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-5 h-5 text-orange-600" />
                              <span className="text-sm text-orange-800">
                                اطلاعات تلگرام ناقص - ارسال خودکار غیرممکن
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Advanced Settings Tab */}
                {activeTab === "advanced" && (
                  <Card className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Shield className="w-5 h-5 ml-2" />
                        تنظیمات پیشرفته
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Parent Representative */}
                      <FormField
                        control={form.control}
                        name="parentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Link className="w-4 h-4 ml-1" />
                              نماینده والد (سرگروه)
                            </FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="انتخاب نماینده والد" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">بدون سرگروه</SelectItem>
                                {parentOptions.map((rep: Representative) => (
                                  <SelectItem key={rep.id} value={rep.id.toString()}>
                                    {rep.name} (@{rep.username})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Referral Information */}
                      <div className="space-y-4">
                        <FormField
                          control={form.control}
                          name="isReferred"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2 space-x-reverse">
                              <FormControl>
                                <Checkbox
                                  checked={field.value || false}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                این نماینده از طریق ارجاع معرفی شده است
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        {form.watch("isReferred") && (
                          <FormField
                            control={form.control}
                            name="referredBy"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>معرف</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    placeholder="نام یا شناسه معرف"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {/* Notes */}
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>یادداشت‌ها</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                value={field.value || ""}
                                placeholder="یادداشت‌ها و توضیحات اضافی..."
                                className="min-h-20"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-gray-200">
                  <Button type="button" variant="outline" onClick={onClose}>
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                        در حال ذخیره...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        {representative ? "بروزرسانی" : "ایجاد نماینده"}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}