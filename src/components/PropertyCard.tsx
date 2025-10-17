import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, Home } from "lucide-react";
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
  const availableRooms = property.rooms?.filter(r => r.status === "Available").length || 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">{property.type || "Property"}</CardTitle>
          </div>
          <Badge variant={property.status === "Available" ? "default" : "secondary"}>
            {property.status}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1 mt-2">
          <MapPin className="h-4 w-4" />
          {property.address_line_1}
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
        {property.is_approved ? (
          <Badge variant="outline" className="mt-2">Verified</Badge>
        ) : (
          <Badge variant="secondary" className="mt-2">Pending Approval</Badge>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex gap-2">
          {onView && (
            <Button variant="outline" onClick={() => onView(property.property_id)}>
              View Details
            </Button>
          )}
          {onApply && property.status === "Available" && (
            <Button onClick={() => onApply(property.property_id)}>
              Apply
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
