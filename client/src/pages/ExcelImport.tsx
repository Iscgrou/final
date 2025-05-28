import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatPersianDate, formatPersianTime, formatFileSize } from "@/lib/utils";
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Download,
  Trash2,
  Eye,
  Calendar,
  Users,
  HardDrive
} from "lucide-react";
import * as XLSX from 'xlsx';
import type { BillingData } from "@shared/schema";

interface ImportedData {
  adminUsername: string;
  dataUsageGb: number;
  month: string;
  rawData: any;
}

interface ProcessedData {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  uniqueUsers: number;
  totalDataUsage: number;
  records: ImportedData[];
  errors: string[];
}

export default function ExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get existing billing data
  const { data: billingHistory = [], isLoading } = useQuery({
    queryKey: ["/api/billing-data"],
  });

  // Save billing data mutation
  const saveBillingDataMutation = useMutation({
    mutationFn: (data: ImportedData[]) =>
      fetch("/api/billing-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(res => {
        if (!res.ok) throw new Error('Failed to save billing data');
        return res.json();
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing-data"] });
      toast({
        title: "موفقیت",
        description: "داده‌های فاکتور با موفقیت ذخیره شد",
      });
      setProcessedData(null);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ذخیره داده‌ها",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/vnd.oasis.opendocument.spreadsheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|ods|csv)$/i)) {
      toast({
        title: "خطا",
        description: "فقط فایل‌های Excel (xlsx, xls)، LibreOffice (ods) یا CSV پشتیبانی می‌شوند",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setProcessedData(null);
  };

  const processExcelFile = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawData = XLSX.utils.sheet_to_json(worksheet);

      // Process and validate data
      const processed = processRawData(rawData);
      setProcessedData(processed);

      if (processed.errors.length > 0) {
        toast({
          title: "هشدار",
          description: `${processed.errors.length} خطا در پردازش داده‌ها پیدا شد`,
          variant: "destructive",
        });
      }

    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در پردازش فایل Excel",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const processRawData = (rawData: any[]): ProcessedData => {
    const errors: string[] = [];
    const validRecords: ImportedData[] = [];
    const uniqueUsers = new Set<string>();
    let totalDataUsage = 0;

    // Generate current month if not specified
    const currentMonth = selectedMonth || new Date().toISOString().slice(0, 7);

    rawData.forEach((row, index) => {
      try {
        // Try to find admin_username field (case insensitive)
        const adminUsername = findFieldValue(row, ['admin_username', 'username', 'admin', 'user']);
        const dataUsage = findFieldValue(row, ['data_usage', 'usage', 'data', 'gb', 'traffic']);

        if (!adminUsername) {
          errors.push(`ردیف ${index + 1}: نام کاربری مدیر پیدا نشد`);
          return;
        }

        if (!dataUsage) {
          errors.push(`ردیف ${index + 1}: مقدار مصرف داده پیدا نشد`);
          return;
        }

        const dataUsageGb = parseFloat(dataUsage);
        if (isNaN(dataUsageGb) || dataUsageGb < 0) {
          errors.push(`ردیف ${index + 1}: مقدار مصرف داده نامعتبر است`);
          return;
        }

        // Convert bytes to GB if needed (if value is very large)
        let finalDataUsage = dataUsageGb;
        if (dataUsageGb > 1000000) {
          finalDataUsage = dataUsageGb / (1024 * 1024 * 1024); // Convert bytes to GB
        } else if (dataUsageGb > 1000) {
          finalDataUsage = dataUsageGb / 1024; // Convert MB to GB
        }

        validRecords.push({
          adminUsername: adminUsername.toString().trim(),
          dataUsageGb: Math.round(finalDataUsage * 1000) / 1000, // Round to 3 decimal places
          month: currentMonth,
          rawData: row,
        });

        uniqueUsers.add(adminUsername.toString().trim());
        totalDataUsage += finalDataUsage;

      } catch (error) {
        errors.push(`ردیف ${index + 1}: خطا در پردازش داده`);
      }
    });

    return {
      totalRecords: rawData.length,
      validRecords: validRecords.length,
      invalidRecords: errors.length,
      uniqueUsers: uniqueUsers.size,
      totalDataUsage: Math.round(totalDataUsage * 1000) / 1000,
      records: validRecords,
      errors,
    };
  };

  const findFieldValue = (row: any, possibleFields: string[]): any => {
    for (const field of possibleFields) {
      // Try exact match first
      if (row[field] !== undefined) return row[field];
      
      // Try case insensitive match
      const keys = Object.keys(row);
      const matchedKey = keys.find(key => key.toLowerCase() === field.toLowerCase());
      if (matchedKey && row[matchedKey] !== undefined) return row[matchedKey];
    }
    return null;
  };

  const handleSaveBillingData = () => {
    if (!processedData?.records) return;
    saveBillingDataMutation.mutate(processedData.records);
  };

  const clearFile = () => {
    setFile(null);
    setProcessedData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getImportStatusBadge = (data: BillingData) => {
    if (data.processed) {
      return <Badge variant="default" className="bg-green-100 text-green-800">پردازش شده</Badge>;
    }
    return <Badge variant="secondary">در انتظار پردازش</Badge>;
  };

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">وارد کردن فایل اکسل</h2>
        <p className="text-gray-600">
          وارد کردن داده‌های مصرف از فایل Excel برای تولید فاکتور
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          {/* File Upload Card */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileSpreadsheet className="w-5 h-5 ml-2" />
                انتخاب فایل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    انتخاب فایل Excel
                  </h3>
                  <p className="text-gray-600 mb-4">
                    فایل‌های Excel (xlsx, xls) یا CSV را انتخاب کنید
                  </p>
                  <Button variant="outline">انتخاب فایل</Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.ods,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {file && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-primary ml-3" />
                        <div>
                          <p className="font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatFileSize(file.size)} - {formatPersianDate(new Date(file.lastModified))}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={clearFile}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Month Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    ماه مربوطه (اختیاری)
                  </label>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-gray-600">
                    اگر خالی باشد، ماه جاری انتخاب می‌شود
                  </p>
                </div>

                {file && !processedData && (
                  <Button 
                    onClick={processExcelFile} 
                    disabled={importing}
                    className="w-full"
                  >
                    {importing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                        در حال پردازش...
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 ml-2" />
                        بررسی و پردازش فایل
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Processing Results */}
          {processedData && (
            <Card className="border border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 ml-2 text-green-600" />
                  نتایج پردازش
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <FileText className="w-8 h-8 text-blue-600 ml-3" />
                        <div>
                          <p className="text-2xl font-bold text-blue-900">
                            {processedData.totalRecords}
                          </p>
                          <p className="text-sm text-blue-700">کل رکوردها</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="w-8 h-8 text-green-600 ml-3" />
                        <div>
                          <p className="text-2xl font-bold text-green-900">
                            {processedData.validRecords}
                          </p>
                          <p className="text-sm text-green-700">رکوردهای معتبر</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-purple-600 ml-3" />
                        <div>
                          <p className="text-2xl font-bold text-purple-900">
                            {processedData.uniqueUsers}
                          </p>
                          <p className="text-sm text-purple-700">کاربران منحصر به فرد</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <HardDrive className="w-8 h-8 text-orange-600 ml-3" />
                        <div>
                          <p className="text-2xl font-bold text-orange-900">
                            {processedData.totalDataUsage.toFixed(2)}
                          </p>
                          <p className="text-sm text-orange-700">مجموع مصرف (GB)</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>میزان موفقیت</span>
                      <span>{Math.round((processedData.validRecords / processedData.totalRecords) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(processedData.validRecords / processedData.totalRecords) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Errors */}
                  {processedData.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 ml-2" />
                        <h4 className="font-medium text-red-900">خطاهای پردازش</h4>
                      </div>
                      <div className="max-h-32 overflow-y-auto">
                        {processedData.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-700 mb-1">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  {processedData.validRecords > 0 && (
                    <Button 
                      onClick={handleSaveBillingData}
                      disabled={saveBillingDataMutation.isPending}
                      className="w-full bg-primary text-white hover:bg-primary/90"
                    >
                      {saveBillingDataMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                          در حال ذخیره...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 ml-2" />
                          ذخیره داده‌های فاکتور ({processedData.validRecords} رکورد)
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Import History */}
        <div>
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 ml-2" />
                تاریخچه وارد کردن
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </>
                ) : billingHistory.length > 0 ? (
                  billingHistory.slice(0, 10).map((item: BillingData) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.adminUsername}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.dataUsageGb} GB - {formatPersianDate(item.importedAt)}
                        </p>
                        <p className="text-xs text-gray-500">
                          ماه: {item.month}
                        </p>
                      </div>
                      <div className="text-left">
                        {getImportStatusBadge(item)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileSpreadsheet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      هیچ داده‌ای وارد نشده
                    </h3>
                    <p className="text-gray-600">
                      اولین فایل Excel خود را وارد کنید
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}