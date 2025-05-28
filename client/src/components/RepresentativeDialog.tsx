import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertRepresentativeSchema, type Representative } from "@shared/schema";
import { normalizeDigits, validateIranianPhone, validateTelegramUsername } from "@/lib/utils";
import { z } from "zod";

// Extended validation schema
const representativeFormSchema = insertRepresentativeSchema.extend({
  phone: z.string().optional().refine((phone) => {
    if (!phone || phone.trim() === "") return true;
    return validateIranianPhone(phone);
  }, {
    message: "شماره تلفن معتبر نیست"
  }),
  telegramUsername: z.string().optional().refine((username) => {
    if (!username || username.trim() === "") return true;
    return validateTelegramUsername(username);
  }, {
    message: "نام کاربری تلگرام معتبر نیست"
  }),
  pricePerGb: z.string().min(1, "قیمت الزامی است").refine((val) => {
    const normalized = normalizeDigits(val);
    const num = parseFloat(normalized);
    return !isNaN(num) && num > 0;
  }, {
    message: "قیمت باید عددی معتبر باشد"
  }),
  discountPercent: z.string().optional().refine((val) => {
    if (!val || val.trim() === "") return true;
    const normalized = normalizeDigits(val);
    const num = parseFloat(normalized);
    return !isNaN(num) && num >= 0 && num <= 100;
  }, {
    message: "درصد تخفیف باید بین ۰ تا ۱۰۰ باشد"
  }),
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
  const { toast } = useToast();
  const isEditing = !!representative;

  // Get representatives for parent selection
  const { data: representatives = [] } = useQuery({
    queryKey: ["/api/representatives"],
    enabled: open,
  });

  const form = useForm<RepresentativeFormData>({
    resolver: zodResolver(representativeFormSchema),
    defaultValues: {
      name: "",
      username: "",
      telegramId: "",
      telegramUsername: "",
      phone: "",
      email: "",
      pricePerGb: "",
      discountPercent: "",
      parentRepId: undefined,
      status: "active",
      isSpecialOffer: false,
      isFreeUser: false,
      notes: "",
    },
  });

  // Load data when editing
  useEffect(() => {
    if (isEditing && representative) {
      form.reset({
        name: representative.name,
        username: representative.username,
        telegramId: representative.telegramId || "",
        telegramUsername: representative.telegramUsername || "",
        phone: representative.phone || "",
        email: representative.email || "",
        pricePerGb: representative.pricePerGb,
        discountPercent: representative.discountPercent || "",
        parentRepId: representative.parentRepId || undefined,
        status: representative.status,
        isSpecialOffer: representative.isSpecialOffer,
        isFreeUser: representative.isFreeUser,
        notes: representative.notes || "",
      });
    } else {
      form.reset({
        name: "",
        username: "",
        telegramId: "",
        telegramUsername: "",
        phone: "",
        email: "",
        pricePerGb: "",
        discountPercent: "",
        parentRepId: undefined,
        status: "active",
        isSpecialOffer: false,
        isFreeUser: false,
        notes: "",
      });
    }
  }, [representative, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: (data: RepresentativeFormData) => {
      const payload = {
        ...data,
        pricePerGb: normalizeDigits(data.pricePerGb),
        discountPercent: data.discountPercent ? normalizeDigits(data.discountPercent) : "0",
        phone: data.phone || null,
        email: data.email || null,
        telegramId: data.telegramId || null,
        telegramUsername: data.telegramUsername || null,
        notes: data.notes || null,
      };
      
      if (isEditing) {
        return fetch(`/api/representatives/${representative!.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        }).then(res => {
          if (!res.ok) throw new Error('Failed to update');
          return res.json();
        });
      } else {
        return fetch("/api/representatives", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        }).then(res => {
          if (!res.ok) throw new Error('Failed to create');
          return res.json();
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      toast({
        title: "موفقیت",
        description: isEditing ? "نماینده با موفقیت به‌روزرسانی شد" : "نماینده جدید اضافه شد",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ذخیره اطلاعات",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: RepresentativeFormData) => {
    createMutation.mutate(data);
  };

  // Filter out current representative from parent options
  const parentOptions = representatives.filter((rep: Representative) => 
    !isEditing || rep.id !== representative?.id
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isEditing ? "ویرایش نماینده" : "افزودن نماینده جدید"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام و نام خانوادگی *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: محمد احمدی" {...field} />
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
                    <FormLabel>نام کاربری *</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: m_ahmadi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شماره تلفن</FormLabel>
                    <FormControl>
                      <Input placeholder="09123456789" {...field} />
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
                      <Input placeholder="example@email.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Telegram Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telegramId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>شناسه تلگرام</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input placeholder="@username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Pricing Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pricePerGb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>قیمت هر گیگابایت (تومان) *</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>درصد تخفیف</FormLabel>
                    <FormControl>
                      <Input placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status and Parent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>وضعیت</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
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

              <FormField
                control={form.control}
                name="parentRepId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نماینده والد (اختیاری)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نماینده والد" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">بدون والد</SelectItem>
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
            </div>

            {/* Special Options */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isSpecialOffer"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">پیشنهاد ویژه</FormLabel>
                      <div className="text-sm text-gray-600">
                        این نماینده دارای شرایط خاص است
                      </div>
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

              <FormField
                control={form.control}
                name="isFreeUser"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">کاربر رایگان</FormLabel>
                      <div className="text-sm text-gray-600">
                        این نماینده از خدمات رایگان استفاده می‌کند
                      </div>
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>یادداشت‌ها</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="یادداشت‌های اضافی در مورد این نماینده..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                انصراف
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {createMutation.isPending ? "در حال ذخیره..." : (isEditing ? "به‌روزرسانی" : "ایجاد نماینده")}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}