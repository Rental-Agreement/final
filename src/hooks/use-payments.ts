import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Transaction = Tables<"transactions">;
export type TransactionInsert = TablesInsert<"transactions">;

export type PaymentMethod = Tables<"payment_methods">;
export type PaymentMethodInsert = TablesInsert<"payment_methods">;

export type Payout = Tables<"payouts">;

// Hook to fetch transactions for a lease
export const useLeaseTransactions = (leaseId: string) => {
  return useQuery({
    queryKey: ["lease-transactions", leaseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, payment_methods(*)")
        .eq("lease_id", leaseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!leaseId,
  });
};

// Hook to fetch payment methods for a user
export const usePaymentMethods = (userId: string) => {
  return useQuery({
    queryKey: ["payment-methods", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
};

// Hook to add payment method
export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentMethod: PaymentMethodInsert) => {
      const { data, error } = await supabase
        .from("payment_methods")
        .insert(paymentMethod as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      toast({
        title: "Payment Method Added",
        description: "Your payment method has been added successfully.",
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

// Hook to create a transaction
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from("transactions")
        .insert(transaction as any)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lease-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      toast({
        title: "Payment Initiated",
        description: "Your payment is being processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook to fetch payouts for an owner
export const useOwnerPayouts = (ownerId: string) => {
  return useQuery({
    queryKey: ["owner-payouts", ownerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*, transactions(*)")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!ownerId,
  });
};
