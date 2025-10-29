import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

export type Review = {
  review_id: string;
  property_id: string;
  user_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
};

export const usePropertyReviews = (propertyId?: string) => {
  return useQuery<Review[]>({
    queryKey: ["reviews", propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("property_id", propertyId);
      if (error) throw error;
      return data as any;
    },
    enabled: !!propertyId,
  });
};

export const useCreateReview = () => {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { property_id: string; rating: number; comment?: string }) => {
      const { data, error } = await (supabase as any)
        .from("reviews")
        .insert({ property_id: input.property_id, rating: input.rating, comment: input.comment })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["reviews", vars.property_id] });
      qc.invalidateQueries({ queryKey: ["properties"] });
      
      // Trigger confetti animation for positive reviews
      if (vars.rating >= 4) {
        confetti({
          particleCount: 50,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#fbbf24', '#f59e0b', '#d97706']
        });
      }
      
      toast({ title: "Review submitted", description: "Thanks for your feedback!" });
    },
    onError: (err: any) => {
      toast({ title: "Review failed", description: err.message || String(err), variant: "destructive" });
    },
  });
};
