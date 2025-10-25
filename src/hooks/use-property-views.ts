import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface PropertyView {
  view_id: string;
  property_id: string;
  user_id?: string;
  session_id?: string;
  viewed_at: string;
}

export const usePropertyViews = (userId?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["property-views", userId || user?.id],
    queryFn: async () => {
      const targetUserId = userId || (user ? (await supabase
        .from("users")
        .select("user_id")
        .eq("auth_user_id", user.id)
        .single()).data?.user_id : null);

      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from("property_views")
        .select(`
          view_id,
          property_id,
          viewed_at,
          properties:property_id (
            property_id,
            address,
            city,
            price_per_room,
            rating,
            images,
            property_type
          )
        `)
        .eq("user_id", targetUserId)
        .order("viewed_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user || !!userId,
  });
};

export const useTrackPropertyView = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      // Get session ID from localStorage or generate one
      let sessionId = localStorage.getItem("session_id");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem("session_id", sessionId);
      }

      let userId = null;
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_user_id", user.id)
          .single();
        userId = data?.user_id;
      }

      const { error } = await supabase.from("property_views").insert({
        property_id: propertyId,
        user_id: userId,
        session_id: sessionId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["property-views"] });
    },
  });
};
