import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, formatPersianDate, createTelegramLink, validateTelegramUsername } from "@/lib/utils";
import { 
  MessageSquare, 
  Send, 
  Users,
  AlertTriangle,
  CheckCircle,
  Copy,
  ExternalLink,
  Search,
  Filter,
  Download,
  Eye,
  MessageCircle,
  Link,
  UserCheck,
  UserX,
  Zap
} from "lucide-react";
import TelegramMessagePreview from "@/components/TelegramMessagePreview";
import type { Representative, Invoice } from "@shared/schema";

interface TelegramContact {
  representative: Representative;
  hasTelegram: boolean;
  telegramLink?: string;
  lastSent?: Date;
  invoiceCount: number;
  pendingAmount: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
}

export default function TelegramManager() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [messageTemplate, setMessageTemplate] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewContact, setPreviewContact] = useState<TelegramContact | null>(null);
  const { toast } = useToast();

  // Get representatives
  const { data: representatives = [], isLoading: repsLoading } = useQuery({
    queryKey: ["/api/representatives"],
  });

  // Get invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Prepare telegram contacts data
  const telegramContacts: TelegramContact[] = representatives.map((rep: Representative) => {
    const repInvoices = invoices.filter((inv: Invoice) => inv.representativeId === rep.id);
    const pendingInvoices = repInvoices.filter((inv: Invoice) => inv.status === "pending");
    const totalPending = pendingInvoices.reduce((sum: number, inv: Invoice) => 
      sum + parseFloat(inv.finalAmount), 0
    );

    return {
      representative: rep,
      hasTelegram: !!(rep.telegramId || rep.telegramUsername),
      telegramLink: rep.telegramUsername || rep.telegramId 
        ? createTelegramLink(rep.telegramUsername || rep.telegramId) 
        : undefined,
      invoiceCount: repInvoices.length,
      pendingAmount: totalPending.toString(),
    };
  });

  // Filter contacts
  const filteredContacts = telegramContacts.filter(contact => {
    const matchesSearch = contact.representative.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.representative.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" ||
                         (statusFilter === "has_telegram" && contact.hasTelegram) ||
                         (statusFilter === "no_telegram" && !contact.hasTelegram) ||
                         (statusFilter === "pending_invoices" && parseFloat(contact.pendingAmount) > 0);
    
    return matchesSearch && matchesStatus;
  });

  // Message templates
  const messageTemplates: MessageTemplate[] = [
    {
      id: "invoice_notification",
      name: "اطلاع‌رسانی فاکتور جدید",
      content: `سلام {{name}} عزیز 👋

فاکتور ماهانه شما برای دوره {{month}} آماده شده است.

📋 جزئیات فاکتور:
• مصرف: {{usage}} گیگابایت
• مبلغ: {{amount}} تومان
• مهلت پرداخت: {{dueDate}}

لطفاً جهت مشاهده و پرداخت فاکتور اقدام فرمایید.

🔗 لینک فاکتور: {{invoiceLink}}

با تشکر
سیستم مدیریت VPN`,
      variables: ["name", "month", "usage", "amount", "dueDate", "invoiceLink"]
    },
    {
      id: "payment_reminder",
      name: "یادآوری پرداخت",
      content: `سلام {{name}} عزیز 🔔

یادآوری دوستانه برای پرداخت فاکتور:

💰 مبلغ قابل پرداخت: {{amount}} تومان
📅 مهلت پرداخت: {{dueDate}}
⏰ روزهای باقی‌مانده: {{daysLeft}}

لطفاً در اسرع وقت نسبت به پرداخت اقدام فرمایید.

با تشکر`,
      variables: ["name", "amount", "dueDate", "daysLeft"]
    },
    {
      id: "welcome_message",
      name: "خوش‌آمدگویی",
      content: `سلام {{name}} عزیز 🎉

به سیستم VPN ما خوش آمدید!

🌟 امکانات شما:
• دسترسی نامحدود
• پشتیبانی ۲۴ساعته
• کیفیت بالا

در صورت نیاز به راهنمایی با ما در ارتباط باشید.

موفق باشید! 🚀`,
      variables: ["name"]
    }
  ];

  const handleContactSelect = (contactId: number, checked: boolean) => {
    const newSelected = new Set(selectedContacts);
    if (checked) {
      newSelected.add(contactId);
    } else {
      newSelected.delete(contactId);
    }
    setSelectedContacts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const telegramContacts = filteredContacts
        .filter(contact => contact.hasTelegram)
        .map(contact => contact.representative.id);
      setSelectedContacts(new Set(telegramContacts));
    } else {
      setSelectedContacts(new Set());
    }
  };

  const copyTelegramLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: "موفقیت",
      description: "لینک تلگرام کپی شد",
    });
  };

  const openTelegramLink = (link: string) => {
    window.open(link, '_blank');
  };

  const generateMessage = (contact: TelegramContact, template: string): string => {
    const rep = contact.representative;
    const pendingInvoices = invoices.filter((inv: Invoice) => 
      inv.representativeId === rep.id && inv.status === "pending"
    );
    
    let message = template;
    
    // Replace variables
    message = message.replace(/{{name}}/g, rep.name);
    message = message.replace(/{{username}}/g, rep.username);
    message = message.replace(/{{amount}}/g, formatCurrency(contact.pendingAmount));
    message = message.replace(/{{invoiceCount}}/g, contact.invoiceCount.toString());
    
    if (pendingInvoices.length > 0) {
      const latestInvoice = pendingInvoices[0];
      message = message.replace(/{{month}}/g, latestInvoice.month);
      message = message.replace(/{{dueDate}}/g, formatPersianDate(latestInvoice.dueDate));
      message = message.replace(/{{invoiceLink}}/g, `${window.location.origin}/invoice/${latestInvoice.id}`);
    }
    
    return message;
  };

  const previewMessage = (contact: TelegramContact) => {
    setPreviewContact(contact);
    setShowPreview(true);
  };

  const handleSendMessages = () => {
    const selectedContactsData = filteredContacts.filter(contact => 
      selectedContacts.has(contact.representative.id) && contact.hasTelegram
    );

    if (selectedContactsData.length === 0) {
      toast({
        title: "خطا",
        description: "هیچ مخاطبی انتخاب نشده",
        variant: "destructive",
      });
      return;
    }

    const template = messageTemplate || customMessage;
    if (!template.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً پیام یا الگوی پیام را انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    // Generate individual Telegram links for manual sending
    const telegramLinks = selectedContactsData.map(contact => {
      const message = generateMessage(contact, template);
      const encodedMessage = encodeURIComponent(message);
      const telegramUsername = contact.representative.telegramUsername?.replace('@', '') || 
                              contact.representative.telegramId;
      
      return {
        name: contact.representative.name,
        link: `https://t.me/${telegramUsername}?text=${encodedMessage}`,
        directLink: createTelegramLink(telegramUsername || ''),
      };
    });

    // Open links in new tabs (browser might block multiple popups)
    telegramLinks.forEach((item, index) => {
      setTimeout(() => {
        window.open(item.link, `_blank_${index}`);
      }, index * 500); // Stagger opening to avoid blocking
    });

    toast({
      title: "موفقیت",
      description: `${telegramLinks.length} لینک تلگرام در تب‌های جدید باز شد`,
    });
  };

  const exportContactList = () => {
    const data = filteredContacts.map(contact => ({
      'نام': contact.representative.name,
      'نام کاربری': contact.representative.username,
      'شناسه تلگرام': contact.representative.telegramId || 'ندارد',
      'نام کاربری تلگرام': contact.representative.telegramUsername || 'ندارد',
      'تعداد فاکتور': contact.invoiceCount,
      'مبلغ معوق': contact.pendingAmount,
      'وضعیت تلگرام': contact.hasTelegram ? 'دارد' : 'ندارد',
    }));

    const csvContent = "data:text/csv;charset=utf-8," + 
      Object.keys(data[0]).join(",") + "\n" +
      data.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `telegram_contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (repsLoading || invoicesLoading) {
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

  const telegramContactsCount = telegramContacts.filter(c => c.hasTelegram).length;
  const missingContactsCount = telegramContacts.filter(c => !c.hasTelegram).length;
  const pendingInvoicesCount = telegramContacts.filter(c => parseFloat(c.pendingAmount) > 0).length;

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">مدیریت تلگرام</h2>
        <p className="text-gray-600">
          ارسال فاکتورها و مدیریت ارتباطات تلگرام با نمایندگان
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{telegramContactsCount}</p>
                <p className="text-sm text-gray-600">دارای تلگرام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100">
                <UserX className="w-6 h-6 text-red-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{missingContactsCount}</p>
                <p className="text-sm text-gray-600">بدون تلگرام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{pendingInvoicesCount}</p>
                <p className="text-sm text-gray-600">فاکتور معوق</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="mr-4">
                <p className="text-2xl font-bold text-gray-900">{selectedContacts.size}</p>
                <p className="text-sm text-gray-600">انتخاب شده</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contacts List */}
        <div className="space-y-6">
          {/* Filters */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 ml-2" />
                  لیست مخاطبین ({filteredContacts.length})
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" onClick={exportContactList}>
                    <Download className="w-4 h-4 ml-1" />
                    خروجی
                  </Button>
                  <Checkbox
                    checked={selectedContacts.size === telegramContactsCount && telegramContactsCount > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">انتخاب همه</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="جستجو در نام یا نام کاربری..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="فیلتر وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="has_telegram">دارای تلگرام</SelectItem>
                      <SelectItem value="no_telegram">بدون تلگرام</SelectItem>
                      <SelectItem value="pending_invoices">فاکتور معوق</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contacts */}
          <Card className="border border-gray-200">
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.representative.id}
                    className="flex items-center justify-between p-4 border-b border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      {contact.hasTelegram && (
                        <Checkbox
                          checked={selectedContacts.has(contact.representative.id)}
                          onCheckedChange={(checked) => 
                            handleContactSelect(contact.representative.id, checked as boolean)
                          }
                          className="ml-3"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">
                          {contact.representative.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          @{contact.representative.username}
                        </p>
                        {parseFloat(contact.pendingAmount) > 0 && (
                          <p className="text-sm text-orange-600">
                            معوق: {formatCurrency(contact.pendingAmount)} تومان
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 space-x-reverse">
                      {contact.hasTelegram ? (
                        <>
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            تلگرام ✓
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewMessage(contact)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyTelegramLink(contact.telegramLink!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTelegramLink(contact.telegramLink!)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <Badge variant="destructive">بدون تلگرام</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Composer */}
        <div className="space-y-6">
          {/* Message Templates */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="w-5 h-5 ml-2" />
                الگوهای پیام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select value={messageTemplate} onValueChange={setMessageTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب الگوی پیام" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTemplates.map(template => (
                      <SelectItem key={template.id} value={template.content}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {messageTemplate && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">پیش‌نمایش الگو:</p>
                    <div className="text-sm bg-white rounded p-3 border whitespace-pre-wrap">
                      {messageTemplate}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custom Message */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 ml-2" />
                پیام سفارشی
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  placeholder="پیام سفارشی خود را بنویسید... (از متغیرهای {{name}}, {{amount}}, {{month}} استفاده کنید)"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="min-h-32"
                />
                
                <div className="text-xs text-gray-500">
                  <p className="mb-1">متغیرهای موجود:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <span>{{`{name}`}} - نام نماینده</span>
                    <span>{{`{username}`}} - نام کاربری</span>
                    <span>{{`{amount}`}} - مبلغ فاکتور</span>
                    <span>{{`{month}`}} - ماه فاکتور</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Send Actions */}
          <Card className="border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="w-5 h-5 ml-2" />
                ارسال پیام‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start">
                    <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 ml-2" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">نحوه ارسال:</p>
                      <p>با کلیک روی دکمه ارسال، لینک‌های تلگرام با پیام از پیش تنظیم شده در تب‌های جدید باز می‌شوند. شما می‌توانید به صورت دستی پیام‌ها را ارسال کنید.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Button
                    onClick={handleSendMessages}
                    disabled={selectedContacts.size === 0 || (!messageTemplate && !customMessage.trim())}
                    className="bg-primary text-white hover:bg-primary/90"
                  >
                    <Send className="w-4 h-4 ml-2" />
                    ارسال به {selectedContacts.size} مخاطب
                  </Button>

                  <Button
                    variant="outline"
                    disabled={selectedContacts.size === 0}
                    onClick={() => {
                      const links = Array.from(selectedContacts).map(id => {
                        const contact = telegramContacts.find(c => c.representative.id === id);
                        return contact?.telegramLink;
                      }).filter(Boolean);
                      
                      const linksText = links.join('\n');
                      navigator.clipboard.writeText(linksText);
                      toast({
                        title: "موفقیت",
                        description: "لینک‌های تلگرام کپی شدند",
                      });
                    }}
                  >
                    <Copy className="w-4 h-4 ml-2" />
                    کپی لینک‌های تلگرام
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  انتخاب شده: {selectedContacts.size} از {telegramContactsCount} مخاطب
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Message Preview Modal */}
      {showPreview && previewContact && (
        <TelegramMessagePreview
          contact={previewContact}
          message={generateMessage(previewContact, messageTemplate || customMessage)}
          onClose={() => setShowPreview(false)}
        />
      )}
    </main>
  );
}