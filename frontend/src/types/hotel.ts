export type UserRole = 'admin' | 'user' | 'staff';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export type RoomTier = 'Basic' | 'Standard' | 'Deluxe' | 'Suite' | 'Presidential';
export type RoomCondition = 'clean' | 'dirty' | 'maintenance';

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
  condition: RoomCondition;
  createdAt: string;
}

export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'completed' | 'paid' | 'refunded';
export type PaymentMethod = 'card' | 'cash' | 'bank_transfer';

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  checkInTime?: string;
  checkOutTime?: string;
  guests: number;
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  guestNotes?: string;
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

export interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetId: string;
  details: string;
  beforeValue?: string;
  afterValue?: string;
  createdAt: string;
}

export type NotificationType = 'booking' | 'payment' | 'guest_note' | 'contact_message' | 'system';

export interface Notification {
  id: string;
  userId: string | null; // null means for all admins/staff
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: string; // bookingId, paymentId, etc.
  read: boolean;
  createdAt: string;
  hiddenFor?: string[]; // Array of user IDs who have hidden this notification
}
