import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminExists() {
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    supabase
      .from("users")
      .select("user_id")
      .eq("role", "Admin")
      .limit(1)
      .then(({ data, error }) => {
        if (isMounted) setAdminExists(!!(data && data.length > 0));
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return adminExists;
}
