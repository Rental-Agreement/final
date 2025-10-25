import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Property = Tables<"properties">;
export type PropertyInsert = TablesInsert<"properties">;
export type PropertyUpdate = TablesUpdate<"properties">;

export type Room = Tables<"rooms">;
export type RoomInsert = TablesInsert<"rooms">;

export type Bed = Tables<"beds">;
export type BedInsert = TablesInsert<"beds">;

// Hook to fetch all approved properties
export type PropertyFilters = {
  city?: string;
  type?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  amenities?: Array<"wifi" | "elevator" | "geyser" | "ac" | "parking">;
  starsMin?: number;
  freeCancellation?: boolean;
  payAtProperty?: boolean;
  breakfastIncluded?: boolean;
  maxDistanceKm?: number;
  sort?: "price_asc" | "price_desc" | "rating_desc" | "newest" | "distance_asc";
};

// Fetch approved properties with rich filters and sorting
export const useProperties = (filters?: PropertyFilters) => {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*, rooms(*, beds(*))")
        .eq("is_approved", true);

      if (filters?.city) query = query.ilike("city", `%${filters.city}%`);
      if (filters?.type && filters.type !== "All") query = query.eq("property_type", filters.type);
      if (typeof filters?.minPrice === "number") query = query.gte("price_per_room", filters.minPrice);
      if (typeof filters?.maxPrice === "number") query = query.lte("price_per_room", filters.maxPrice);
      if (typeof filters?.minRating === "number") query = query.gte("rating", filters.minRating);
  if (typeof filters?.starsMin === "number") query = query.gte("property_stars", filters.starsMin);
  if (filters?.freeCancellation) query = query.eq("free_cancellation", true);
  if (filters?.payAtProperty) query = query.eq("pay_at_property", true);
  if (filters?.breakfastIncluded) query = query.eq("breakfast_included", true);
  if (typeof filters?.maxDistanceKm === "number") query = query.lte("distance_to_center_km", filters.maxDistanceKm);

      if (filters?.search && filters.search.trim().length > 0) {
        const q = filters.search.trim();
        // Search across address, city, state
        query = (query as any).or(
          `address.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%`
        );
      }

      if (filters?.amenities && filters.amenities.length > 0) {
        for (const key of filters.amenities) {
          if (key === "wifi") {
            // Wifi can be stored in either wifi_available boolean or in amenities JSON
            // Use an OR filter string for PostgREST
            query = (query as any).or(
              `wifi_available.eq.true,amenities.cs.{\"wifi\":true}`
            );
          } else {
            query = (query as any).contains("amenities", { [key]: true } as any);
          }
        }
      }

      switch (filters?.sort) {
        case "price_asc":
          query = query.order("price_per_room", { ascending: true, nullsFirst: false });
          break;
        case "price_desc":
          query = query.order("price_per_room", { ascending: false, nullsFirst: false });
          break;
        case "rating_desc":
          query = query.order("rating", { ascending: false, nullsFirst: false });
          break;
        case "distance_asc":
          query = query.order("distance_to_center_km", { ascending: true, nullsFirst: true });
          break;
        case "newest":
          query = query.order("created_at", { ascending: false });
          break;
        default:
          // Default sort by rating desc then price asc
          query = query.order("rating", { ascending: false, nullsFirst: false }).order("price_per_room", { ascending: true, nullsFirst: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
};

// Hook to fetch properties by owner
export const useOwnerProperties = (ownerId: string) => {
  return useQuery({
    queryKey: ["owner-properties", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*, rooms(*, beds(*))")
        .eq("owner_id", ownerId);

      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};

// Hook to create a property
export const useCreateProperty = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (property: PropertyInsert) => {
      const { data, error } = await (supabase as any)
        .from("properties")
        .insert(property)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
      toast({
        title: "Property Created",
        description: "Your property has been submitted for approval.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to update a property
export const useUpdateProperty = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: PropertyUpdate }) => {
      const { data, error } = await (supabase as any)
        .from("properties")
        .update(updates)
        .eq("property_id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
      toast({
        title: "Property Updated",
        description: "Your property has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to add a room to a property
export const useCreateRoom = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (room: RoomInsert) => {
      const { data, error } = await (supabase as any)
        .from("rooms")
        .insert(room)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
      toast({
        title: "Room Added",
        description: "Room has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to add a bed to a room
export const useCreateBed = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (bed: BedInsert) => {
      const { data, error } = await (supabase as any)
        .from("beds")
        .insert(bed)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-properties"] });
      toast({
        title: "Bed Added",
        description: "Bed has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
