-- Additional migration to improve authentication flow
-- Run this after the initial schema migration

-- Function to automatically create user profile after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function will be called by a trigger when a new user signs up
  -- The actual user profile creation is handled in the application
  -- This is a placeholder for any additional logic needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new user creation
-- Note: In Supabase, we typically handle user profile creation in the application
-- after successful auth.signUp() to have more control over the process

-- Function to update room/bed status when lease is created or updated
CREATE OR REPLACE FUNCTION public.update_unit_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When a lease becomes Active, mark the unit as Occupied
  IF NEW.status = 'Active' THEN
    IF NEW.room_id IS NOT NULL THEN
      UPDATE rooms SET status = 'Occupied' WHERE room_id = NEW.room_id;
    END IF;
    IF NEW.bed_id IS NOT NULL THEN
      UPDATE beds SET status = 'Occupied' WHERE bed_id = NEW.bed_id;
    END IF;
  END IF;

  -- When a lease is Completed or Cancelled, mark the unit as Available
  IF NEW.status IN ('Completed', 'Cancelled') AND OLD.status = 'Active' THEN
    IF NEW.room_id IS NOT NULL THEN
      UPDATE rooms SET status = 'Available' WHERE room_id = NEW.room_id;
    END IF;
    IF NEW.bed_id IS NOT NULL THEN
      UPDATE beds SET status = 'Available' WHERE bed_id = NEW.bed_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to leases table
DROP TRIGGER IF EXISTS lease_status_update ON leases;
CREATE TRIGGER lease_status_update
  AFTER INSERT OR UPDATE OF status ON leases
  FOR EACH ROW
  EXECUTE FUNCTION update_unit_status();

-- Function to create payout when transaction is successful
CREATE OR REPLACE FUNCTION public.create_payout_on_transaction()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id UUID;
  v_gateway_fee NUMERIC;
  v_net_amount NUMERIC;
BEGIN
  -- Only process successful transactions
  IF NEW.status = 'Success' AND (OLD.status IS NULL OR OLD.status != 'Success') THEN
    -- Get owner_id from the lease
    SELECT COALESCE(p.owner_id, p2.owner_id) INTO v_owner_id
    FROM leases l
    LEFT JOIN rooms r ON l.room_id = r.room_id
    LEFT JOIN properties p ON r.property_id = p.property_id
    LEFT JOIN beds b ON l.bed_id = b.bed_id
    LEFT JOIN rooms r2 ON b.room_id = r2.room_id
    LEFT JOIN properties p2 ON r2.property_id = p2.property_id
    WHERE l.lease_id = NEW.lease_id;

    -- Calculate gateway fee (2% of transaction amount)
    v_gateway_fee := NEW.amount * 0.02;
    v_net_amount := NEW.amount - v_gateway_fee;

    -- Create payout record
    INSERT INTO payouts (
      owner_id,
      related_transaction_id,
      gross_amount,
      gateway_fee,
      net_amount,
      status
    ) VALUES (
      v_owner_id,
      NEW.transaction_id,
      NEW.amount,
      v_gateway_fee,
      v_net_amount,
      'Queued'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to transactions table
DROP TRIGGER IF EXISTS transaction_payout_trigger ON transactions;
CREATE TRIGGER transaction_payout_trigger
  AFTER INSERT OR UPDATE OF status ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_payout_on_transaction();

-- Function to prevent multiple active leases on same unit
CREATE OR REPLACE FUNCTION public.check_unit_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_active_lease_count INTEGER;
BEGIN
  -- Check if there's already an active lease on this room or bed
  IF NEW.room_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_active_lease_count
    FROM leases
    WHERE room_id = NEW.room_id
      AND status = 'Active'
      AND lease_id != COALESCE(NEW.lease_id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF v_active_lease_count > 0 THEN
      RAISE EXCEPTION 'This room already has an active lease';
    END IF;
  END IF;

  IF NEW.bed_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_active_lease_count
    FROM leases
    WHERE bed_id = NEW.bed_id
      AND status = 'Active'
      AND lease_id != COALESCE(NEW.lease_id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF v_active_lease_count > 0 THEN
      RAISE EXCEPTION 'This bed already has an active lease';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to leases table
DROP TRIGGER IF EXISTS check_lease_availability ON leases;
CREATE TRIGGER check_lease_availability
  BEFORE INSERT OR UPDATE ON leases
  FOR EACH ROW
  WHEN (NEW.status = 'Active')
  EXECUTE FUNCTION check_unit_availability();

-- Add admin user (run this manually with your desired credentials)
-- Note: You need to create the auth user first in Supabase dashboard or via auth.signUp
-- Then run this with the correct auth_user_id:
/*
INSERT INTO users (
  auth_user_id,
  first_name,
  last_name,
  email,
  role,
  is_approved
) VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'Admin',
  'User',
  'admin@rentalapp.com',
  'Admin',
  true
);
*/
