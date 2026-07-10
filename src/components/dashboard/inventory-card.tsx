import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

interface InventoryCardProps {
  inventory: {
    totalItems: number;
    stockAvailable: number;
    lowStockItems: number;
    inventoryAdjustments: { unposted: number; posted: number };
  };
}

export function InventoryCard({ inventory }: InventoryCardProps) {
  return (
    <Card className="border-border bg-white dark:bg-[#020617] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Inventory Management
          </CardTitle>
          <Package className="h-5 w-5 text-[#6B7280]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-xl font-bold text-foreground">{inventory.totalItems}</div>
            <div className="text-xs text-muted-foreground">Total Items</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-[#6B7280]">{inventory.stockAvailable}</div>
            <div className="text-xs text-muted-foreground">In Stock</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-orange-500">{inventory.lowStockItems}</div>
            <div className="text-xs text-muted-foreground">Low Stock</div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
          <span className="text-sm text-muted-foreground">Unposted Adjustments</span>
          <span className="text-sm font-bold text-foreground">{inventory.inventoryAdjustments.unposted}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
          <span className="text-sm text-muted-foreground">Posted Adjustments</span>
          <span className="text-sm font-bold text-foreground">{inventory.inventoryAdjustments.posted}</span>
        </div>
      </CardContent>
    </Card>
  );
}
