import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPersianDate, generateInvoiceNumber } from "@/lib/utils";
import { Download, X, Send, Copy, Share, FileImage, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface InvoiceData {
  representativeId: number;
  representativeName: string;
  username: string;
  dataUsageGb: number;
  pricePerGb: number;
  discountPercent: number;
  totalAmount: number;
  finalAmount: number;
  month: string;
  telegramId?: string;
  telegramUsername?: string;
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  onClose: () => void;
}

export default function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const invoiceNumber = generateInvoiceNumber(invoice.representativeId, invoice.month);
  const currentDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`فاکتور-${invoiceNumber}.pdf`);
      
      toast({
        title: "موفقیت",
        description: "فاکتور PDF با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تولید PDF",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `فاکتور-${invoiceNumber}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "موفقیت",
        description: "تصویر فاکتور دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تولید تصویر",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendToTelegram = () => {
    const telegramId = invoice.telegramId || invoice.telegramUsername;
    if (!telegramId) {
      toast({
        title: "خطا",
        description: "شناسه تلگرام این نماینده ثبت نشده است",
        variant: "destructive",
      });
      return;
    }

    const message = `سلام ${invoice.representativeName} عزیز 👋

فاکتور ماهانه شما برای دوره ${invoice.month} آماده شده است.

📋 جزئیات فاکتور:
• شماره فاکتور: ${invoiceNumber}
• مصرف: ${invoice.dataUsageGb} گیگابایت
• قیمت هر گیگ: ${formatCurrency(invoice.pricePerGb)} تومان
${invoice.discountPercent > 0 ? `• تخفیف: ${invoice.discountPercent}%` : ''}
• مبلغ کل: ${formatCurrency(invoice.totalAmount)} تومان
• مبلغ نهایی: ${formatCurrency(invoice.finalAmount)} تومان
• مهلت پرداخت: ${formatPersianDate(dueDate)}

لطفاً در اسرع وقت نسبت به پرداخت اقدام فرمایید.

با تشکر
سیستم مدیریت VPN`;

    const encodedMessage = encodeURIComponent(message);
    const telegramLink = `https://t.me/${telegramId.replace('@', '')}?text=${encodedMessage}`;
    
    window.open(telegramLink, '_blank');
    
    toast({
      title: "موفقیت",
      description: "لینک تلگرام باز شد",
    });
  };

  const copyInvoiceText = () => {
    const invoiceText = `فاکتور ${invoiceNumber}
نماینده: ${invoice.representativeName}
مصرف: ${invoice.dataUsageGb} گیگابایت
مبلغ نهایی: ${formatCurrency(invoice.finalAmount)} تومان
ماه: ${invoice.month}`;

    navigator.clipboard.writeText(invoiceText);
    toast({
      title: "موفقیت",
      description: "اطلاعات فاکتور کپی شد",
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <FileImage className="w-5 h-5 ml-2" />
              پیش‌نمایش فاکتور
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Invoice Content */}
        <div id="invoice-content" className="bg-white p-8 rounded-lg shadow-lg" dir="rtl">
          {/* Header */}
          <div className="text-center mb-8 border-b-2 border-primary pb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">فاکتور فروش</h1>
            <h2 className="text-xl text-gray-600">سیستم مدیریت VPN</h2>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="text-right">
                <p><strong>شماره فاکتور:</strong> {invoiceNumber}</p>
                <p><strong>تاریخ صدور:</strong> {formatPersianDate(currentDate)}</p>
              </div>
              <div className="text-left">
                <p><strong>مهلت پرداخت:</strong> {formatPersianDate(dueDate)}</p>
                <p><strong>دوره:</strong> {invoice.month}</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-primary">اطلاعات نماینده:</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>نام:</strong> {invoice.representativeName}</p>
                  <p><strong>نام کاربری:</strong> @{invoice.username}</p>
                </div>
                <div>
                  <p><strong>شناسه نماینده:</strong> {invoice.representativeId}</p>
                  {(invoice.telegramId || invoice.telegramUsername) && (
                    <p><strong>تلگرام:</strong> {invoice.telegramId || invoice.telegramUsername}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-primary">جزئیات فاکتور:</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="border border-gray-300 p-3 text-right">شرح</th>
                    <th className="border border-gray-300 p-3 text-center">مقدار</th>
                    <th className="border border-gray-300 p-3 text-center">قیمت واحد</th>
                    <th className="border border-gray-300 p-3 text-center">مبلغ کل</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">مصرف داده VPN</td>
                    <td className="border border-gray-300 p-3 text-center">{invoice.dataUsageGb} گیگابایت</td>
                    <td className="border border-gray-300 p-3 text-center">{formatCurrency(invoice.pricePerGb)} تومان</td>
                    <td className="border border-gray-300 p-3 text-center">{formatCurrency(invoice.totalAmount)} تومان</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <div className="flex justify-end">
              <div className="w-80">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>مبلغ کل:</span>
                      <span>{formatCurrency(invoice.totalAmount)} تومان</span>
                    </div>
                    {invoice.discountPercent > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>تخفیف ({invoice.discountPercent}%):</span>
                        <span>-{formatCurrency(invoice.totalAmount - invoice.finalAmount)} تومان</span>
                      </div>
                    )}
                    <hr className="border-gray-300" />
                    <div className="flex justify-between font-bold text-lg text-primary">
                      <span>مبلغ قابل پرداخت:</span>
                      <span>{formatCurrency(invoice.finalAmount)} تومان</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 border-t pt-4">
            <p>لطفاً مبلغ فوق را تا تاریخ سررسید پرداخت نمایید.</p>
            <p>در صورت داشتن سوال با بخش پشتیبانی تماس بگیرید.</p>
            <p className="mt-4 font-medium">با تشکر از همکاری شما</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Badge variant={invoice.telegramId || invoice.telegramUsername ? "default" : "destructive"}>
              {invoice.telegramId || invoice.telegramUsername ? "تلگرام متصل" : "بدون تلگرام"}
            </Badge>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Button variant="outline" onClick={copyInvoiceText}>
              <Copy className="w-4 h-4 ml-2" />
              کپی
            </Button>

            <Button variant="outline" onClick={generateImage} disabled={isGenerating}>
              <FileImage className="w-4 h-4 ml-2" />
              تصویر
            </Button>

            <Button variant="outline" onClick={generatePDF} disabled={isGenerating}>
              <Download className="w-4 h-4 ml-2" />
              PDF
            </Button>

            {(invoice.telegramId || invoice.telegramUsername) && (
              <Button onClick={sendToTelegram} className="bg-blue-500 text-white hover:bg-blue-600">
                <MessageSquare className="w-4 h-4 ml-2" />
                ارسال در تلگرام
              </Button>
            )}
          </div>
        </div>

        {/* Android-Style Features */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <Share className="w-5 h-5 text-blue-600 mt-0.5 ml-2" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">ویژگی‌های اندروید:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>دانلود فاکتور به صورت PDF و تصویر</li>
                <li>ارسال مستقیم در تلگرام با پیام از پیش تنظیم شده</li>
                <li>کپی سریع اطلاعات فاکتور</li>
                <li>طراحی بهینه برای نمایش موبایل</li>
              </ul>
            </div>
          </div>
        </div>

        {isGenerating && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg flex items-center space-x-4 space-x-reverse">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>در حال تولید فاکتور...</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}