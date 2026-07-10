import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

interface QuickTipsCardProps {
  tips: string[];
}

export function QuickTipsCard({ tips }: QuickTipsCardProps) {
  return (
    <Card className="border-border bg-white dark:bg-[#020617] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Quick Tips
          </CardTitle>
          <Info className="h-5 w-5 text-[#6B7280]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tips.map((tip, index) => (
          <div
            key={index}
            className="flex items-start gap-2 rounded-lg bg-gray-50 dark:bg-gray-900 p-3"
          >
            <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#6B7280]/10">
              <span className="text-xs font-bold text-[#6B7280]">{index + 1}</span>
            </div>
            <p className="text-sm text-muted-foreground">{tip}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
