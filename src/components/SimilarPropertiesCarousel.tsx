import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Sparkles, MapPin, Star, Heart } from "lucide-react";
import { useState } from "react";

interface SimilarProperty {
  property_id: string;
  title: string;
  city: string;
  price_per_room: number;
  rating: number;
  property_type: string;
  images?: string[];
  main_image?: string;
}

interface SimilarPropertiesCarouselProps {
  currentPropertyId: string;
  currentCity: string;
  currentType: string;
  properties?: SimilarProperty[];
  onPropertyClick: (propertyId: string) => void;
}

// Mock data generator
const generateMockSimilar = (city: string, type: string): SimilarProperty[] => {
  return [
    {
      property_id: "1",
      title: "Luxury Studio in Downtown",
      city: city,
      price_per_room: 15000,
      rating: 4.7,
      property_type: type,
      main_image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400",
    },
    {
      property_id: "2",
      title: "Modern 2BHK with Amenities",
      city: city,
      price_per_room: 22000,
      rating: 4.5,
      property_type: type,
      main_image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400",
    },
    {
      property_id: "3",
      title: "Cozy Apartment Near Metro",
      city: city,
      price_per_room: 18000,
      rating: 4.8,
      property_type: type,
      main_image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400",
    },
    {
      property_id: "4",
      title: "Spacious Family Home",
      city: city,
      price_per_room: 28000,
      rating: 4.6,
      property_type: type,
      main_image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400",
    },
    {
      property_id: "5",
      title: "Premium Penthouse",
      city: city,
      price_per_room: 35000,
      rating: 4.9,
      property_type: type,
      main_image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
    },
  ];
};

export function SimilarPropertiesCarousel({
  currentPropertyId,
  currentCity,
  currentType,
  properties,
  onPropertyClick,
}: SimilarPropertiesCarouselProps) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const similarProperties = properties || generateMockSimilar(currentCity, currentType);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("similar-properties-scroll");
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === "left" 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          You Might Also Like
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Similar properties in {currentCity}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {/* Scroll Buttons */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full w-10 h-10 p-0"
            onClick={() => scroll("left")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full w-10 h-10 p-0"
            onClick={() => scroll("right")}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          {/* Carousel */}
          <div
            id="similar-properties-scroll"
            className="flex gap-4 overflow-x-auto scrollbar-hide p-6 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {similarProperties.map((property) => (
              <div
                key={property.property_id}
                className="flex-shrink-0 w-64 cursor-pointer group"
                onClick={() => onPropertyClick(property.property_id)}
              >
                <Card className="overflow-hidden h-full hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1">
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={property.main_image}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-white/90 hover:bg-white rounded-full w-8 h-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle favorite toggle
                        }}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <Badge className="bg-black/70 text-white border-none">
                        {property.property_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    <h4 className="font-semibold text-sm line-clamp-1">
                      {property.title}
                    </h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{property.city}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{property.rating}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">₹{property.price_per_room.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">per month</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="p-4 border-t bg-accent/50 text-center">
          <Button variant="outline" className="w-full sm:w-auto">
            View All Similar Properties
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
