import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  X, 
  Send, 
  Copy, 
  ExternalLink, 
  MessageSquare, 
  User,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { createTelegramLink } from "@/lib/utils";

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

  const openTelegram = () => {
    if (contact.telegramLink) {
      window.open(contact.telegramLink, '_blank');
    } else {
      toast({
        title: "خطا",
        description: "لینک تلگرام موجود نیست",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
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
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <User className="w-4 h-4 ml-2" />
                اطلاعات مخاطب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نام:</span>
                <span className="font-medium">{contact.representative.name}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">نام کاربری:</span>
                <span className="font-medium">{contact.representative.username}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">مبلغ معوقه:</span>
                <span className="font-bold text-red-600">{contact.pendingAmount}</span>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="text-gray-600">وضعیت تلگرام:</span>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {contact.hasTelegram ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <Badge className="bg-green-100 text-green-800">
                        موجود
                      </Badge>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <Badge variant="destructive">
                        ناموجود
                      </Badge>
                    </>
                  )}
                </div>
              </div>

              {contact.representative.telegramUsername && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">نام کاربری تلگرام:</span>
                  <span className="font-medium text-blue-600">
                    {contact.representative.telegramUsername}
                  </span>
                </div>
              )}

              {contact.representative.telegramId && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">شناسه تلگرام:</span>
                  <span className="font-medium text-blue-600">
                    {contact.representative.telegramId}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Message Preview */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">پیش‌نمایش پیام</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3 space-x-reverse">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-3 shadow-sm">
                      <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                        {message}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-3 space-x-reverse">
            <Button
              variant="outline"
              onClick={copyMessage}
            >
              <Copy className="w-4 h-4 ml-2" />
              کپی پیام
            </Button>

            {contact.hasTelegram ? (
              <Button
                onClick={openTelegram}
                className="bg-blue-500 text-white hover:bg-blue-600"
              >
                <Send className="w-4 h-4 ml-2" />
                ارسال در تلگرام
              </Button>
            ) : (
              <Button
                disabled
                variant="outline"
                className="opacity-50 cursor-not-allowed"
              >
                <AlertTriangle className="w-4 h-4 ml-2" />
                تلگرام ناموجود
              </Button>
            )}
          </div>

          {/* Instructions */}
          <Card className="border border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">دستورالعمل ارسال:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>ابتدا پیام را کپی کنید</li>
                    <li>روی دکمه "ارسال در تلگرام" کلیک کنید</li>
                    <li>تلگرام باز شده و پیام را ارسال کنید</li>
                    <li>پس از ارسال، وضعیت را در سیستم بروزرسانی کنید</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}