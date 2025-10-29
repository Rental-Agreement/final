import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export interface SavedSearch {
  search_id: string;
  user_id: string;
  name: string;
  filters: Record<string, any>;
  email_alerts: boolean;
  created_at: string;
}

export const useSavedSearches = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  return useQuery({
    queryKey: ["saved-searches"],
    queryFn: async () => {
      if (!user) return [];

      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userData) return [];

      const { data, error } = await supabase
        .from("saved_searches")
        .select("*")
        .eq("user_id", userData.user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as SavedSearch[];
    },
    enabled: !!user,
  });
};

export const useSaveSearch = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      filters,
      emailAlerts = false,
    }: {
      name: string;
      filters: Record<string, any>;
      emailAlerts?: boolean;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userData) throw new Error("User not found");

      const { error } = await supabase.from("saved_searches").insert({
        user_id: userData.user_id,
        name,
        filters,
        email_alerts: emailAlerts,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast({
        title: "Search saved!",
        description: "You can access it anytime from your saved searches.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to save search",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSavedSearch = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (searchId: string) => {
      const { error } = await supabase
        .from("saved_searches")
        .delete()
        .eq("search_id", searchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-searches"] });
      toast({
        title: "Search deleted",
      });
    },
  });
};
