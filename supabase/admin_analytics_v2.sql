-- v2 analytics function using created_at only (avoids transaction_date)
BEGIN;

DROP FUNCTION IF EXISTS public.admin_get_analytics_v2();

CREATE OR REPLACE FUNCTION public.admin_get_analytics_v2()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_kpis JSONB;
  v_revenue_series JSONB;
  v_users_series JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can view analytics';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT COUNT(*) FROM public.users),
    'owners', (SELECT COUNT(*) FROM public.users WHERE role = 'Owner'),
    'tenants', (SELECT COUNT(*) FROM public.users WHERE role = 'Tenant'),
    'properties', (SELECT COUNT(*) FROM public.properties),
    'properties_approved', (SELECT COUNT(*) FROM public.properties WHERE is_approved = TRUE),
    'properties_pending', (SELECT COUNT(*) FROM public.properties WHERE is_approved = FALSE),
    'leases', (SELECT COUNT(*) FROM public.leases),
    'leases_active', (SELECT COUNT(*) FROM public.leases WHERE status = 'Active'),
    'leases_pending', (SELECT COUNT(*) FROM public.leases WHERE status = 'Pending'),
    'transactions', (SELECT COUNT(*) FROM public.transactions),
    'transactions_success', (SELECT COUNT(*) FROM public.transactions WHERE status = 'Success'),
    'revenue_total', COALESCE((SELECT SUM(amount) FROM public.transactions WHERE status = 'Success'), 0),
    'disputes', (SELECT COUNT(*) FROM public.disputes),
    'disputes_open', (SELECT COUNT(*) FROM public.disputes WHERE status = 'Open'),
    'disputes_in_review', (SELECT COUNT(*) FROM public.disputes WHERE status = 'In Review'),
    'disputes_resolved', (SELECT COUNT(*) FROM public.disputes WHERE status = 'Resolved')
  ) INTO v_kpis;

  WITH months AS (
    SELECT date_trunc('month', current_date) - (interval '1 month' * gs) AS month
    FROM generate_series(11, 0, -1) AS gs
  ), revenue AS (
    SELECT to_char(m.month, 'YYYY-MM') AS label,
           COALESCE(SUM(t.amount), 0)::numeric AS value
    FROM months m
    LEFT JOIN public.transactions t
      ON date_trunc('month', t.created_at) = m.month
     AND t.status = 'Success'
    GROUP BY m.month
    ORDER BY m.month
  ), users_join AS (
    SELECT to_char(m.month, 'YYYY-MM') AS label,
           COALESCE(COUNT(u.user_id), 0)::int AS value
    FROM months m
    LEFT JOIN public.users u
      ON date_trunc('month', u.created_at) = m.month
    GROUP BY m.month
    ORDER BY m.month
  )
  SELECT jsonb_agg(jsonb_build_object('label', r.label, 'value', r.value))
  FROM revenue r
  INTO v_revenue_series;

  SELECT jsonb_agg(jsonb_build_object('label', uj.label, 'value', uj.value))
  FROM users_join uj
  INTO v_users_series;

  RETURN jsonb_build_object(
    'kpis', v_kpis,
    'revenue', COALESCE(v_revenue_series, '[]'::jsonb),
    'users', COALESCE(v_users_series, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_analytics_v2() TO authenticated;

COMMIT;
