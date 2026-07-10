import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: { value: number; label: string };
}

export function StatCard({
  title,
  value,
  subValue,
  icon: Icon,
  trend,
}: StatCardProps) {
  return (
    <Card className="border-border bg-white dark:bg-[#020617] shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6B7280]/10">
            <Icon className="h-5 w-5 text-[#6B7280] dark:text-[#9CA3AF]" />
          </div>
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subValue && (
          <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
        )}
        {trend && (
          <div className="flex items-center gap-1 mt-2">
            {trend.value > 0 ? (
              <TrendingUp className="h-3 w-3 text-[#6B7280]" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span
              className={`text-xs font-medium ${
                trend.value > 0 ? "text-[#6B7280]" : "text-red-500"
              }`}
            >
              {Math.abs(trend.value)}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
