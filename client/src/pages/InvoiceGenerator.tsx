import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatPersianDate, generateInvoiceNumber } from "@/lib/utils";
import { 
  FileText, 
  Download, 
  Send, 
  Calendar, 
  Users,
  Calculator,
  CheckCircle,
  AlertTriangle,
  Image,
  FileDown,
  Zap,
  Eye
} from "lucide-react";
import InvoicePreview from "@/components/InvoicePreview";
import type { Representative, BillingData } from "@shared/schema";

interface InvoiceGenerationData {
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

interface GenerationProgress {
  current: number;
  total: number;
  status: string;
  errors: string[];
}

export default function InvoiceGenerator() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedReps, setSelectedReps] = useState<Set<number>>(new Set());
  const [generateAll, setGenerateAll] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceGenerationData[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceGenerationData | null>(null);
  const { toast } = useToast();

  // Get representatives
  const { data: representatives = [], isLoading: repsLoading } = useQuery({
    queryKey: ["/api/representatives"],
  });

  // Get billing data
  const { data: billingData = [], isLoading: billingLoading } = useQuery({
    queryKey: ["/api/billing-data", selectedMonth],
    enabled: !!selectedMonth,
  });

  // Get existing invoices
  const { data: existingInvoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  const generateInvoicesMutation = useMutation({
    mutationFn: (invoices: any[]) =>
      fetch("/api/invoices/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoices }),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to generate invoices');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "موفقیت",
        description: "فاکتورها با موفقیت تولید شدند",
      });
      setGenerating(false);
      setProgress(null);
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در تولید فاکتورها",
        variant: "destructive",
      });
      setGenerating(false);
      setProgress(null);
    },
  });

  const processInvoiceData = () => {
    if (!selectedMonth || billingData.length === 0) {
      toast({
        title: "خطا",
        description: "لطفاً ماه را انتخاب کنید و داده‌های فاکتور وجود داشته باشد",
        variant: "destructive",
      });
      return;
    }

    const processed: InvoiceGenerationData[] = [];
    const representativesMap = new Map(representatives.map((rep: Representative) => [rep.username, rep]));

    // Group billing data by admin_username
    const groupedBilling = billingData.reduce((acc: { [key: string]: number }, item: BillingData) => {
      if (!acc[item.adminUsername]) {
        acc[item.adminUsername] = 0;
      }
      acc[item.adminUsername] += parseFloat(item.dataUsageGb.toString());
      return acc;
    }, {});

    // Create invoice data for each representative with usage
    Object.entries(groupedBilling).forEach(([username, totalUsage]) => {
      const representative = representativesMap.get(username);
      if (!representative) {
        console.warn(`Representative not found for username: ${username}`);
        return;
      }

      const pricePerGb = parseFloat(representative.pricePerGb);
      const discountPercent = parseFloat(representative.discountPercent || "0");
      const totalAmount = totalUsage * pricePerGb;
      const discountAmount = (totalAmount * discountPercent) / 100;
      const finalAmount = totalAmount - discountAmount;

      processed.push({
        representativeId: representative.id,
        representativeName: representative.name,
        username: representative.username,
        dataUsageGb: Math.round(totalUsage * 1000) / 1000,
        pricePerGb,
        discountPercent,
        totalAmount,
        finalAmount,
        month: selectedMonth,
      });
    });

    setInvoiceData(processed);
    
    if (processed.length === 0) {
      toast({
        title: "هشدار",
        description: "هیچ داده‌ای برای تولید فاکتور یافت نشد",
        variant: "destructive",
      });
    }
  };

  const handleGenerateInvoices = async () => {
    if (invoiceData.length === 0) {
      toast({
        title: "خطا",
        description: "ابتدا داده‌های فاکتور را پردازش کنید",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: invoiceData.length, status: "آماده‌سازی...", errors: [] });

    try {
      // Filter selected or all invoices
      const invoicesToGenerate = generateAll 
        ? invoiceData 
        : invoiceData.filter(inv => selectedReps.has(inv.representativeId));

      if (invoicesToGenerate.length === 0) {
        toast({
          title: "خطا",
          description: "هیچ فاکتوری برای تولید انتخاب نشده",
          variant: "destructive",
        });
        setGenerating(false);
        setProgress(null);
        return;
      }

      // Convert to invoice format
      const invoices = invoicesToGenerate.map(inv => ({
        representativeId: inv.representativeId,
        invoiceNumber: generateInvoiceNumber(inv.representativeId, inv.month),
        month: inv.month,
        totalAmount: inv.totalAmount.toString(),
        discountAmount: ((inv.totalAmount * inv.discountPercent) / 100).toString(),
        finalAmount: inv.finalAmount.toString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: "pending",
        items: [{
          description: `مصرف داده VPN - ${inv.month}`,
          quantity: inv.dataUsageGb.toString(),
          unitPrice: inv.pricePerGb.toString(),
          totalPrice: (inv.dataUsageGb * inv.pricePerGb).toString(),
        }],
      }));

      // Simulate progress
      for (let i = 0; i < invoices.length; i++) {
        setProgress({
          current: i + 1,
          total: invoices.length,
          status: `تولید فاکتور ${i + 1} از ${invoices.length}`,
          errors: []
        });
        await new Promise(resolve => setTimeout(resolve, 200)); // Simulate processing time
      }

      generateInvoicesMutation.mutate(invoices);

    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در تولید فاکتورها",
        variant: "destructive",
      });
      setGenerating(false);
      setProgress(null);
    }
  };

  const handleRepresentativeSelect = (repId: number, checked: boolean) => {
    const newSelected = new Set(selectedReps);
    if (checked) {
      newSelected.add(repId);
    } else {
      newSelected.delete(repId);
    }
    setSelectedReps(newSelected);
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    billingData.forEach((item: BillingData) => {
      months.add(item.month);
    });
    return Array.from(months).sort().reverse();
  };

  const isInvoiceGenerated = (repId: number, month: string) => {
    return existingInvoices.some((inv: any) => 
      inv.representativeId === repId && inv.month === month
    );
  };

  if (repsLoading || billingLoading) {
    return (
      <main className="flex-1 p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">تولید فاکتور</h2>
        <p className="text-gray-600">
          تولید فاکتورهای ماهانه برای نمایندگان بر اساس مصرف داده
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generation Settings */}
        <div className="space-y-6">
          {/* Month Selection */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 ml-2" />
                انتخاب ماه فاکتور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="ماه را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableMonths().map(month => (
                      <SelectItem key={month} value={month}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedMonth && (
                  <Button 
                    onClick={processInvoiceData}
                    className="w-full"
                    variant="outline"
                  >
                    <Calculator className="w-4 h-4 ml-2" />
                    محاسبه فاکتورها
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Invoice Data Preview */}
          {invoiceData.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 ml-2" />
                    لیست فاکتورها ({invoiceData.length})
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      checked={generateAll}
                      onCheckedChange={setGenerateAll}
                    />
                    <span className="text-sm text-gray-600">انتخاب همه</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {invoiceData.map((inv) => {
                    const isGenerated = isInvoiceGenerated(inv.representativeId, inv.month);
                    return (
                      <div
                        key={inv.representativeId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isGenerated ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center">
                          {!generateAll && (
                            <Checkbox
                              checked={selectedReps.has(inv.representativeId)}
                              onCheckedChange={(checked) => 
                                handleRepresentativeSelect(inv.representativeId, checked as boolean)
                              }
                              className="ml-3"
                              disabled={isGenerated}
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {inv.representativeName}
                            </p>
                            <p className="text-sm text-gray-600">
                              @{inv.username} - {inv.dataUsageGb} GB
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(inv.finalAmount)} تومان
                          </p>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            {isGenerated ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                تولید شده
                              </Badge>
                            ) : (
                              <Badge variant="outline">آماده تولید</Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewInvoice(inv)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generation Actions */}
          {invoiceData.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 ml-2" />
                  تولید فاکتورها
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {progress && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{progress.status}</span>
                        <span>{progress.current} از {progress.total}</span>
                      </div>
                      <Progress value={(progress.current / progress.total) * 100} className="h-2" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleGenerateInvoices}
                      disabled={generating || invoiceData.length === 0}
                      className="bg-primary text-white hover:bg-primary/90"
                    >
                      {generating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          در حال تولید فاکتورها...
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4 ml-2" />
                          تولید فاکتورهای PDF
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={generating || invoiceData.length === 0}
                    >
                      <Image className="w-4 h-4 ml-2" />
                      تولید تصاویر فاکتور
                    </Button>

                    <Button
                      variant="outline"
                      disabled={generating || invoiceData.length === 0}
                    >
                      <Download className="w-4 h-4 ml-2" />
                      دانلود همه فاکتورها
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Statistics & Preview */}
        <div className="space-y-6">
          {/* Statistics */}
          {invoiceData.length > 0 && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 ml-2" />
                  آمار تولید فاکتور
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-blue-600 ml-3" />
                      <div>
                        <p className="text-2xl font-bold text-blue-900">
                          {invoiceData.length}
                        </p>
                        <p className="text-sm text-blue-700">فاکتور</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileDown className="w-8 h-8 text-green-600 ml-3" />
                      <div>
                        <p className="text-2xl font-bold text-green-900">
                          {formatCurrency(
                            invoiceData.reduce((sum, inv) => sum + inv.finalAmount, 0)
                          )}
                        </p>
                        <p className="text-sm text-green-700">مجموع مبلغ</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <CheckCircle className="w-8 h-8 text-purple-600 ml-3" />
                      <div>
                        <p className="text-2xl font-bold text-purple-900">
                          {invoiceData.filter(inv => 
                            isInvoiceGenerated(inv.representativeId, inv.month)
                          ).length}
                        </p>
                        <p className="text-sm text-purple-700">تولید شده</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-8 h-8 text-orange-600 ml-3" />
                      <div>
                        <p className="text-2xl font-bold text-orange-900">
                          {invoiceData.filter(inv => 
                            !isInvoiceGenerated(inv.representativeId, inv.month)
                          ).length}
                        </p>
                        <p className="text-sm text-orange-700">در انتظار</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Data State */}
          {!selectedMonth && (
            <Card className="border border-gray-200">
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  انتخاب ماه
                </h3>
                <p className="text-gray-600">
                  برای شروع تولید فاکتور، ابتدا ماه مورد نظر را انتخاب کنید
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </main>
  );
}