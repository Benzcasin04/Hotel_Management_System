-- Hotel Management System - Supabase Database Schema
-- Based on frontend mock data and type definitions
-- 
-- NAMING CONVENTION ALIGNMENT:
-- Frontend (TypeScript)    -> Database (PostgreSQL)
-- ----------------------    -> -----------------------
-- isActive                  -> is_active
-- pricePerNight             -> price_per_night
-- totalAmount               -> total_amount
-- createdAt                 -> created_at
-- updatedAt                 -> updated_at
-- userId                    -> user_id
-- roomId                    -> room_id
-- bookingId                 -> booking_id
-- paymentStatus             -> payment_status
-- paymentMethod             -> payment_method
-- guestNotes                -> guest_notes
-- 
-- Roles: admin, staff, user (frontend displays 'user' as 'Client')
-- Room Condition: clean, dirty, maintenance (housekeeping status)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MIGRATION: Update existing tables (run first)
-- These commands safely add missing columns/constraints
-- to existing databases without breaking data
-- =====================================================

-- Add missing columns to existing rooms table
ALTER TABLE IF EXISTS rooms 
  ADD COLUMN IF NOT EXISTS condition VARCHAR(50) DEFAULT 'clean' 
    CHECK (condition IN ('clean', 'dirty', 'maintenance')),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add missing columns to existing users table  
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update role constraint on existing users table
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
  -- Add updated constraint with staff role
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'staff', 'user'));
EXCEPTION
  WHEN others THEN NULL; -- Ignore errors if constraint doesn't exist
END $$;

-- =====================================================
-- TABLE DEFINITIONS (with IF NOT EXISTS)
-- These will create tables if they don't exist
-- Tables already having the columns above will be skipped
-- =====================================================

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'user' 
    CHECK (role IN ('admin', 'staff', 'user')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
-- Note: Database uses snake_case, frontend maps to camelCase
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL 
    CHECK (tier IN ('Basic', 'Standard', 'Deluxe', 'Suite', 'Presidential')),
  floor INTEGER NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0), -- maps to pricePerNight
  description TEXT NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  condition VARCHAR(50) DEFAULT 'clean' 
    CHECK (condition IN ('clean', 'dirty', 'maintenance')), -- housekeeping status
  is_active BOOLEAN DEFAULT true, -- maps to isActive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- maps to createdAt
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL CHECK (check_out > check_in),
  guests INTEGER NOT NULL CHECK (guests > 0),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method VARCHAR(50) 
    CHECK (payment_method IN ('card', 'cash', 'bank_transfer')),
  notes TEXT,
  special_requests TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  method VARCHAR(50) NOT NULL 
    CHECK (method IN ('card', 'cash', 'bank_transfer', 'online')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'refunded', 'failed')),
  transaction_id VARCHAR(255),
  note TEXT,
  adjusted_by UUID REFERENCES users(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to sync user role to Supabase Auth metadata (JWT)
-- This ensures role is available in auth.jwt() ->> 'role'
CREATE OR REPLACE FUNCTION sync_user_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's raw_user_meta_data in auth.users
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync role on user insert/update
DROP TRIGGER IF EXISTS sync_user_role_trigger ON users;
CREATE TRIGGER sync_user_role_trigger
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_role_to_auth();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_rooms_tier ON rooms(tier);
CREATE INDEX IF NOT EXISTS idx_rooms_condition ON rooms(condition); -- for housekeeping
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins and Staff can view all users" ON users;
CREATE POLICY "Admins and Staff can view all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can insert users" ON users;
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can update users" ON users;
CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

-- RLS Policies for rooms table
DROP POLICY IF EXISTS "Everyone can view active rooms" ON rooms;
CREATE POLICY "Everyone can view active rooms" ON rooms
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins and Staff can view all rooms" ON rooms;
CREATE POLICY "Admins and Staff can view all rooms" ON rooms
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can manage rooms" ON rooms;
CREATE POLICY "Admins can manage rooms" ON rooms
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Staff can update room status" ON rooms;
CREATE POLICY "Staff can update room status" ON rooms
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'staff');

-- RLS Policies for bookings table
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins and Staff can view all bookings" ON bookings;
CREATE POLICY "Admins and Staff can view all bookings" ON bookings
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings" ON bookings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Staff can update bookings" ON bookings;
CREATE POLICY "Staff can update bookings" ON bookings
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'staff');

-- RLS Policies for payments table
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins and Staff can view all payments" ON payments;
CREATE POLICY "Admins and Staff can view all payments" ON payments
  FOR SELECT USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

DROP POLICY IF EXISTS "Admins can manage payments" ON payments;
CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Staff can view payments" ON payments;
CREATE POLICY "Staff can view payments" ON payments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'staff');

-- Function to convert snake_case JSON keys to camelCase
-- Useful for API responses that match frontend TypeScript interfaces
CREATE OR REPLACE FUNCTION to_camel_case(str TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT := str;
  underscore_pos INTEGER;
BEGIN
  LOOP
    underscore_pos := POSITION('_' IN result);
    EXIT WHEN underscore_pos = 0;
    result := CONCAT(
      LEFT(result, underscore_pos - 1),
      UPPER(SUBSTRING(result FROM underscore_pos + 1 FOR 1)),
      SUBSTRING(result FROM underscore_pos + 2)
    );
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Views with camelCase column names (matching frontend TypeScript interfaces)
-- These make it easier for the backend to return correctly formatted JSON

CREATE OR REPLACE VIEW users_camel AS
SELECT 
  id,
  email,
  name,
  phone,
  role,
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
FROM users;

CREATE OR REPLACE VIEW rooms_camel AS
SELECT 
  id,
  name,
  tier,
  floor,
  capacity,
  price_per_night AS "pricePerNight",
  description,
  amenities,
  images,
  condition,
  is_active AS "isActive",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
FROM rooms;

CREATE OR REPLACE VIEW bookings_camel AS
SELECT 
  id,
  user_id AS "userId",
  room_id AS "roomId",
  check_in AS "checkIn",
  check_out AS "checkOut",
  guests,
  status,
  total_amount AS "totalAmount",
  payment_status AS "paymentStatus",
  payment_method AS "paymentMethod",
  notes,
  special_requests AS "specialRequests",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
FROM bookings;

CREATE OR REPLACE VIEW payments_camel AS
SELECT 
  id,
  booking_id AS "bookingId",
  amount,
  method,
  status,
  transaction_id AS "transactionId",
  note,
  adjusted_by AS "adjustedBy",
  paid_at AS "paidAt",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
FROM payments;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to sync new auth users to public.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    phone = EXCLUDED.phone;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample data (optional)
-- Matches frontend/src/data/mockData.ts
INSERT INTO users (email, name, phone, role, is_active) VALUES
  ('admin@luxehotel.com', 'Admin Manager', '+1-555-0100', 'admin', true),
  ('john@example.com', 'John Doe', '+1-555-0201', 'user', true),
  ('jane@example.com', 'Jane Smith', '+1-555-0302', 'user', true),
  ('staff@luxehotel.com', 'Maria Garcia', '+1-555-0400', 'staff', true),
  ('frontdesk@luxehotel.com', 'Carlos Rivera', '+1-555-0500', 'staff', true)
ON CONFLICT (email) DO NOTHING;

INSERT INTO rooms (name, tier, floor, capacity, price_per_night, description, amenities, condition, is_active) VALUES
  ('Ocean View Basic', 'Basic', 1, 2, 89.00, 'A cozy basic room with essential amenities and a beautiful ocean view.', ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Fridge'], 'clean', true),
  ('Garden Standard Room', 'Standard', 2, 2, 149.00, 'Comfortable standard room with garden views, upgraded furnishings.', ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service', 'Safe'], 'clean', true),
  ('Deluxe King Room', 'Deluxe', 5, 3, 249.00, 'Spacious deluxe room featuring a king-size bed, sitting area.', ARRAY['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Room Service', 'Safe', 'Bathrobe', 'Spa Access'], 'dirty', true),
  ('Executive Suite', 'Suite', 8, 4, 399.00, 'Elegant executive suite with separate living area, workspace.', ARRAY['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Full Bar', 'Room Service', 'Safe', 'Bathrobe', 'Spa Access', 'Butler Service', 'Lounge Access'], 'clean', true),
  ('Presidential Suite', 'Presidential', 12, 6, 899.00, 'The pinnacle of luxury with private terrace, jacuzzi, dining room.', ARRAY['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Full Bar', 'Room Service', 'Safe', 'Bathrobe', 'Private Spa', 'Butler Service', 'Lounge Access', 'Private Terrace', 'Jacuzzi', 'Dining Room'], 'maintenance', true),
  ('Basic Twin Room', 'Basic', 1, 2, 79.00, 'Simple and clean twin room, ideal for friends or colleagues.', ARRAY['Wi-Fi', 'Air Conditioning', 'TV'], 'dirty', false);
