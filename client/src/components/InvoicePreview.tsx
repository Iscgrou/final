import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatPersianDate, formatPersianTime } from "@/lib/utils";
import { Download, Printer, X } from "lucide-react";

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
}

interface InvoicePreviewProps {
  invoice: InvoiceData;
  onClose: () => void;
}

export default function InvoicePreview({ invoice, onClose }: InvoicePreviewProps) {
  const currentDate = new Date();
  const invoiceNumber = `INV-${invoice.representativeId}-${invoice.month.replace('/', '')}-${Date.now().toString().slice(-6)}`;
  const discountAmount = (invoice.totalAmount * invoice.discountPercent) / 100;

  const handleDownloadPDF = () => {
    // TODO: Implement PDF generation
    console.log("Download PDF for invoice:", invoiceNumber);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>پیش‌نمایش فاکتور</DialogTitle>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 ml-1" />
                چاپ
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="w-4 h-4 ml-1" />
                PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Invoice Content */}
        <div className="bg-white p-8 border border-gray-200 rounded-lg" id="invoice-content">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b border-gray-200 pb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">فاکتور فروش</h1>
              <div className="text-sm text-gray-600 space-y-1">
                <p>شماره فاکتور: <span className="font-mono">{invoiceNumber}</span></p>
                <p>تاریخ صدور: {formatPersianDate(currentDate)}</p>
                <p>ساعت صدور: {formatPersianTime(currentDate)}</p>
              </div>
            </div>
            
            <div className="text-left">
              <div className="w-20 h-20 bg-primary rounded-lg flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 text-white"
                  fill="currentColor"
                >
                  <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm5-18v4h3V3h-3z" />
                </svg>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-semibold">سیستم مدیریت VPN</p>
                <p>خدمات اینترنت پرسرعت</p>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">اطلاعات مشتری</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">نام:</span> {invoice.representativeName}</p>
                <p><span className="font-medium">نام کاربری:</span> @{invoice.username}</p>
                <p><span className="font-medium">دوره فاکتور:</span> {invoice.month}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">شرایط پرداخت</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p><span className="font-medium">مهلت پرداخت:</span> ۳۰ روز</p>
                <p><span className="font-medium">روش پرداخت:</span> انتقال بانکی</p>
                <p><span className="font-medium">وضعیت:</span> <span className="text-orange-600">در انتظار پرداخت</span></p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">جزئیات خدمات</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900 border-b">شرح خدمات</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">مقدار</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">واحد</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">قیمت واحد</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b">مبلغ کل</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-4 py-4 text-sm text-gray-900 border-b">
                      خدمات VPN - مصرف داده ماهانه
                      <div className="text-xs text-gray-500 mt-1">
                        دوره: {invoice.month}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center border-b font-mono">
                      {formatCurrency(invoice.dataUsageGb)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center border-b">
                      گیگابایت
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center border-b font-mono">
                      {formatCurrency(invoice.pricePerGb)} تومان
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 text-center border-b font-mono">
                      {formatCurrency(invoice.totalAmount)} تومان
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-md">
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">جمع کل:</span>
                  <span className="font-mono text-sm">{formatCurrency(invoice.totalAmount)} تومان</span>
                </div>
                
                {invoice.discountPercent > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-sm">تخفیف ({formatCurrency(invoice.discountPercent)}%):</span>
                    <span className="font-mono text-sm">-{formatCurrency(discountAmount)} تومان</span>
                  </div>
                )}
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">مبلغ نهایی:</span>
                    <span className="text-xl font-bold text-primary font-mono">
                      {formatCurrency(invoice.finalAmount)} تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">اطلاعات تماس</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>📞 تلفن پشتیبانی: ۰۲۱-۱۲۳۴۵۶۷۸</p>
                  <p>📧 ایمیل: support@vpn-system.com</p>
                  <p>🌐 وب‌سایت: www.vpn-system.com</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">شرایط و ضوابط</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>• مهلت پرداخت این فاکتور ۳۰ روز می‌باشد</p>
                  <p>• پس از انقضای مهلت، ۲% جریمه دیرکرد اعمال می‌شود</p>
                  <p>• قطع خدمات پس از ۴۵ روز عدم پرداخت</p>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                این فاکتور به صورت الکترونیکی تولید شده و مهر و امضا ندارد
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}