import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatPersianDate } from "@/lib/utils";
import { Calendar, CreditCard, DollarSign, Receipt, Save, X } from "lucide-react";
import { insertPaymentSchema } from "@shared/schema";
import type { Representative } from "@shared/schema";

const paymentFormSchema = insertPaymentSchema.extend({
  amount: z.string().min(1, "مبلغ الزامی است").refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    "مبلغ باید عدد مثبت باشد"
  ),
  paymentDate: z.string().min(1, "تاریخ پرداخت الزامی است"),
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
      paymentMethod: "bank_transfer",
      paymentDate: new Date().toISOString().split('T')[0],
      description: "",
      referenceNumber: "",
    },
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: PaymentFormData) =>
      apiRequest("/api/payments", "POST", {
        ...data,
        amount: data.amount.toString(),
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
    { value: "bank_transfer", label: "انتقال بانکی" },
    { value: "cash", label: "نقدی" },
    { value: "cheque", label: "چک" },
    { value: "card", label: "کارت به کارت" },
    { value: "online", label: "پرداخت آنلاین" },
    { value: "crypto", label: "ارز دیجیتال" },
  ];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <CreditCard className="w-5 h-5 ml-2" />
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold ml-4">
                    {representative.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{representative.name}</h3>
                    <p className="text-sm text-gray-600">@{representative.username}</p>
                    <div className="flex items-center space-x-2 space-x-reverse mt-1">
                      <Badge variant="outline">
                        شناسه: {representative.id}
                      </Badge>
                      {representative.status === 'active' && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          فعال
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <DollarSign className="w-4 h-4 ml-1" />
                        مبلغ پرداخت (تومان)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="مثال: 500000"
                          className="text-left"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage />
                      {field.value && !isNaN(Number(field.value)) && (
                        <p className="text-sm text-green-600">
                          معادل: {formatCurrency(field.value)} تومان
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                {/* Payment Date */}
                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Calendar className="w-4 h-4 ml-1" />
                        تاریخ پرداخت
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
                      {field.value && (
                        <p className="text-sm text-gray-600">
                          {formatPersianDate(new Date(field.value))}
                        </p>
                      )}
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <CreditCard className="w-4 h-4 ml-1" />
                        روش پرداخت
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب روش پرداخت" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Reference Number */}
                <FormField
                  control={form.control}
                  name="referenceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center">
                        <Receipt className="w-4 h-4 ml-1" />
                        شماره مرجع (اختیاری)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          placeholder="شماره تراکنش، چک یا رسید"
                          className="text-left"
                          dir="ltr"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Description */}
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
                        placeholder="توضیحات اضافی درباره پرداخت..."
                        className="min-h-20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
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

          {/* Payment Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CreditCard className="w-5 h-5 text-blue-600 mt-0.5 ml-2" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">راهنمای ثبت پرداخت:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>مبلغ را به تومان وارد کنید</li>
                  <li>روش پرداخت مناسب را انتخاب کنید</li>
                  <li>در صورت وجود، شماره مرجع را ثبت کنید</li>
                  <li>پرداخت بلافاصله در سیستم ثبت می‌شود</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}