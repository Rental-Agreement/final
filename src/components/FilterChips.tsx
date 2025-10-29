import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface FilterChipsProps {
  filters: Record<string, any>;
  onRemoveFilter: (key: string) => void;
  onClearAll: () => void;
}

export function FilterChips({ filters, onRemoveFilter, onClearAll }: FilterChipsProps) {
  const chips: { key: string; label: string }[] = [];

  // Price range
  if (filters.minPrice || filters.maxPrice) {
    const min = filters.minPrice || 0;
    const max = filters.maxPrice || 100000;
    chips.push({
      key: "price",
      label: `Price: ${formatINR(min)} - ${formatINR(max)}`,
    });
  }

  // Search
  if (filters.search) {
    chips.push({ key: "search", label: `Search: "${filters.search}"` });
  }

  // City
  if (filters.city) {
    chips.push({ key: "city", label: `City: ${filters.city}` });
  }

  // Type
  if (filters.type) {
    chips.push({ key: "type", label: `Type: ${filters.type}` });
  }

  // Rating
  if (filters.minRating) {
    chips.push({ key: "minRating", label: `Rating: ${filters.minRating}+ ★` });
  }

  // Stars
  if (filters.starsMin) {
    chips.push({ key: "starsMin", label: `${"★".repeat(filters.starsMin)}+ Property` });
  }

  // Distance
  if (filters.maxDistanceKm) {
    chips.push({ key: "maxDistanceKm", label: `Within ${filters.maxDistanceKm} km` });
  }

  // Amenities
  if (filters.amenities?.includes("wifi")) {
    chips.push({ key: "wifi", label: "WiFi" });
  }
  if (filters.amenities?.includes("ac")) {
    chips.push({ key: "ac", label: "AC" });
  }
  if (filters.amenities?.includes("geyser")) {
    chips.push({ key: "geyser", label: "Geyser" });
  }
  if (filters.amenities?.includes("elevator")) {
    chips.push({ key: "elevator", label: "Elevator" });
  }
  if (filters.amenities?.includes("parking")) {
    chips.push({ key: "parking", label: "Parking" });
  }

  // Booking features
  if (filters.freeCancellation) {
    chips.push({ key: "freeCancellation", label: "Free Cancellation" });
  }
  if (filters.payAtProperty) {
    chips.push({ key: "payAtProperty", label: "Pay at Property" });
  }
  if (filters.breakfastIncluded) {
    chips.push({ key: "breakfastIncluded", label: "Breakfast Included" });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {chips.map((chip) => (
        <Badge
          key={chip.key}
          variant="secondary"
          className="gap-1 pr-1 cursor-pointer hover:bg-secondary/80 hover:scale-105 transition-all duration-200 rounded-full h-6 px-3 py-0 text-xs"
        >
          {chip.label}
          <button
            onClick={() => onRemoveFilter(chip.key)}
            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors duration-200"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="h-6 text-xs"
      >
        Clear all
      </Button>
    </div>
  );
}
