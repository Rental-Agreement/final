-- PostgreSQL Schema for Rental Application
-- Migration script for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS Table (Tenant, Owner, Admin)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    role VARCHAR(10) NOT NULL CHECK (role IN ('Admin', 'Owner', 'Tenant')),
    is_approved BOOLEAN DEFAULT FALSE,
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PROPERTIES Table
CREATE TABLE IF NOT EXISTS properties (
    property_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    address_line_1 VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    type VARCHAR(50),
    is_approved BOOLEAN DEFAULT FALSE,
    status VARCHAR(10) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROOMS Table
CREATE TABLE IF NOT EXISTS rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(property_id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    rent_price NUMERIC(10, 2) NOT NULL,
    description TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (property_id, room_number)
);

-- 4. BEDS Table
CREATE TABLE IF NOT EXISTS beds (
    bed_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(room_id) ON DELETE CASCADE,
    bed_name VARCHAR(50) NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (room_id, bed_name)
);

-- 5. LEASES Table
CREATE TABLE IF NOT EXISTS leases (
    lease_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(room_id) ON DELETE CASCADE,
    bed_id UUID REFERENCES beds(bed_id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent NUMERIC(10, 2) NOT NULL,
    security_deposit NUMERIC(10, 2) NOT NULL,
    billing_cycle VARCHAR(10) NOT NULL CHECK (billing_cycle IN ('Monthly', 'Weekly')),
    status VARCHAR(10) NOT NULL CHECK (status IN ('Pending', 'Active', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_unit_type CHECK (
        (room_id IS NOT NULL AND bed_id IS NULL) OR (room_id IS NULL AND bed_id IS NOT NULL)
    )
);

-- 6. PAYMENT_METHODS Table
CREATE TABLE IF NOT EXISTS payment_methods (
    method_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    method_type VARCHAR(10) NOT NULL CHECK (method_type IN ('UPI', 'Card', 'Bank')),
    last_four_digits VARCHAR(4),
    is_auto_pay BOOLEAN DEFAULT FALSE,
    token TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TRANSACTIONS Table
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lease_id UUID NOT NULL REFERENCES leases(lease_id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) NOT NULL CHECK (status IN ('Pending', 'Success', 'Failed')),
    payment_gateway_ref VARCHAR(255) UNIQUE,
    payment_method_id UUID REFERENCES payment_methods(method_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. PAYOUTS Table
CREATE TABLE IF NOT EXISTS payouts (
    payout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    related_transaction_id UUID REFERENCES transactions(transaction_id),
    gross_amount NUMERIC(10, 2) NOT NULL,
    gateway_fee NUMERIC(10, 2) NOT NULL,
    net_amount NUMERIC(10, 2) NOT NULL,
    payout_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Queued', 'Processing', 'Completed', 'Failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. DISPUTES Table
CREATE TABLE IF NOT EXISTS disputes (
    dispute_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    raised_by_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    related_transaction_id UUID REFERENCES transactions(transaction_id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Open', 'In Review', 'Resolved', 'Rejected')),
    resolved_by_admin_id UUID REFERENCES users(user_id),
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_beds_room ON beds(room_id);
CREATE INDEX idx_leases_tenant ON leases(tenant_id);
CREATE INDEX idx_leases_status ON leases(status);
CREATE INDEX idx_transactions_lease ON transactions(lease_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_payouts_owner ON payouts(owner_id);
CREATE INDEX idx_disputes_raised_by ON disputes(raised_by_user_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_beds_updated_at BEFORE UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leases_updated_at BEFORE UPDATE ON leases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'Admin'
        )
    );

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = auth_user_id);

-- Properties policies
CREATE POLICY "Anyone can view approved properties" ON properties
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Owners can view their own properties" ON properties
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = properties.owner_id AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can create properties" ON properties
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = owner_id AND auth_user_id = auth.uid() AND role = 'Owner'
        )
    );

CREATE POLICY "Owners can update their properties" ON properties
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = properties.owner_id AND auth_user_id = auth.uid()
        )
    );

-- Rooms policies
CREATE POLICY "Anyone can view rooms of approved properties" ON rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties WHERE property_id = rooms.property_id AND is_approved = true
        )
    );

CREATE POLICY "Owners can manage their property rooms" ON rooms
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM properties p
            JOIN users u ON p.owner_id = u.user_id
            WHERE p.property_id = rooms.property_id AND u.auth_user_id = auth.uid()
        )
    );

-- Leases policies
CREATE POLICY "Tenants can view their leases" ON leases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = leases.tenant_id AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Owners can view leases for their properties" ON leases
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rooms r
            JOIN properties p ON r.property_id = p.property_id
            JOIN users u ON p.owner_id = u.user_id
            WHERE r.room_id = leases.room_id AND u.auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM beds b
            JOIN rooms r ON b.room_id = r.room_id
            JOIN properties p ON r.property_id = p.property_id
            JOIN users u ON p.owner_id = u.user_id
            WHERE b.bed_id = leases.bed_id AND u.auth_user_id = auth.uid()
        )
    );

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM leases l
            JOIN users u ON l.tenant_id = u.user_id
            WHERE l.lease_id = transactions.lease_id AND u.auth_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM leases l
            JOIN rooms r ON l.room_id = r.room_id
            JOIN properties p ON r.property_id = p.property_id
            JOIN users u ON p.owner_id = u.user_id
            WHERE l.lease_id = transactions.lease_id AND u.auth_user_id = auth.uid()
        )
    );

-- Payouts policies
CREATE POLICY "Owners can view their payouts" ON payouts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = payouts.owner_id AND auth_user_id = auth.uid()
        )
    );

-- Disputes policies
CREATE POLICY "Users can view disputes they raised" ON disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = disputes.raised_by_user_id AND auth_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create disputes" ON disputes
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users WHERE user_id = raised_by_user_id AND auth_user_id = auth.uid()
        )
    );
