import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Download, 
  Printer, 
  Send, 
  FileText,
  Calendar,
  User,
  DollarSign,
  Hash
} from "lucide-react";
import { formatCurrency, formatPersianDate, generateInvoiceNumber } from "@/lib/utils";
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
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const invoiceNumber = generateInvoiceNumber(invoice.representativeId, invoice.month);
  const currentDate = new Date();

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

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

      pdf.save(`فاکتور-${invoice.representativeName}-${invoice.month}.pdf`);

      toast({
        title: "موفقیت",
        description: "فاکتور با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تولید PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToImage = async () => {
    setIsExporting(true);
    try {
      const element = document.getElementById('invoice-content');
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff'
      });

      const link = document.createElement('a');
      link.download = `فاکتور-${invoice.representativeName}-${invoice.month}.png`;
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
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 ml-2" />
              پیش‌نمایش فاکتور
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 space-x-reverse">
            <Button
              variant="outline"
              onClick={exportToImage}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 ml-2" />
              دانلود تصویر
            </Button>
            <Button
              onClick={exportToPDF}
              disabled={isExporting}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  در حال تولید...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 ml-2" />
                  دانلود PDF
                </>
              )}
            </Button>
          </div>

          {/* Invoice Content */}
          <Card 
            id="invoice-content" 
            className="border-2 border-gray-200 bg-white"
            style={{ fontFamily: 'Vazir, Arial, sans-serif', direction: 'rtl' }}
          >
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">فاکتور خدمات VPN</h1>
                <div className="flex justify-between items-center mt-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600">شماره فاکتور:</p>
                    <p className="font-bold text-lg">{invoiceNumber}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-gray-600">تاریخ صدور:</p>
                    <p className="font-bold text-lg">{formatPersianDate(currentDate)}</p>
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <User className="w-5 h-5 ml-2" />
                    اطلاعات مشتری
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">نام:</span>
                      <span className="font-medium">{invoice.representativeName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">نام کاربری:</span>
                      <span className="font-medium">{invoice.username}</span>
                    </div>
                    {invoice.telegramUsername && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">تلگرام:</span>
                        <span className="font-medium">{invoice.telegramUsername}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Calendar className="w-5 h-5 ml-2" />
                    دوره خدمات
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ماه:</span>
                      <span className="font-medium">{invoice.month}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">مصرف داده:</span>
                      <span className="font-medium">{invoice.dataUsageGb} گیگابایت</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Services Table */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 ml-2" />
                  جزئیات محاسبات
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 font-bold text-gray-900 mb-3 pb-2 border-b border-gray-300">
                    <div>خدمات</div>
                    <div className="text-center">مقدار</div>
                    <div className="text-center">نرخ (تومان)</div>
                    <div className="text-left">مبلغ (تومان)</div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 py-2">
                    <div>سرویس VPN</div>
                    <div className="text-center">{invoice.dataUsageGb} GB</div>
                    <div className="text-center">{formatCurrency(invoice.pricePerGb)}</div>
                    <div className="text-left font-medium">{formatCurrency(invoice.totalAmount)}</div>
                  </div>

                  {invoice.discountPercent > 0 && (
                    <div className="grid grid-cols-4 gap-4 py-2 text-green-600">
                      <div>تخفیف</div>
                      <div className="text-center">%{invoice.discountPercent}</div>
                      <div className="text-center">-</div>
                      <div className="text-left font-medium">
                        -{formatCurrency(invoice.totalAmount - invoice.finalAmount)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="mb-6" />

              {/* Total */}
              <div className="text-left mb-8">
                <div className="bg-primary/10 rounded-lg p-4 inline-block">
                  <div className="text-lg font-bold text-gray-900 mb-2">مبلغ قابل پرداخت:</div>
                  <div className="text-3xl font-bold text-primary">
                    {formatCurrency(invoice.finalAmount)} تومان
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-sm text-gray-600 border-t border-gray-200 pt-4">
                <p>این فاکتور به صورت الکترونیکی تولید شده و نیازی به مهر و امضا ندارد.</p>
                <p className="mt-1">با تشکر از انتخاب خدمات ما</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}