import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { geocodeAddress, fetchNeighborhoodData, calculateDistance } from "@/integrations/google/places";

interface PropertyLocation {
  latitude: number;
  longitude: number;
  nearby_amenities: any;
  amenities_last_updated: string | null;
}

interface UsePropertyLocationResult {
  coordinates: { lat: number; lng: number } | null;
  amenities: any;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isCached: boolean;
  refetch: () => void;
}

/**
 * Custom hook to fetch and cache property location data and nearby amenities
 * - Fetches from database cache if available and fresh (< 24 hours)
 * - Otherwise fetches from Google Maps API and caches in database
 * - Automatically geocodes address to lat/lng
 * - Finds real nearby places (hospitals, malls, schools, etc.)
 */
export function usePropertyLocation(
  propertyId: string,
  address: string,
  city: string,
  state: string,
  zip: string
): UsePropertyLocationResult {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["property-location", propertyId],
    queryFn: async () => {
      if (!propertyId || !address || !city || !state) {
        throw new Error("Missing required property information");
      }

      // Step 1: Check database for cached data
      const { data: property, error: fetchError } = await supabase
        .from("properties")
        .select("latitude, longitude, nearby_amenities, amenities_last_updated")
        .eq("property_id", propertyId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Step 2: Check if cache is fresh (< 24 hours)
      const isFresh = property?.amenities_last_updated &&
        (new Date().getTime() - new Date(property.amenities_last_updated).getTime()) < 86400000;

      if (property?.latitude && property?.longitude && isFresh && property?.nearby_amenities) {
        console.log("✅ Using cached location data for property:", propertyId);
        return {
          coordinates: { lat: Number(property.latitude), lng: Number(property.longitude) },
          amenities: property.nearby_amenities as any,
          cached: true,
        };
      }

      // Step 3: Fetch fresh data from Google Maps
      console.log("🌍 Fetching fresh location data from Google Maps for:", propertyId);
      const fullAddress = `${address}, ${city}, ${state}${zip ? ' ' + zip : ''}`;

      // Geocode address to get coordinates
      const coordinates = await geocodeAddress(fullAddress);
      if (!coordinates) {
        throw new Error("Could not geocode address");
      }

      // Fetch nearby places
      const nearbyPlaces = await fetchNeighborhoodData(fullAddress);

      // Format amenities data
      const formattedAmenities = formatAmenitiesData(nearbyPlaces, coordinates);

      // Step 4: Update database with fresh data
      const { error: updateError } = await supabase
        .from("properties")
        .update({
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          nearby_amenities: formattedAmenities,
          amenities_last_updated: new Date().toISOString(),
        })
        .eq("property_id", propertyId);

      if (updateError) {
        console.warn("Failed to cache location data:", updateError);
      } else {
        console.log("✅ Cached location data in database");
      }

      return {
        coordinates,
        amenities: formattedAmenities,
        cached: false,
      };
    },
    staleTime: 86400000, // 24 hours
    gcTime: 86400000, // 24 hours (replaces cacheTime in newer React Query)
    enabled: !!propertyId && !!address && !!city,
    retry: 2,
  });

  // Mutation to manually refresh location data
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const fullAddress = `${address}, ${city}, ${state}${zip ? ' ' + zip : ''}`;
      const coordinates = await geocodeAddress(fullAddress);
      const nearbyPlaces = await fetchNeighborhoodData(fullAddress);
      const formattedAmenities = formatAmenitiesData(nearbyPlaces, coordinates);

      await supabase
        .from("properties")
        .update({
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
          nearby_amenities: formattedAmenities,
          amenities_last_updated: new Date().toISOString(),
        })
        .eq("property_id", propertyId);

      return { coordinates, amenities: formattedAmenities };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-location", propertyId] });
    },
  });

  return {
    coordinates: query.data?.coordinates || null,
    amenities: query.data?.amenities || null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    isCached: query.data?.cached || false,
    refetch: () => refreshMutation.mutate(),
  };
}

/**
 * Format Google Places data into structured amenities object
 */
function formatAmenitiesData(places: any[], coordinates: any) {
  const amenities: any = {
    transportation: {},
    essentials: {},
    lifestyle: {},
    updated_at: new Date().toISOString(),
  };

  // Group places by type
  places.forEach((place) => {
    const distance = place.distance 
      ? parseFloat(place.distance.replace(/[^\d.]/g, ''))
      : calculateDistance(
          coordinates.lat,
          coordinates.lng,
          place.lat || 0,
          place.lng || 0
        ) / 1000; // Convert meters to km

    const placeData = {
      name: place.name,
      distance: Math.round(distance * 10) / 10, // Round to 1 decimal
      address: place.address || place.vicinity || '',
      rating: place.rating || null,
      reviews: place.user_ratings_total || null,
    };

    // Categorize by type
    if (place.type === 'transit_station' || place.types?.includes('transit_station')) {
      if (!amenities.transportation.metro || distance < amenities.transportation.metro.distance) {
        amenities.transportation.metro = placeData;
      }
    } else if (place.type === 'bus_station' || place.types?.includes('bus_station')) {
      if (!amenities.transportation.bus_stop || distance < amenities.transportation.bus_stop.distance) {
        amenities.transportation.bus_stop = placeData;
      }
    } else if (place.type === 'train_station' || place.types?.includes('train_station')) {
      if (!amenities.transportation.railway || distance < amenities.transportation.railway.distance) {
        amenities.transportation.railway = placeData;
      }
    } else if (place.type === 'airport' || place.types?.includes('airport')) {
      if (!amenities.transportation.airport || distance < amenities.transportation.airport.distance) {
        amenities.transportation.airport = placeData;
      }
    } else if (place.type === 'hospital' || place.types?.includes('hospital')) {
      if (!amenities.essentials.hospital || distance < amenities.essentials.hospital.distance) {
        amenities.essentials.hospital = placeData;
      }
    } else if (place.type === 'police' || place.types?.includes('police')) {
      if (!amenities.essentials.police || distance < amenities.essentials.police.distance) {
        amenities.essentials.police = placeData;
      }
    } else if (place.type === 'shopping' || place.types?.includes('shopping_mall')) {
      if (!amenities.essentials.mall || distance < amenities.essentials.mall.distance) {
        amenities.essentials.mall = placeData;
      }
    } else if (place.type === 'school' || place.types?.includes('school')) {
      if (!amenities.essentials.school || distance < amenities.essentials.school.distance) {
        amenities.essentials.school = placeData;
      }
    } else if (place.type === 'restaurant' || place.types?.includes('restaurant')) {
      if (!amenities.lifestyle.restaurant || distance < amenities.lifestyle.restaurant.distance) {
        amenities.lifestyle.restaurant = placeData;
      }
    } else if (place.type === 'cafe' || place.types?.includes('cafe')) {
      if (!amenities.lifestyle.cafe || distance < amenities.lifestyle.cafe.distance) {
        amenities.lifestyle.cafe = placeData;
      }
    } else if (place.type === 'gym' || place.types?.includes('gym')) {
      if (!amenities.lifestyle.gym || distance < amenities.lifestyle.gym.distance) {
        amenities.lifestyle.gym = placeData;
      }
    }
  });

  return amenities;
}

/**
 * Hook to refresh location data for a property
 */
export function useRefreshPropertyLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      propertyId, 
      address, 
      city, 
      state, 
      zip 
    }: { 
      propertyId: string; 
      address: string; 
      city: string; 
      state: string; 
      zip?: string; 
    }) => {
      const fullAddress = `${address}, ${city}, ${state}${zip ? ' ' + zip : ''}`;
      const coordinates = await geocodeAddress(fullAddress);
      const nearbyPlaces = await fetchNeighborhoodData(fullAddress);
      const formattedAmenities = formatAmenitiesData(nearbyPlaces, coordinates);

      const { error } = await supabase
        .from("properties")
        .update({
          latitude: coordinates?.lat,
          longitude: coordinates?.lng,
          nearby_amenities: formattedAmenities,
          amenities_last_updated: new Date().toISOString(),
        })
        .eq("property_id", propertyId);

      if (error) throw error;

      return { coordinates, amenities: formattedAmenities };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["property-location", variables.propertyId] });
    },
  });
}
