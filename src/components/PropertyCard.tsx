import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Property = Tables<"properties"> & {
  rooms?: Tables<"rooms">[];
};

interface PropertyCardProps {
  property: Property;
  onApply?: (propertyId: string) => void;
  onView?: (propertyId: string) => void;
  showActions?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (propertyId: string) => void;
}

export function PropertyCard({ property, onApply, onView, showActions = true, isFavorite = false, onToggleFavorite }: PropertyCardProps) {
  const queryClient = useQueryClient();
  
  const prefetchDetails = async () => {
    try {
      await queryClient.prefetchQuery({
        queryKey: ["property", property.property_id],
        queryFn: async () => {
          const { data, error } = await supabase
            .from("properties")
            .select("*, rooms(*, beds(*))")
            .eq("property_id", property.property_id)
            .single();
          if (error) throw error;
          return data;
        },
        staleTime: 1000 * 60,
      });
    } catch {}
  };
  
  const price = property.price_per_room ?? null;
  const rating = (property as any).rating ?? 4.5;
  const ratingCount = (property as any).rating_count ?? 0;
  const stars = (property as any).property_stars as number | undefined;
  
  const amenitiesList: string[] = [];
  if (property.wifi_available) amenitiesList.push("WiFi");
  const am: any = (property as any).amenities || {};
  ["elevator", "geyser", "ac", "parking"].forEach((k) => {
    if (am && am[k]) amenitiesList.push(k.charAt(0).toUpperCase() + k.slice(1));
  });

  return (
    <Card className="group relative overflow-hidden max-w-2xl mx-auto flex rounded-2xl shadow-xl ring-1 ring-primary/10 hover:ring-primary/20 card-hover shine">
      {/* Left: Single cover image */}
      <div className="relative w-2/5 bg-gray-100 flex items-center justify-center">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt="Cover"
            className="w-full h-48 object-cover img-zoom"
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-gray-400">No Image</div>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
            className={`absolute top-2 right-2 rounded-full p-2 ${isFavorite ? "bg-red-600 text-white" : "bg-white text-gray-600"} shadow`}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(property.property_id); }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
          </button>
        )}
      </div>
      {/* Right: Details */}
      <div className="w-3/5 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary border border-primary/20">Company-Serviced</span>
            {typeof stars === 'number' && stars > 0 && (
              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-800 border border-yellow-200" aria-label={`${stars} star property`}>
                {"★".repeat(Math.min(5, Math.max(1, stars)))}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-xl gradient-text">{(property as any).address}</span>
            <span className="text-muted-foreground">{property.city}, {property.state}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-1 rounded bg-green-600 text-white shadow">{rating} ★</span>
            <span className="text-xs text-muted-foreground">({ratingCount} Ratings)</span>
          </div>
          {(property as any).distance_to_center_km && (
            <div className="text-xs text-muted-foreground mb-2">
              {(property as any).neighborhood ? <span className="font-medium">{(property as any).neighborhood}</span> : null}
              {((property as any).neighborhood ? ' • ' : '') + `${(property as any).distance_to_center_km} km from centre`}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-2">
            {(property as any).free_cancellation && (
              <span className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Free cancellation</span>
            )}
            {(property as any).pay_at_property && (
              <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">Pay at property</span>
            )}
            {(property as any).breakfast_included && (
              <span className="text-xs px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">Breakfast included</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {amenitiesList.slice(0, 5).map((am, idx) => (
              <span key={idx} className="flex items-center gap-1 text-xs bg-gray-100 px-2 py-1 rounded">
                {am}
              </span>
            ))}
            {amenitiesList.length > 5 && (
              <span className="text-xs text-blue-600">+ {amenitiesList.length - 5} more</span>
            )}
          </div>
          <div className="font-bold text-lg text-primary mb-1">{formatINR(price)}</div>
          <div className="text-xs text-muted-foreground mb-2">per room per month</div>
        </div>
        <div className="flex gap-2 mt-2" onMouseEnter={prefetchDetails} onFocus={prefetchDetails}>
          {onView && (
            <Button variant="outline" className="w-full" onClick={() => onView(property.property_id)}>
              View Details
            </Button>
          )}
          {onApply && (
            <Button className="w-full btn-gradient text-white font-bold" onClick={() => onApply(property.property_id)}>
              Book Now
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
