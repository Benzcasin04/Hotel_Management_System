export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export type RoomTier = 'Basic' | 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';

export interface RoomAmenity {
  id: string;
  name: string;
  icon: string;
}

export interface Room {
  id: string;
  name: string;
  tier: RoomTier;
  floor: number;
  capacity: number;
  pricePerNight: number;
  description: string;
  amenities: string[];
  images: string[];
  isActive: boolean;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type PaymentMethod = 'card' | 'cash' | 'bank_transfer';

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  note?: string;
  adjustedBy?: string;
  createdAt: string;
}
