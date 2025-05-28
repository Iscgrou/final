import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatPersianDate, createTelegramLink } from "@/lib/utils";
import { 
  UserPlus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  MessageSquare, 
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import RepresentativeDialog from "@/components/RepresentativeDialog";
import type { Representative } from "@shared/schema";

export default function Representatives() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [telegramFilter, setTelegramFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<Representative | null>(null);
  const { toast } = useToast();

  const { data: representatives = [], isLoading } = useQuery({
    queryKey: ["/api/representatives"],
  });

  const deleteRepMutation = useMutation({
    mutationFn: (id: number) => fetch(`/api/representatives/${id}`, {
      method: "DELETE",
    }).then(res => {
      if (!res.ok) throw new Error('Failed to delete');
      return res;
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/representatives"] });
      toast({
        title: "موفقیت",
        description: "نماینده با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در حذف نماینده",
        variant: "destructive",
      });
    },
  });

  const filteredRepresentatives = representatives.filter((rep: Representative) => {
    const matchesSearch = rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rep.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || rep.status === statusFilter;
    const matchesTelegram = telegramFilter === "all" ||
                           (telegramFilter === "has_telegram" && rep.telegramId) ||
                           (telegramFilter === "no_telegram" && !rep.telegramId);
    
    return matchesSearch && matchesStatus && matchesTelegram;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">فعال</Badge>;
      case "inactive":
        return <Badge variant="secondary">غیرفعال</Badge>;
      case "suspended":
        return <Badge variant="destructive">معلق</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').substring(0, 2);
  };

  const handleEdit = (rep: Representative) => {
    setEditingRep(rep);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`آیا از حذف نماینده "${name}" اطمینان دارید؟`)) {
      deleteRepMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingRep(null);
  };

  if (isLoading) {
    return (
      <main className="flex-1 p-6">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">مدیریت نمایندگان</h2>
            <p className="text-gray-600">
              مجموع {representatives.length} نماینده در سیستم
            </p>
          </div>
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <UserPlus className="w-4 h-4 ml-2" />
            افزودن نماینده جدید
          </Button>
        </div>

        {/* Filters */}
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <SelectValue placeholder="وضعیت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">فعال</SelectItem>
                  <SelectItem value="inactive">غیرفعال</SelectItem>
                  <SelectItem value="suspended">معلق</SelectItem>
                </SelectContent>
              </Select>

              <Select value={telegramFilter} onValueChange={setTelegramFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="تلگرام" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه</SelectItem>
                  <SelectItem value="has_telegram">دارای تلگرام</SelectItem>
                  <SelectItem value="no_telegram">بدون تلگرام</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center text-sm text-gray-600">
                <Filter className="w-4 h-4 ml-2" />
                {filteredRepresentatives.length} نتیجه یافت شد
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Representatives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRepresentatives.map((rep: Representative) => (
          <Card key={rep.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="w-12 h-12 bg-primary text-white">
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(rep.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="mr-3">
                    <h3 className="font-semibold text-gray-900">{rep.name}</h3>
                    <p className="text-sm text-gray-600">@{rep.username}</p>
                  </div>
                </div>
                {getStatusBadge(rep.status)}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Contact Information */}
                <div className="space-y-2">
                  {rep.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 ml-2" />
                      {rep.phone}
                    </div>
                  )}
                  {rep.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 ml-2" />
                      {rep.email}
                    </div>
                  )}
                  {rep.telegramId ? (
                    <div className="flex items-center text-sm text-gray-600">
                      <MessageSquare className="w-4 h-4 ml-2" />
                      <a 
                        href={createTelegramLink(rep.telegramUsername || rep.telegramId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {rep.telegramUsername || rep.telegramId}
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-red-600">
                      <AlertTriangle className="w-4 h-4 ml-2" />
                      بدون شناسه تلگرام
                    </div>
                  )}
                </div>

                {/* Pricing Information */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">قیمت هر گیگابایت</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(rep.pricePerGb)} تومان
                    </span>
                  </div>
                  {rep.discountPercent && parseFloat(rep.discountPercent) > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">تخفیف</span>
                      <span className="text-secondary font-semibold">
                        {formatCurrency(rep.discountPercent)}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Special Badges */}
                <div className="flex flex-wrap gap-2">
                  {rep.isSpecialOffer && (
                    <Badge variant="outline" className="text-accent">پیشنهاد ویژه</Badge>
                  )}
                  {rep.isFreeUser && (
                    <Badge variant="outline" className="text-secondary">کاربر رایگان</Badge>
                  )}
                  {rep.parentRepId && (
                    <Badge variant="outline" className="text-gray-600">
                      <Users className="w-3 h-3 ml-1" />
                      زیرمجموعه
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(rep)}
                    className="text-primary hover:text-primary/80"
                  >
                    <Edit className="w-4 h-4 ml-1" />
                    ویرایش
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(rep.id, rep.name)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRepresentatives.length === 0 && (
        <Card className="border border-gray-200">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              هیچ نماینده‌ای یافت نشد
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== "all" || telegramFilter !== "all"
                ? "تغییر فیلترها را امتحان کنید"
                : "اولین نماینده خود را اضافه کنید"}
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <UserPlus className="w-4 h-4 ml-2" />
              افزودن نماینده جدید
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Representative Dialog */}
      <RepresentativeDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        representative={editingRep}
      />
    </main>
  );
}