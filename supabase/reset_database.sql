-- =====================================================
-- COMPLETE DATABASE RESET SCRIPT
-- ⚠️ WARNING: This will DELETE ALL data!
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Drop all existing tables
-- =====================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS disputes CASCADE;
DROP TABLE IF EXISTS payouts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS leases CASCADE;
DROP TABLE IF EXISTS beds CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any triggers
DROP TRIGGER IF EXISTS set_users_updated_at ON users;
DROP TRIGGER IF EXISTS set_properties_updated_at ON properties;
DROP TRIGGER IF EXISTS set_rooms_updated_at ON rooms;
DROP TRIGGER IF EXISTS set_beds_updated_at ON beds;
DROP TRIGGER IF EXISTS set_leases_updated_at ON leases;
DROP TRIGGER IF EXISTS set_payment_methods_updated_at ON payment_methods;
DROP TRIGGER IF EXISTS set_transactions_updated_at ON transactions;
DROP TRIGGER IF EXISTS set_payouts_updated_at ON payouts;
DROP TRIGGER IF EXISTS set_disputes_updated_at ON disputes;

-- Drop any functions
DROP FUNCTION IF EXISTS update_users_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_properties_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_rooms_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_beds_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_leases_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_payment_methods_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_transactions_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_payouts_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_disputes_updated_at() CASCADE;

-- Success message for cleanup
DO $$
BEGIN
    RAISE NOTICE '✅ All existing tables, triggers, and functions have been dropped!';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- STEP 2: Create fresh schema with Supabase Auth integration
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLE 1: Users (profiles linked to Supabase Auth)
-- =====================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    role VARCHAR(10) NOT NULL CHECK (role IN ('Admin', 'Owner', 'Tenant')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_approved ON users(is_approved);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users (fixed to avoid infinite recursion)
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT 
    USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE 
    USING (auth_user_id = auth.uid());

CREATE POLICY "Allow insert during registration" ON users
    FOR INSERT 
    WITH CHECK (true);

-- =====================================================
-- TABLE 2: Properties
-- =====================================================

CREATE TABLE properties (
    property_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    property_type VARCHAR(20) NOT NULL CHECK (property_type IN ('Flat', 'PG', 'Hostel')),
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_is_approved ON properties(is_approved);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies for properties
CREATE POLICY "Anyone can view approved properties" ON properties
    FOR SELECT
    USING (is_approved = true);

CREATE POLICY "Owners can view their own properties" ON properties
    FOR SELECT
    USING (
        owner_id IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can insert properties" ON properties
    FOR INSERT
    WITH CHECK (
        owner_id IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid() AND role = 'Owner'
        )
    );

CREATE POLICY "Owners can update their properties" ON properties
    FOR UPDATE
    USING (
        owner_id IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all properties" ON properties
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() AND role = 'Admin'
        )
    );

CREATE POLICY "Admins can update all properties" ON properties
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() AND role = 'Admin'
        )
    );

-- =====================================================
-- TABLE 3: Rooms
-- =====================================================

CREATE TABLE rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    rent_price DECIMAL(10, 2) NOT NULL CHECK (rent_price > 0),
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(property_id, room_number)
);

-- Indexes
CREATE INDEX idx_rooms_property_id ON rooms(property_id);
CREATE INDEX idx_rooms_is_occupied ON rooms(is_occupied);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rooms
CREATE POLICY "Anyone can view rooms of approved properties" ON rooms
    FOR SELECT
    USING (
        property_id IN (
            SELECT property_id FROM properties WHERE is_approved = true
        )
    );

CREATE POLICY "Property owners can manage their rooms" ON rooms
    FOR ALL
    USING (
        property_id IN (
            SELECT property_id FROM properties 
            WHERE owner_id IN (
                SELECT user_id FROM users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- TABLE 4: Beds (for PG/Hostel)
-- =====================================================

CREATE TABLE beds (
    bed_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    bed_number VARCHAR(50) NOT NULL,
    is_occupied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(room_id, bed_number)
);

-- Indexes
CREATE INDEX idx_beds_room_id ON beds(room_id);
CREATE INDEX idx_beds_is_occupied ON beds(is_occupied);

-- Enable RLS
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for beds
CREATE POLICY "Anyone can view beds of approved properties" ON beds
    FOR SELECT
    USING (
        room_id IN (
            SELECT room_id FROM rooms 
            WHERE property_id IN (
                SELECT property_id FROM properties WHERE is_approved = true
            )
        )
    );

CREATE POLICY "Property owners can manage their beds" ON beds
    FOR ALL
    USING (
        room_id IN (
            SELECT room_id FROM rooms 
            WHERE property_id IN (
                SELECT property_id FROM properties 
                WHERE owner_id IN (
                    SELECT user_id FROM users WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

-- =====================================================
-- TABLE 5: Leases
-- =====================================================

CREATE TABLE leases (
    lease_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(room_id) ON DELETE SET NULL,
    bed_id UUID REFERENCES beds(bed_id) ON DELETE SET NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(10, 2) NOT NULL CHECK (monthly_rent > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Terminated', 'Expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_date > start_date)
);

-- Indexes
CREATE INDEX idx_leases_tenant_id ON leases(tenant_id);
CREATE INDEX idx_leases_property_id ON leases(property_id);
CREATE INDEX idx_leases_room_id ON leases(room_id);
CREATE INDEX idx_leases_status ON leases(status);

-- Enable RLS
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leases
CREATE POLICY "Tenants can view their leases" ON leases
    FOR SELECT
    USING (
        tenant_id IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Tenants can create lease applications" ON leases
    FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid() AND role = 'Tenant'
        )
    );

CREATE POLICY "Property owners can view leases for their properties" ON leases
    FOR SELECT
    USING (
        property_id IN (
            SELECT property_id FROM properties 
            WHERE owner_id IN (
                SELECT user_id FROM users WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Property owners can update leases for their properties" ON leases
    FOR UPDATE
    USING (
        property_id IN (
            SELECT property_id FROM properties 
            WHERE owner_id IN (
                SELECT user_id FROM users WHERE auth_user_id = auth.uid()
            )
        )
    );

-- =====================================================
-- TABLE 6: Payment Methods
-- =====================================================

CREATE TABLE payment_methods (
    payment_method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    method_type VARCHAR(20) NOT NULL CHECK (method_type IN ('Credit Card', 'Debit Card', 'Bank Account', 'UPI')),
    details JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
CREATE POLICY "Users can manage their own payment methods" ON payment_methods
    FOR ALL
    USING (
        user_id IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- TABLE 7: Transactions
-- =====================================================

CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(lease_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method_id UUID REFERENCES payment_methods(payment_method_id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transactions_lease_id ON transactions(lease_id);
CREATE INDEX idx_transactions_payment_date ON transactions(payment_date);
CREATE INDEX idx_transactions_status ON transactions(status);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Tenants can view their transactions" ON transactions
    FOR SELECT
    USING (
        lease_id IN (
            SELECT lease_id FROM leases 
            WHERE tenant_id IN (
                SELECT user_id FROM users WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Tenants can create transactions" ON transactions
    FOR INSERT
    WITH CHECK (
        lease_id IN (
            SELECT lease_id FROM leases 
            WHERE tenant_id IN (
                SELECT user_id FROM users WHERE auth_user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Property owners can view transactions for their properties" ON transactions
    FOR SELECT
    USING (
        lease_id IN (
            SELECT lease_id FROM leases 
            WHERE property_id IN (
                SELECT property_id FROM properties 
                WHERE owner_id IN (
                    SELECT user_id FROM users WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

-- =====================================================
-- TABLE 8: Payouts
-- =====================================================

CREATE TABLE payouts (
    payout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    payout_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Completed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_payouts_owner_id ON payouts(owner_id);
CREATE INDEX idx_payouts_status ON payouts(status);

-- Enable RLS
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payouts
CREATE POLICY "Owners can view their payouts" ON payouts
    FOR SELECT
    USING (
        owner_id IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all payouts" ON payouts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() AND role = 'Admin'
        )
    );

-- =====================================================
-- TABLE 9: Disputes
-- =====================================================

CREATE TABLE disputes (
    dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(lease_id) ON DELETE CASCADE,
    raised_by UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    resolution TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_disputes_lease_id ON disputes(lease_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for disputes
CREATE POLICY "Users can view disputes they raised" ON disputes
    FOR SELECT
    USING (
        raised_by IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create disputes" ON disputes
    FOR INSERT
    WITH CHECK (
        raised_by IN (
            SELECT user_id FROM users WHERE auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can view disputes for their properties" ON disputes
    FOR SELECT
    USING (
        lease_id IN (
            SELECT lease_id FROM leases 
            WHERE property_id IN (
                SELECT property_id FROM properties 
                WHERE owner_id IN (
                    SELECT user_id FROM users WHERE auth_user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Admins can manage all disputes" ON disputes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE auth_user_id = auth.uid() AND role = 'Admin'
        )
    );

-- =====================================================
-- STEP 3: Create updated_at triggers for all tables
-- =====================================================

-- Generic function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_beds_updated_at
    BEFORE UPDATE ON beds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_leases_updated_at
    BEFORE UPDATE ON leases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_payouts_updated_at
    BEFORE UPDATE ON payouts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION & SUCCESS MESSAGE
-- =====================================================

-- List all tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DATABASE RESET COMPLETE!';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '✅ All old tables deleted';
    RAISE NOTICE '✅ Fresh schema created with 9 tables:';
    RAISE NOTICE '   1. users (with auth_user_id linking to Supabase Auth)';
    RAISE NOTICE '   2. properties';
    RAISE NOTICE '   3. rooms';
    RAISE NOTICE '   4. beds';
    RAISE NOTICE '   5. leases';
    RAISE NOTICE '   6. payment_methods';
    RAISE NOTICE '   7. transactions';
    RAISE NOTICE '   8. payouts';
    RAISE NOTICE '   9. disputes';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Row Level Security enabled';
    RAISE NOTICE '✅ Security policies created';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ Auto-update triggers configured';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 READY TO USE!';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Go to http://localhost:8080/auth';
    RAISE NOTICE '2. Click Sign Up';
    RAISE NOTICE '3. Create your first account!';
    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
END $$;
