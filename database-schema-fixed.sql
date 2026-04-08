-- Hotel Management System - Supabase Database Schema
-- Based on frontend mock data and type definitions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  role VARCHAR(50) NOT NULL DEFAULT 'user' 
    CHECK (role IN ('admin', 'manager', 'receptionist', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL 
    CHECK (tier IN ('Basic', 'Standard', 'Deluxe', 'Suite', 'Presidential')),
  floor INTEGER NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  price_per_night DECIMAL(10,2) NOT NULL CHECK (price_per_night > 0),
  description TEXT NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_rooms_tier ON rooms(tier);
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
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for rooms table
CREATE POLICY "Everyone can view active rooms" ON rooms
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can view all rooms" ON rooms
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage rooms" ON rooms
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for bookings table
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage bookings" ON bookings
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- RLS Policies for payments table
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Functions for automatic timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional)
INSERT INTO users (email, name, phone, role) VALUES
  ('admin@luxehotel.com', 'Admin Manager', '+1-555-0100', 'admin'),
  ('john@example.com', 'John Doe', '+1-555-0201', 'user'),
  ('jane@example.com', 'Jane Smith', '+1-555-0302', 'user');

INSERT INTO rooms (name, tier, floor, capacity, price_per_night, description, amenities, is_active) VALUES
  ('Ocean View Basic', 'Basic', 1, 2, 89.00, 'A cozy basic room with essential amenities and a beautiful ocean view.', ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Fridge'], true),
  ('Garden Standard Room', 'Standard', 2, 2, 149.00, 'Comfortable standard room with garden views, upgraded furnishings.', ARRAY['Wi-Fi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service', 'Safe'], true),
  ('Deluxe King Room', 'Deluxe', 5, 3, 249.00, 'Spacious deluxe room featuring a king-size bed, sitting area.', ARRAY['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Mini Bar', 'Room Service', 'Safe', 'Bathrobe', 'Spa Access'], true),
  ('Executive Suite', 'Suite', 8, 4, 399.00, 'Elegant executive suite with separate living area, workspace.', ARRAY['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Full Bar', 'Room Service', 'Safe', 'Bathrobe', 'Spa Access', 'Butler Service', 'Lounge Access'], true),
  ('Presidential Suite', 'Presidential', 12, 6, 899.00, 'The pinnacle of luxury with private terrace, jacuzzi, dining room.', ARRAY['Wi-Fi', 'Air Conditioning', 'Smart TV', 'Full Bar', 'Room Service', 'Safe', 'Bathrobe', 'Private Spa', 'Butler Service', 'Lounge Access', 'Private Terrace', 'Jacuzzi', 'Dining Room'], true),
  ('Basic Twin Room', 'Basic', 1, 2, 79.00, 'Simple and clean twin room, ideal for friends or colleagues.', ARRAY['Wi-Fi', 'Air Conditioning', 'TV'], false);
