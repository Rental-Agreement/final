import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePropertyViews } from "@/hooks/use-property-views";
import { formatINR } from "@/lib/utils";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function RecentlyViewedSection() {
  const { data: views, isLoading } = usePropertyViews();

  if (isLoading) return null;
  if (!views || views.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Recently Viewed</h2>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {views.slice(0, 6).map((view: any) => {
          const property = view.properties;
          if (!property) return null;
          
          return (
            <Card key={view.view_id} className="min-w-[280px] hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-0">
                {property.images?.[0] && (
                  <img
                    src={property.images[0]}
                    alt={property.address}
                    className="w-full h-40 object-cover rounded-t-lg"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2">{property.address}</h3>
                  <div className="text-xs text-muted-foreground mb-2">{property.city}</div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{formatINR(property.price_per_room)}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(view.viewed_at), { addSuffix: true })}
                    </span>
                  </div>
                  {property.rating && (
                    <div className="text-xs mt-2 flex items-center gap-1">
                      <span className="text-yellow-600">★</span>
                      <span>{property.rating}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
