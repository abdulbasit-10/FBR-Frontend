import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 } from "lucide-react";

interface ProfileCardProps {
  company: {
    name: string;
    companyId: string;
    ntn: string;
    province: string;
    city: string;
    licenseExpiry: string;
  };
}

export function ProfileCard({ company }: ProfileCardProps) {
  return (
    <Card className="border-border bg-white dark:bg-[#020617] shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">
            Company Profile
          </CardTitle>
          <Building2 className="h-5 w-5 text-[#6B7280]" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Company Name</span>
          <span className="text-sm font-semibold text-foreground">{company.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Company ID</span>
          <span className="text-sm text-foreground">{company.companyId}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">NTN</span>
          <span className="text-sm text-foreground">{company.ntn}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Province</span>
          <span className="text-sm text-foreground">{company.province}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">City</span>
          <span className="text-sm text-foreground">{company.city}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">License Expiry</span>
          <span className="text-sm text-foreground">{company.licenseExpiry}</span>
        </div>
        <Button className="w-full mt-2 bg-[#6B7280] hover:bg-[#4B5563] text-white">
          Open Company Profile
        </Button>
      </CardContent>
    </Card>
  );
}
