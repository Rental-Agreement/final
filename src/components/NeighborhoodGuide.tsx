import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Coffee, Utensils, GraduationCap, Hospital, ShoppingCart, Star } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import { fetchNeighborhoodData, metersToKmString, geocodeAddress, type NearbyPlaceData } from "@/integrations/google/places";
import { calculateDistance } from "@/integrations/google/places";

interface NeighborhoodGuideProps {
  address: string;
  city: string;
  state: string;
  zip: string;
  expectedCityCenter?: { lat: number; lng: number }; // Optional for warning
  nearbyPlaces?: Array<{
    name: string;
    type: "restaurant" | "cafe" | "hospital" | "school" | "shopping";
    distance?: string;
    rating?: number;
    reviews?: number;
    address?: string;
    lat?: number;
    lng?: number;
  }>;
}

// Mock data generator
const generateMockPlaces = () => {
  const restaurants = [
    { name: "The Spice Route", type: "restaurant" as const, distance: "0.3 km", rating: 4.5, reviews: 234, address: "MG Road", lat: undefined, lng: undefined },
    { name: "Cafe Italiano", type: "restaurant" as const, distance: "0.5 km", rating: 4.2, reviews: 189, address: "Brigade Road", lat: undefined, lng: undefined },
    { name: "Tandoor Nights", type: "restaurant" as const, distance: "0.8 km", rating: 4.7, reviews: 456, address: "Indiranagar", lat: undefined, lng: undefined },
  ];
  const cafes = [
    { name: "Blue Tokai Coffee", type: "cafe" as const, distance: "0.2 km", rating: 4.6, reviews: 312, address: "Koramangala", lat: undefined, lng: undefined },
    { name: "Starbucks", type: "cafe" as const, distance: "0.4 km", rating: 4.3, reviews: 523, address: "Commercial Street", lat: undefined, lng: undefined },
  ];
  const hospitals = [
    { name: "Apollo Hospital", type: "hospital" as const, distance: "1.2 km", rating: 4.4, reviews: 1234, address: "Bannerghatta Road", lat: undefined, lng: undefined },
    { name: "Fortis Healthcare", type: "hospital" as const, distance: "2.1 km", rating: 4.5, reviews: 987, address: "Cunningham Road", lat: undefined, lng: undefined },
  ];
  const schools = [
    { name: "Delhi Public School", type: "school" as const, distance: "0.9 km", rating: 4.8, reviews: 456, address: "East of Kailash", lat: undefined, lng: undefined },
    { name: "Mount Carmel School", type: "school" as const, distance: "1.5 km", rating: 4.6, reviews: 234, address: "Vasant Kunj", lat: undefined, lng: undefined },
  ];
  const shopping = [
    { name: "Phoenix Marketcity", type: "shopping" as const, distance: "1.0 km", rating: 4.5, reviews: 3456, address: "Whitefield", lat: undefined, lng: undefined },
    { name: "Lulu Mall", type: "shopping" as const, distance: "2.3 km", rating: 4.4, reviews: 2134, address: "Rajajinagar", lat: undefined, lng: undefined },
  ];
  
  return [...restaurants, ...cafes, ...hospitals, ...schools, ...shopping];
};

export function NeighborhoodGuide({ address, city, state, zip, expectedCityCenter, nearbyPlaces }: NeighborhoodGuideProps) {
  const [loading, setLoading] = useState(false);
  const [dynamicPlaces, setDynamicPlaces] = useState<NearbyPlaceData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geoWarning, setGeoWarning] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setError(null);
    setGeoWarning(null);
    // Only fetch when an address is present and no override is provided
    if (!address || !city || !state || !zip || nearbyPlaces) return;
    const fullAddress = `${address}, ${city}, ${state}, ${zip}`;
    const load = async () => {
      setLoading(true);
      try {
        // Geocode first to check location
        const geo = await geocodeAddress(fullAddress);
        if (!geo) throw new Error("Could not geocode address");
        // If expectedCityCenter is provided, check distance
        if (expectedCityCenter) {
          const dist = calculateDistance(geo.lat, geo.lng, expectedCityCenter.lat, expectedCityCenter.lng);
          if (dist > 10000) { // 10km threshold
            setGeoWarning("Warning: The detected location is far from the expected city center. Please check the address.");
          }
        }
        const data = await fetchNeighborhoodData(fullAddress);
        if (!mounted) return;
        setDynamicPlaces(data);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load nearby places");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [address, city, state, zip, nearbyPlaces, expectedCityCenter]);

  const places = useMemo(() => {
    // Prefer explicitly passed data
    if (nearbyPlaces && nearbyPlaces.length > 0) return nearbyPlaces;
    // If API key exists but returned empty/null, fall back to mock
    if (dynamicPlaces && dynamicPlaces.length > 0) {
      return dynamicPlaces.map(p => ({
        name: p.name,
        type: p.type,
        distance: metersToKmString(p.distanceMeters),
        rating: p.rating,
        reviews: p.reviews,
        address: p.address || "",
        lat: p.lat,
        lng: p.lng,
      }));
    }
    return generateMockPlaces();
  }, [nearbyPlaces, dynamicPlaces]);
  
  const getIcon = (type: (typeof places)[number]["type"]) => {
    switch (type) {
      case "restaurant": return <Utensils className="w-4 h-4" />;
      case "cafe": return <Coffee className="w-4 h-4" />;
      case "hospital": return <Hospital className="w-4 h-4" />;
      case "school": return <GraduationCap className="w-4 h-4" />;
      case "shopping": return <ShoppingCart className="w-4 h-4" />;
    }
  };

  const filterByType = (type: (typeof places)[number]["type"]) => places.filter(p => p.type === type);

  const PlaceCard = ({ place }: { place: (typeof places)[number] }) => {
    const handleClick = () => {
      // Build Google Maps URL - works without API key
      let url = '';
      if (place.lat && place.lng) {
        // If we have coordinates, use them for precise location
        url = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
      } else if (place.address) {
        // Otherwise use address
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', ' + place.address)}`;
      } else {
        // Fallback to just name
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
      <div 
        onClick={handleClick}
        className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent transition-colors group cursor-pointer border border-transparent hover:border-primary/20"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`View ${place.name} on map`}
      >
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          {getIcon(place.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{place.name}</h4>
            <Badge variant="outline" className="text-xs shrink-0">
              {place.distance || "—"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {place.address}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{place.rating ?? "4.5"}</span>
            </div>
            <span className="text-xs text-muted-foreground">({place.reviews ?? 0} reviews)</span>
            <span className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              View on map →
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Neighborhood Guide
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          What's nearby {loading ? "• loading from OpenStreetMap…" : error ? "• showing sample data" : dynamicPlaces ? "• live data" : ""}
        </p>
        {geoWarning && (
          <p className="text-xs text-red-600 mt-2">{geoWarning}</p>
        )}
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
