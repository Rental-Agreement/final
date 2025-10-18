import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Home, DollarSign } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties"> & {
  rooms?: Tables<"rooms">[];
};

interface PropertyCardProps {
  property: Property;
  onApply?: (propertyId: string) => void;
  onView?: (propertyId: string) => void;
  showActions?: boolean;
}

export function PropertyCard({ property, onApply, onView, showActions = true }: PropertyCardProps) {
  const totalRooms = property.rooms?.length || 0;
  const availableRooms = property.rooms?.filter((r: any) => !r.is_occupied).length || 0;
  const minRent = property.rooms && property.rooms.length > 0
    ? Math.min(...property.rooms.map((r: any) => Number(r.rent_price || 0)))
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{(property as any).property_type || "Property"}</CardTitle>
          </div>
          {totalRooms > 0 && (
            <Badge variant={availableRooms > 0 ? "default" : "secondary"}>
              {availableRooms > 0 ? "Available" : "Full"}
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-1 mt-2">
          <MapPin className="h-4 w-4" />
          {(property as any).address || (property as any).address_line_1}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {property.city}, {property.state} {property.zip_code}
        </p>
        {totalRooms > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Home className="h-4 w-4" />
            <span>{totalRooms} rooms ({availableRooms} available)</span>
          </div>
        )}
        {minRent !== null && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <DollarSign className="h-4 w-4" />
            <span>From ${minRent}/month</span>
          </div>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          {onView && (
            <Button variant="outline" onClick={() => onView(property.property_id)}>
              View Details
            </Button>
          )}
          {onApply && (
            <Button onClick={() => onApply(property.property_id)}>
              Apply
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
