import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Lease = Tables<"leases">;

interface LeaseCardProps {
  lease: Lease;
  onViewDetails?: (leaseId: string) => void;
  onPayRent?: (leaseId: string) => void;
  showActions?: boolean;
}

export function LeaseCard({ lease, onViewDetails, onPayRent, showActions = true }: LeaseCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "default";
      case "Pending":
        return "secondary";
      case "Completed":
        return "outline";
      case "Cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">Lease #{lease.lease_id.slice(0, 8)}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <CalendarDays className="h-4 w-4" />
              <span>
                {new Date(lease.start_date).toLocaleDateString()} - {new Date(lease.end_date).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Badge variant={getStatusColor(lease.status)}>
            {lease.status}
          </Badge>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Monthly Rent:</span>
            <span className="font-semibold flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {lease.monthly_rent.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Security Deposit:</span>
            <span className="font-semibold flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              {lease.security_deposit.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Billing Cycle:</span>
            <span className="font-semibold">{lease.billing_cycle}</span>
          </div>
        </div>

        {showActions && (
          <div className="flex gap-2">
            {onViewDetails && (
              <Button size="sm" variant="outline" onClick={() => onViewDetails(lease.lease_id)}>
                View Details
              </Button>
            )}
            {onPayRent && lease.status === "Active" && (
              <Button size="sm" onClick={() => onPayRent(lease.lease_id)}>
                Pay Rent
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
