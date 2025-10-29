import { Button } from "@/components/ui/button";
import { Search, Home, Filter, Sparkles } from "lucide-react";

interface EmptyStateProps {
  type: "no-results" | "no-properties" | "no-favorites" | "no-leases";
  onAction?: () => void;
  onClearFilters?: () => void;
}

export function EmptyState({ type, onAction, onClearFilters }: EmptyStateProps) {
  const states = {
    "no-results": {
      icon: Search,
      title: "No properties found",
      description: "We couldn't find any properties matching your criteria. Try adjusting your filters or search in a different area.",
      actionLabel: "Clear filters",
      secondaryActionLabel: "Browse all properties",
    },
    "no-properties": {
      icon: Home,
      title: "No properties available",
      description: "There are currently no properties listed. Check back soon for new listings!",
      actionLabel: "Set up alerts",
      secondaryActionLabel: null,
    },
    "no-favorites": {
      icon: Sparkles,
      title: "No saved properties yet",
      description: "Start saving properties you like by clicking the heart icon. You'll be able to compare and view them here.",
      actionLabel: "Browse properties",
      secondaryActionLabel: null,
    },
    "no-leases": {
      icon: Home,
      title: "No active leases",
      description: "You don't have any leases yet. Find your perfect home and apply today!",
      actionLabel: "Browse properties",
      secondaryActionLabel: null,
    },
  };

  const state = states[type];
  const Icon = state.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Animated Icon */}
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-8">
          <Icon className="w-16 h-16 text-primary" />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-2xl font-bold mb-2">{state.title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{state.description}</p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onClearFilters && state.actionLabel === "Clear filters" && (
          <Button variant="outline" onClick={onClearFilters} size="lg">
            <Filter className="w-4 h-4 mr-2" />
            {state.actionLabel}
          </Button>
        )}
        {onAction && (
          <Button onClick={onAction} size="lg">
            {state.actionLabel}
          </Button>
        )}
        {state.secondaryActionLabel && onAction && (
          <Button variant="outline" onClick={onAction} size="lg">
            {state.secondaryActionLabel}
          </Button>
        )}
      </div>

      {/* Suggestions (for no-results) */}
      {type === "no-results" && (
        <div className="mt-8 p-4 bg-accent/50 rounded-lg max-w-md">
          <p className="text-sm font-medium mb-2">Try searching for:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {["Mumbai", "Bangalore", "Delhi", "Pune"].map((city) => (
              <span key={city} className="text-xs px-3 py-1 bg-background rounded-full">
                {city}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
