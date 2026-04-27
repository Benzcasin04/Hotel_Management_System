// Shared types between frontend and backend
// These should match your Supabase database schema

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'staff' | 'user';
  is_active?: boolean;
  created_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  type: 'standard' | 'suite' | 'luxury' | 'presidential';
  price_per_night: number;
  capacity: number;
  amenities: string[];
  description: string;
  image_url?: string;
  is_available: boolean;
}

export interface Booking {
  id: string;
  user_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  guest_count: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
  special_requests?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  payment_method: 'cash' | 'card' | 'online';
  status: 'pending' | 'completed' | 'refunded' | 'failed';
  transaction_id?: string;
  paid_at?: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
