import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useFavorites(userId: string) {
	return useQuery({
		queryKey: ["favorites", userId],
		queryFn: async () => {
			if (!userId) return [];
			const { data, error } = await supabase
				.from("favorites")
				.select("*, property:properties(*)")
				.eq("user_id", userId);
			if (error) throw error;
			return data || [];
		},
	});
}
