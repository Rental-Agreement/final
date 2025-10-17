import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Lease = Tables<"leases">;
export type LeaseInsert = TablesInsert<"leases">;
export type LeaseUpdate = TablesUpdate<"leases">;

// Hook to fetch leases for a tenant
export const useTenantLeases = (tenantId: string) => {
  return useQuery({
    queryKey: ["tenant-leases", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          *,
          rooms(*, properties(*)),
          beds(*, rooms(*, properties(*)))
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
};

// Hook to fetch leases for an owner's properties
export const useOwnerLeases = (ownerId: string) => {
  return useQuery({
    queryKey: ["owner-leases", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          *,
          tenant:users!leases_tenant_id_fkey(*),
          rooms(*, properties!inner(*)),
          beds(*, rooms(*, properties!inner(*)))
        `)
        .or(`rooms.properties.owner_id.eq.${ownerId},beds.rooms.properties.owner_id.eq.${ownerId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};

// Hook to create a lease application
export const useCreateLease = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (lease: LeaseInsert) => {
      const { data, error } = await supabase
        .from("leases")
        .insert(lease)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant-leases"] });
      queryClient.invalidateQueries({ queryKey: ["owner-leases"] });
      toast({
        title: "Lease Application Submitted",
        description: "Your lease application has been submitted successfully.",
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

// Hook to update lease status
export const useUpdateLease = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: LeaseUpdate }) => {
      const { data, error } = await supabase
        .from("leases")
        .update(updates)
        .eq("lease_id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leases"] });
      queryClient.invalidateQueries({ queryKey: ["tenant-leases"] });
      queryClient.invalidateQueries({ queryKey: ["owner-leases"] });
      toast({
        title: "Lease Updated",
        description: "Lease has been updated successfully.",
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
