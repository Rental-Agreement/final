import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Coffee, Utensils, GraduationCap, Hospital, ShoppingCart, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NearbyPlace {
  name: string;
  type: "restaurant" | "cafe" | "hospital" | "school" | "shopping";
  distance: string;
  rating: number;
  reviews: number;
  address: string;
}

interface NeighborhoodGuideProps {
  propertyAddress: string;
  nearbyPlaces?: NearbyPlace[];
}

// Mock data generator
const generateMockPlaces = (): NearbyPlace[] => {
  const restaurants = [
    { name: "The Spice Route", type: "restaurant" as const, distance: "0.3 km", rating: 4.5, reviews: 234, address: "MG Road" },
    { name: "Cafe Italiano", type: "restaurant" as const, distance: "0.5 km", rating: 4.2, reviews: 189, address: "Brigade Road" },
    { name: "Tandoor Nights", type: "restaurant" as const, distance: "0.8 km", rating: 4.7, reviews: 456, address: "Indiranagar" },
  ];
  const cafes = [
    { name: "Blue Tokai Coffee", type: "cafe" as const, distance: "0.2 km", rating: 4.6, reviews: 312, address: "Koramangala" },
    { name: "Starbucks", type: "cafe" as const, distance: "0.4 km", rating: 4.3, reviews: 523, address: "Commercial Street" },
  ];
  const hospitals = [
    { name: "Apollo Hospital", type: "hospital" as const, distance: "1.2 km", rating: 4.4, reviews: 1234, address: "Bannerghatta Road" },
    { name: "Fortis Healthcare", type: "hospital" as const, distance: "2.1 km", rating: 4.5, reviews: 987, address: "Cunningham Road" },
  ];
  const schools = [
    { name: "Delhi Public School", type: "school" as const, distance: "0.9 km", rating: 4.8, reviews: 456, address: "East of Kailash" },
    { name: "Mount Carmel School", type: "school" as const, distance: "1.5 km", rating: 4.6, reviews: 234, address: "Vasant Kunj" },
  ];
  const shopping = [
    { name: "Phoenix Marketcity", type: "shopping" as const, distance: "1.0 km", rating: 4.5, reviews: 3456, address: "Whitefield" },
    { name: "Lulu Mall", type: "shopping" as const, distance: "2.3 km", rating: 4.4, reviews: 2134, address: "Rajajinagar" },
  ];
  
  return [...restaurants, ...cafes, ...hospitals, ...schools, ...shopping];
};

export function NeighborhoodGuide({ propertyAddress, nearbyPlaces }: NeighborhoodGuideProps) {
  const places = nearbyPlaces || generateMockPlaces();
  
  const getIcon = (type: NearbyPlace["type"]) => {
    switch (type) {
      case "restaurant": return <Utensils className="w-4 h-4" />;
      case "cafe": return <Coffee className="w-4 h-4" />;
      case "hospital": return <Hospital className="w-4 h-4" />;
      case "school": return <GraduationCap className="w-4 h-4" />;
      case "shopping": return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const filterByType = (type: NearbyPlace["type"]) => places.filter(p => p.type === type);

  const PlaceCard = ({ place }: { place: NearbyPlace }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group cursor-pointer">
      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
        {getIcon(place.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm truncate">{place.name}</h4>
          <Badge variant="outline" className="text-xs shrink-0">
            {place.distance}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {place.address}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{place.rating}</span>
          </div>
          <span className="text-xs text-muted-foreground">({place.reviews} reviews)</span>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Neighborhood Guide
        </CardTitle>
        <p className="text-sm text-muted-foreground">What's nearby</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="restaurants" className="text-xs">
              <Utensils className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Food</span>
            </TabsTrigger>
            <TabsTrigger value="cafes" className="text-xs">
              <Coffee className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Cafes</span>
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="text-xs">
              <Hospital className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Health</span>
            </TabsTrigger>
            <TabsTrigger value="schools" className="text-xs">
              <GraduationCap className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Schools</span>
            </TabsTrigger>
            <TabsTrigger value="shopping" className="text-xs">
              <ShoppingCart className="w-3 h-3 sm:mr-1" />
              <span className="hidden sm:inline">Shop</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4 space-y-2 max-h-96 overflow-y-auto">
            {places.map((place, idx) => <PlaceCard key={idx} place={place} />)}
          </TabsContent>

          <TabsContent value="restaurants" className="mt-4 space-y-2">
            {filterByType("restaurant").map((place, idx) => <PlaceCard key={idx} place={place} />)}
          </TabsContent>

          <TabsContent value="cafes" className="mt-4 space-y-2">
            {filterByType("cafe").map((place, idx) => <PlaceCard key={idx} place={place} />)}
          </TabsContent>

          <TabsContent value="hospitals" className="mt-4 space-y-2">
            {filterByType("hospital").map((place, idx) => <PlaceCard key={idx} place={place} />)}
          </TabsContent>

          <TabsContent value="schools" className="mt-4 space-y-2">
            {filterByType("school").map((place, idx) => <PlaceCard key={idx} place={place} />)}
          </TabsContent>

          <TabsContent value="shopping" className="mt-4 space-y-2">
            {filterByType("shopping").map((place, idx) => <PlaceCard key={idx} place={place} />)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
