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
export const useProperties = (filters?: { city?: string; type?: string }) => {
  return useQuery({
    queryKey: ["properties", filters],
    queryFn: async () => {
      let query = supabase
        .from("properties")
        .select("*, rooms(*, beds(*))")
        .eq("is_approved", true); // Only show approved properties

      if (filters?.city) query = query.eq("city", filters.city);
      if (filters?.type) query = query.eq("property_type", filters.type);

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
