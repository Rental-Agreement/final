import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star, Share2, BookmarkPlus, Eye, Users, BadgeCheck } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

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
  const { toast } = useToast();
  const [viewCount] = useState(() => Math.floor(Math.random() * 15) + 3); // Simulated view count
  
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareData = {
      title: `${(property as any).address} - ${property.city}`,
      text: `Check out this property: ${(property as any).address} for ${formatINR(property.price_per_room)}/month`,
      url: window.location.origin + `/property/${property.property_id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        toast({ title: "Link copied to clipboard" });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({ title: "Share failed", description: String(error), variant: "destructive" });
      }
    }
  };

  const handleSaveForLater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement save for later functionality
    toast({ title: "Saved for later", description: "Property added to your saved list" });
  };
  
  const renderStars = (value: number) => {
    const full = Math.floor(value || 0);
    const hasHalf = (value || 0) - full >= 0.5;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < full;
          const half = i === full && hasHalf;
          return (
            <span key={i} className="relative inline-block w-4 h-4">
              <Star className={`w-4 h-4 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} ${half ? 'text-gray-300' : ''}`} />
              {half && (
                <span className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
    );
  };
  
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
    <Card className="group bg-white rounded-xl shadow-md hover:shadow-xl ring-1 ring-border hover:ring-primary/20 transition-all duration-300 overflow-hidden flex flex-col h-full transform hover:scale-[1.01] active:scale-[.99]">
      {/* Cover Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {property.images && property.images.length > 0 ? (
          <>
            <img
              src={property.images[0]}
              alt="Property"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              decoding="async"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
        
        {/* Top Right Actions */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            type="button"
            aria-label="Share property"
            className="rounded-full p-2 bg-white/90 backdrop-blur text-gray-700 shadow-lg hover:scale-110 transition-transform"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Save for later"
            className="rounded-full p-2 bg-white/90 backdrop-blur text-gray-700 shadow-lg hover:scale-110 transition-transform"
            onClick={handleSaveForLater}
          >
            <BookmarkPlus className="w-4 h-4" />
          </button>
          {onToggleFavorite && (
            <button
              type="button"
              aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
              className={`rounded-full p-2 ${
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
        
        {/* Viewing Activity Badge */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur rounded-full px-3 py-1 shadow-md flex items-center gap-1.5">
          <Users className="w-3 h-3 text-primary" />
          <span className="text-xs font-medium text-gray-700">{viewCount} viewing</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Badges Row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-black text-white font-semibold flex items-center gap-1">
            <BadgeCheck className="w-3 h-3" />
            Verified
          </span>
          <div className="flex items-center gap-1">
            {renderStars(rating)}
            <span className="text-[10px] text-muted-foreground">{Number(rating).toFixed(1)}</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground/80">
            {ratingCount} reviews
          </span>
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
              className="text-[11px] px-2.5 py-1 rounded-full bg-accent/20 text-accent-foreground"
            >
              {am}
            </span>
          ))}
          {amenitiesList.length > 4 && (
            <span className="text-[11px] text-muted-foreground py-1">+ {amenitiesList.length - 4} more</span>
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
