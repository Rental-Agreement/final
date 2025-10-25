import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Dispute = Tables<"disputes">;
export type DisputeInsert = TablesInsert<"disputes">;
export type DisputeUpdate = TablesUpdate<"disputes">;

// Hook to fetch disputes raised by a user
export const useUserDisputes = (userId: string) => {
  return useQuery({
    queryKey: ["user-disputes", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, transactions(*), raised_by:users!disputes_raised_by_user_id_fkey(*)")
        .eq("raised_by_user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Hook to fetch all disputes (Admin)
export const useAllDisputes = () => {
  return useQuery({
    queryKey: ["all-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disputes")
        .select("*, transactions(*), raised_by:users!disputes_raised_by_user_id_fkey(*)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

// Hook to create a dispute
export const useCreateDispute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (dispute: DisputeInsert) => {
      const { data, error } = await supabase
        .from("disputes")
        .insert(dispute as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["all-disputes"] });
      toast({
        title: "Dispute Raised",
        description: "Your dispute has been submitted to admin.",
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

// Hook to update dispute (Admin only)
export const useUpdateDispute = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await (supabase as any)
        .from("disputes")
        .update(updates)
        .eq("dispute_id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
      queryClient.invalidateQueries({ queryKey: ["user-disputes"] });
      queryClient.invalidateQueries({ queryKey: ["all-disputes"] });
      toast({
        title: "Dispute Updated",
        description: "Dispute status has been updated.",
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
