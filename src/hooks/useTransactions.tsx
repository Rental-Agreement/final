import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useTransactions(userId: string) {
	return useQuery({
		queryKey: ["transactions", userId],
		queryFn: async () => {
			if (!userId) return [];
			// 1. Get all lease_ids for this user
			const { data: leases, error: leaseError } = await supabase
				.from("leases")
				.select("lease_id")
				.eq("tenant_id", userId);
			if (leaseError) throw leaseError;
			const leaseIds = (leases as { lease_id: string }[] | null)?.map(l => l.lease_id) || [];
			if (leaseIds.length === 0) return [];
			// 2. Get all transactions for those lease_ids
			const { data, error } = await supabase
				.from("transactions")
				.select("*, lease:leases(*), property:properties(*)")
				.in("lease_id", leaseIds)
				.order("created_at", { ascending: false });
			if (error) throw error;
			return data || [];
		},
	});
}
