import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";

export interface PriceAlert {
  alert_id: string;
  user_id: string;
  property_id: string;
  original_price: number;
  alert_sent: boolean;
  created_at: string;
}

export const usePriceAlerts = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["price-alerts"],
    queryFn: async () => {
      if (!user) return [];

      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userData) return [];

      const { data, error } = await supabase
        .from("price_alerts")
        .select(`
          *,
          properties:property_id (
            address,
            city,
            price_per_room,
            images
          )
        `)
        .eq("user_id", userData.user_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreatePriceAlert = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      propertyId,
      currentPrice,
    }: {
      propertyId: string;
      currentPrice: number;
    }) => {
      if (!user) throw new Error("Must be logged in");

      const { data: userData } = await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!userData) throw new Error("User not found");

      const { error } = await supabase.from("price_alerts").insert({
        user_id: userData.user_id,
        property_id: propertyId,
        original_price: currentPrice,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts"] });
      toast({
        title: "Price alert set!",
        description: "We'll notify you if the price drops.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to set price alert",
        variant: "destructive",
      });
    },
  });
};
