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
    <Card className="group bg-white rounded-xl shadow-md hover:shadow-xl ring-1 ring-black/5 hover:ring-primary/20 transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Cover Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <img
            src={property.images[0]}
            alt="Property"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
            className={`absolute top-3 right-3 rounded-full p-2 ${
              isFavorite ? "bg-red-600 text-white" : "bg-white/90 backdrop-blur text-gray-700"
            } shadow-lg hover:scale-110 transition-transform`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite?.(property.property_id);
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? "fill-white" : ""}`} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] px-2.5 py-1 rounded-md bg-black text-white font-semibold">
            Company-Serviced
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-green-600 text-white font-bold flex items-center gap-1">
            {rating} ★
          </span>
          <span className="text-[10px] text-gray-500">({ratingCount} Ratings)</span>
        </div>

        {/* Title & Location */}
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1" title={(property as any).address}>
          {(property as any).address}
        </h3>
        <p className="text-sm text-gray-600 mb-3">
          {property.city}, {property.state}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {amenitiesList.slice(0, 4).map((am, idx) => (
            <span
              key={idx}
              className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md font-medium"
            >
              {am}
            </span>
          ))}
          {amenitiesList.length > 4 && (
            <span className="text-xs text-blue-600 py-1">+ {amenitiesList.length - 4} more</span>
          )}
        </div>

        {/* Special offers */}
        {((property as any).free_cancellation || (property as any).breakfast_included) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(property as any).free_cancellation && (
              <span className="text-[10px] px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Free cancellation
              </span>
            )}
            {(property as any).breakfast_included && (
              <span className="text-[10px] px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
                Breakfast
              </span>
            )}
          </div>
        )}

        {/* Spacer to push price and buttons to bottom */}
        <div className="flex-1"></div>

        {/* Price */}
        <div className="mb-3">
          <div className="font-bold text-xl text-primary">{formatINR(price)}</div>
          <div className="text-xs text-gray-500">per room per month</div>
        </div>

        {/* Action Buttons */}
        {showActions && (onView || onApply) && (
          <div className="flex gap-2" onMouseEnter={prefetchDetails} onFocus={prefetchDetails}>
            {onView && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-sm font-medium"
                onClick={() => onView(property.property_id)}
              >
                View Details
              </Button>
            )}
            {onApply && (
              <Button
                size="sm"
                className="flex-1 h-9 text-sm font-bold btn-gradient text-white"
                onClick={() => onApply(property.property_id)}
              >
                Book Now
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
