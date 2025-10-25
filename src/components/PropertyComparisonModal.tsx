import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/utils";
import { X, Check, Minus } from "lucide-react";
import { usePropertyComparison } from "@/hooks/use-comparison";

export function PropertyComparisonModal() {
  const { compareIds, removeFromCompare, clearComparison } = usePropertyComparison();
  const [open, setOpen] = useState(false);

  const { data: properties, isLoading } = useQuery({
    queryKey: ["compare-properties", compareIds],
    queryFn: async () => {
      if (compareIds.length === 0) return [];
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .in("property_id", compareIds);
      if (error) throw error;
      return data;
    },
    enabled: compareIds.length > 0,
  });

  if (compareIds.length === 0) return null;

  const attributes = [
    { key: "price_per_room", label: "Monthly Rent", format: (v: any) => formatINR(v) },
    { key: "property_type", label: "Type", format: (v: any) => v },
    { key: "city", label: "City", format: (v: any) => v },
    { key: "rating", label: "Rating", format: (v: any) => v ? `${v} ★` : "N/A" },
    { key: "property_stars", label: "Stars", format: (v: any) => v ? "★".repeat(v) : "N/A" },
    { key: "free_cancellation", label: "Free Cancellation", format: (v: any) => v ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" /> },
    { key: "pay_at_property", label: "Pay at Property", format: (v: any) => v ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" /> },
    { key: "breakfast_included", label: "Breakfast", format: (v: any) => v ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" /> },
    { key: "wifi_available", label: "WiFi", format: (v: any) => v ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-red-600" /> },
    { key: "distance_to_center_km", label: "Distance to Center", format: (v: any) => v ? `${v} km` : "N/A" },
  ];

  return (
    <>
      {/* Floating Compare Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Comparing {compareIds.length} {compareIds.length === 1 ? 'property' : 'properties'}</span>
            <Button variant="outline" size="sm" onClick={clearComparison}>
              Clear All
            </Button>
          </div>
          <Button onClick={() => setOpen(true)} disabled={compareIds.length < 2}>
            Compare Now
          </Button>
        </div>
      </div>

      {/* Comparison Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Property Comparison</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8">Loading properties...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-4 text-left font-semibold min-w-[200px] sticky left-0 bg-white z-10">Feature</th>
                    {properties?.map((property) => (
                      <th key={property.property_id} className="p-4 min-w-[250px]">
                        <Card className="relative">
                          <button
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-100 hover:bg-red-200"
                            onClick={() => removeFromCompare(property.property_id)}
                          >
                            <X className="w-4 h-4 text-red-600" />
                          </button>
                          <CardContent className="p-4">
                            {property.images?.[0] && (
                              <img
                                src={property.images[0]}
                                alt={property.address}
                                className="w-full h-32 object-cover rounded mb-2"
                              />
                            )}
                            <div className="font-semibold text-sm line-clamp-2">{property.address}</div>
                            <div className="text-xs text-muted-foreground">{property.city}</div>
                          </CardContent>
                        </Card>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attributes.map((attr) => (
                    <tr key={attr.key} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium sticky left-0 bg-white">{attr.label}</td>
                      {properties?.map((property) => (
                        <td key={property.property_id} className="p-4 text-center">
                          {attr.format((property as any)[attr.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
