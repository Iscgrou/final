import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatPersianDate } from "@/lib/utils";
import { 
  X, 
  Save, 
  DollarSign, 
  Calendar, 
  User,
  CreditCard,
  Banknote,
  Smartphone
} from "lucide-react";
import { insertPaymentSchema, type Representative } from "@shared/schema";

const paymentFormSchema = insertPaymentSchema.extend({
  amount: z.string().min(1, "مبلغ الزامی است"),
  paymentDate: z.string().min(1, "تاریخ پرداخت الزامی است"),
  paymentMethod: z.enum(["cash", "card", "transfer", "crypto"], {
    required_error: "روش پرداخت الزامی است"
  }),
  description: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentFormSchema>;

interface PaymentDialogProps {
  representative: Representative;
  onClose: () => void;
}

export default function PaymentDialog({ representative, onClose }: PaymentDialogProps) {
  const { toast } = useToast();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      representativeId: representative.id,
      amount: "",
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: "cash",
      description: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      apiRequest("/api/payments", "POST", {
        ...data,
        amount: parseFloat(data.amount),
        paymentDate: new Date(data.paymentDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "موفقیت",
        description: "پرداخت با موفقیت ثبت شد",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ثبت پرداخت",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: PaymentFormData) => {
    createPaymentMutation.mutate(data);
  };

  const paymentMethods = [
    { value: "cash", label: "نقدی", icon: Banknote },
    { value: "card", label: "کارت بانکی", icon: CreditCard },
    { value: "transfer", label: "انتقال بانکی", icon: Smartphone },
    { value: "crypto", label: "ارز دیجیتال", icon: DollarSign },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <DollarSign className="w-5 h-5 ml-2" />
              ثبت پرداخت جدید
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Representative Info */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <User className="w-4 h-4 ml-2" />
                اطلاعات نماینده
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نام:</span>
                <span className="font-medium">{representative.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نام کاربری:</span>
                <span className="font-medium">{representative.username}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">وضعیت:</span>
                <Badge 
                  variant={representative.status === "active" ? "default" : "secondary"}
                  className={representative.status === "active" ? "bg-green-100 text-green-800" : ""}
                >
                  {representative.status === "active" ? "فعال" : 
                   representative.status === "inactive" ? "غیرفعال" : "معلق"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <Card className="border border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">جزئیات پرداخت</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مبلغ (تومان) *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="1000000"
                              className="text-left"
                              dir="ltr"
                            />
                          </FormControl>
                          <FormMessage />
                          {field.value && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatCurrency(field.value)} تومان
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center">
                            <Calendar className="w-4 h-4 ml-1" />
                            تاریخ پرداخت *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="date"
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
                    name="paymentMethod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>روش پرداخت *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب روش پرداخت" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {paymentMethods.map((method) => {
                              const Icon = method.icon;
                              return (
                                <SelectItem key={method.value} value={method.value}>
                                  <div className="flex items-center">
                                    <Icon className="w-4 h-4 ml-2" />
                                    {method.label}
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات (اختیاری)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            placeholder="توضیحات اضافی در مورد پرداخت..."
                            className="min-h-20"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 space-x-reverse">
                <Button type="button" variant="outline" onClick={onClose}>
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={createPaymentMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {createPaymentMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                      در حال ثبت...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 ml-2" />
                      ثبت پرداخت
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}