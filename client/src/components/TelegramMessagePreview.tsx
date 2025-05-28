import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, createTelegramLink } from "@/lib/utils";
import { Copy, ExternalLink, Send, X, MessageSquare, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TelegramContact {
  representative: {
    id: number;
    name: string;
    username: string;
    telegramId?: string | null;
    telegramUsername?: string | null;
  };
  hasTelegram: boolean;
  telegramLink?: string;
  pendingAmount: string;
}

interface TelegramMessagePreviewProps {
  contact: TelegramContact;
  message: string;
  onClose: () => void;
}

export default function TelegramMessagePreview({ contact, message, onClose }: TelegramMessagePreviewProps) {
  const { toast } = useToast();

  const copyMessage = () => {
    navigator.clipboard.writeText(message);
    toast({
      title: "موفقیت",
      description: "پیام کپی شد",
    });
  };

  const openTelegramWithMessage = () => {
    const encodedMessage = encodeURIComponent(message);
    const telegramUsername = contact.representative.telegramUsername?.replace('@', '') || 
                            contact.representative.telegramId;
    
    if (telegramUsername) {
      const telegramLink = `https://t.me/${telegramUsername}?text=${encodedMessage}`;
      window.open(telegramLink, '_blank');
    }
  };

  const openTelegramProfile = () => {
    if (contact.telegramLink) {
      window.open(contact.telegramLink, '_blank');
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 ml-2" />
              پیش‌نمایش پیام تلگرام
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Info */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold ml-4">
                    {contact.representative.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{contact.representative.name}</h3>
                    <p className="text-sm text-gray-600">@{contact.representative.username}</p>
                    <div className="flex items-center space-x-2 space-x-reverse mt-1">
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        تلگرام متصل
                      </Badge>
                      {parseFloat(contact.pendingAmount) > 0 && (
                        <Badge variant="destructive">
                          معوق: {formatCurrency(contact.pendingAmount)} تومان
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Button variant="outline" size="sm" onClick={openTelegramProfile}>
                    <User className="w-4 h-4 ml-1" />
                    پروفایل
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Preview */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">محتوای پیام:</h4>
                  <div className="text-sm text-gray-500">
                    {message.length} کاراکتر
                  </div>
                </div>
                
                {/* Telegram-style message preview */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-1">
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-start space-x-3 space-x-reverse">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        VPN
                      </div>
                      <div className="flex-1">
                        <div className="bg-blue-50 rounded-lg p-3 text-right">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-medium leading-relaxed">
                            {message}
                          </pre>
                        </div>
                        <div className="text-xs text-gray-500 mt-2 text-right">
                          ارسال شده در تلگرام • الان
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Telegram Info */}
          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">اطلاعات تلگرام:</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {contact.representative.telegramId && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">شناسه تلگرام:</p>
                      <p className="font-mono text-sm font-medium">{contact.representative.telegramId}</p>
                    </div>
                  )}
                  
                  {contact.representative.telegramUsername && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-600 mb-1">نام کاربری تلگرام:</p>
                      <p className="font-mono text-sm font-medium">{contact.representative.telegramUsername}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 space-x-reverse pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={copyMessage}>
              <Copy className="w-4 h-4 ml-2" />
              کپی پیام
            </Button>
            
            <Button variant="outline" onClick={openTelegramProfile}>
              <ExternalLink className="w-4 h-4 ml-2" />
              باز کردن تلگرام
            </Button>
            
            <Button 
              onClick={openTelegramWithMessage}
              className="bg-blue-500 text-white hover:bg-blue-600"
            >
              <Send className="w-4 h-4 ml-2" />
              ارسال در تلگرام
            </Button>
          </div>

          {/* Usage Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5 ml-2" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">راهنمای ارسال:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>روی دکمه "ارسال در تلگرام" کلیک کنید</li>
                  <li>تلگرام با پیام از پیش تنظیم شده باز می‌شود</li>
                  <li>روی دکمه ارسال در تلگرام کلیک کنید</li>
                  <li>پیام به نماینده ارسال خواهد شد</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}