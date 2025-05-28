import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";

interface TopRepresentativesProps {
  data?: Array<{
    id: number;
    name: string;
    username: string;
    revenue: string;
  }>;
  isLoading: boolean;
}

export default function TopRepresentatives({ data, isLoading }: TopRepresentativesProps) {
  if (isLoading || !data) {
    return (
      <Card className="border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="mr-3 space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-left space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const getInitials = (name: string) => {
    return name.charAt(0);
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      'bg-primary text-white',
      'bg-secondary text-white',
      'bg-accent text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
    ];
    return colors[index % colors.length];
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            برترین نمایندگان
          </CardTitle>
          <Link href="/representatives">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
              مشاهده همه
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((rep, index) => (
            <div
              key={rep.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center">
                <Avatar className={`w-10 h-10 ${getAvatarColor(index)}`}>
                  <AvatarFallback className={getAvatarColor(index)}>
                    {getInitials(rep.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="mr-3">
                  <p className="font-medium text-gray-900">{rep.name}</p>
                  <p className="text-sm text-gray-600">@{rep.username}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(rep.revenue)}
                </p>
                <p className="text-sm text-gray-600">تومان</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
