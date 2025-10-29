import { Badge } from "@/components/ui/badge";
import { Wifi, Dog, Car, Coffee, Sparkles, Home } from "lucide-react";

interface QuickFiltersProps {
  onFilterClick: (filter: string) => void;
  activeFilters?: string[];
}

export function QuickFilters({ onFilterClick, activeFilters = [] }: QuickFiltersProps) {
  const filters = [
    { id: "wifi", label: "Free WiFi", icon: Wifi },
    { id: "pet_friendly", label: "Pet-friendly", icon: Dog },
    { id: "parking", label: "Free parking", icon: Car },
    { id: "breakfast", label: "Breakfast", icon: Coffee },
    { id: "new", label: "Newly listed", icon: Sparkles },
    { id: "entire_place", label: "Entire place", icon: Home },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilters.includes(filter.id);
        
        return (
          <button
            key={filter.id}
            onClick={() => onFilterClick(filter.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary hover:bg-secondary/80 text-secondary-foreground"
            }`}
          >
            <Icon className="w-4 h-4" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
