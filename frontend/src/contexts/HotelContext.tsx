import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Room, Booking, Payment, User, BookingStatus, PaymentStatus, PaymentMethod } from '@/types/hotel';
// Note: mock data removed - now using backend API
import { supabase } from '@/lib/supabase';

interface HotelContextType {
  rooms: Room[];
  bookings: Booking[];
  payments: Payment[];
  users: User[];
  addRoom: (room: Omit<Room, 'id' | 'createdAt'>) => Promise<Room>;
  updateRoom: (id: string, updates: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  toggleRoomActive: (id: string) => Promise<void>;
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  updateBookingForStaff: (id: string, status: BookingStatus) => Promise<void>;
  updateBookingPaymentStatus: (id: string, paymentStatus: PaymentStatus) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  deleteBookingPermanently: (id: string) => Promise<void>;
  isRoomAvailable: (roomId: string, checkIn: string, checkOut: string, checkInTime?: string, checkOutTime?: string, excludeBookingId?: string) => boolean;
  createPayment: (bookingId: string, amount: number, method: PaymentMethod) => Promise<Payment>;
  createPaymentAndUpdateBooking: (bookingId: string, amount: number, method: PaymentMethod) => Promise<Payment>;
  updatePaymentStatus: (paymentId: string, status: PaymentStatus, note?: string, adjustedBy?: string) => Promise<void>;
  adjustPaymentAmount: (paymentId: string, amount: number, note?: string, adjustedBy?: string) => Promise<void>;
  processRefund: (paymentId: string, note?: string) => Promise<void>;
  getRoomById: (id: string) => Room | undefined;
  getBookingsByUser: (userId: string) => Booking[];
  getDisplayPaymentStatus: (booking: Booking) => PaymentStatus;
  refreshUsers: () => Promise<void>;
  updateRoomCondition: (id: string, condition: Room['condition']) => Promise<void>;
  fetchPayments: () => Promise<void>;
  getAuthToken: () => Promise<string | undefined>;
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

// Helper to get auth token
const getAuthToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
};

// Helper to get current user ID
const getCurrentUserId = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user?.id;
};

// Map database fields to frontend fields
const mapRoomFromDB = (r: any): Room => ({
  id: r.id,
  name: r.name,
  tier: r.tier,
  floor: r.floor,
  capacity: r.capacity,
  pricePerNight: r.price_per_night,
  description: r.description,
  amenities: r.amenities || [],
  images: r.images || [],
  isActive: r.is_active,
  condition: r.condition,
  createdAt: r.created_at,
});

const mapBookingFromDB = (b: any): Booking => ({
  id: b.id,
  userId: b.user_id,
  roomId: b.room_id,
  checkIn: b.check_in,
  checkOut: b.check_out,
  checkInTime: b.check_in_time,
  checkOutTime: b.check_out_time,
  guests: b.guests,
  status: b.status,
  totalAmount: b.total_amount,
  paymentStatus: b.payment_status,
  paymentMethod: b.payment_method,
  notes: b.notes,
  guestNotes: b.guest_notes,
  createdAt: b.created_at,
});

const mapPaymentFromDB = (p: any): Payment => ({
  id: p.id,
  bookingId: p.booking_id,
  amount: p.amount,
  method: p.method,
  status: p.status,
  note: p.note,
  adjustedBy: p.adjusted_by,
  createdAt: p.created_at,
});

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Fetch rooms from backend on mount
  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3007/api/rooms');
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      const mappedRooms = (data.data || []).map(mapRoomFromDB);
      setRooms(mappedRooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  }, []);

  // Fetch bookings from backend (user-specific for clients, all for admin/staff)
  const fetchBookings = useCallback(async () => {
    try {
      const token = await getAuthToken();
      // Get current user to determine role
      const cachedUser = localStorage.getItem('cached-user');
      let isAdminOrStaff = false;
      
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        const role = userData.role?.toLowerCase();
        isAdminOrStaff = role === 'admin' || role === 'staff';
      }
      
      // Use /my endpoint for regular users, / for admin/staff
      const endpoint = isAdminOrStaff 
        ? 'http://localhost:3007/api/bookings' 
        : 'http://localhost:3007/api/bookings/my';
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      const mappedBookings = (data.data || []).map(mapBookingFromDB);
      setBookings(mappedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  }, []);

  // Fetch payments from backend (user-specific for clients, all for admin/staff)
  const fetchPayments = useCallback(async () => {
    try {
      const token = await getAuthToken();
      // Get current user to determine role
      const cachedUser = localStorage.getItem('cached-user');
      let isAdminOrStaff = false;
      
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        const role = userData.role?.toLowerCase();
        isAdminOrStaff = role === 'admin' || role === 'staff';
      }
      
      // Use /my endpoint for regular users, / for admin/staff
      const endpoint = isAdminOrStaff 
        ? 'http://localhost:3007/api/payments' 
        : 'http://localhost:3007/api/payments/my';
        
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch payments');
      const data = await response.json();
      const mappedPayments = (data.data || []).map(mapPaymentFromDB);
      setPayments(mappedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  }, []);

  // Fetch users from backend (admin/staff only)
  const fetchUsers = useCallback(async () => {
    try {
      const token = await getAuthToken();
      
      // Get current user to determine role - skip if not admin/staff
      const cachedUser = localStorage.getItem('cached-user');
      let isAdminOrStaff = false;
      
      if (cachedUser) {
        const userData = JSON.parse(cachedUser);
        const role = userData.role?.toLowerCase();
        isAdminOrStaff = role === 'admin' || role === 'staff';
      }
      
      // Skip fetching users for regular clients (they don't have permission)
      if (!isAdminOrStaff) {
        console.log('Skipping user fetch - user is not admin/staff:', cachedUser);
        setUsers([]);
        return;
      }
      
      console.log('Fetching users with token:', token ? 'present' : 'missing');
      const response = await fetch('http://localhost:3007/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('Users API response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Users API error:', response.status, errorText);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      const data = await response.json();
      console.log('Users fetched:', data.data?.length || 0, 'users');
      // Map snake_case fields from backend to camelCase for frontend
      const mappedUsers = (data.data || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        isActive: u.is_active, // Map snake_case to camelCase
        createdAt: u.created_at,
      }));
      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    fetchBookings();
    fetchUsers();
    
    // Only fetch payments for admin/staff users, not for regular users
    const cachedUser = localStorage.getItem('cached-user');
    if (cachedUser) {
      const userData = JSON.parse(cachedUser);
      const role = userData.role?.toLowerCase();
      const isAdminOrStaff = role === 'admin' || role === 'staff';
      if (isAdminOrStaff) {
        fetchPayments();
      }
    }
  }, [fetchRooms, fetchBookings, fetchUsers, fetchPayments]);

  const addRoom = useCallback(async (room: Omit<Room, 'id' | 'createdAt'>) => {
    try {
      const roomData = {
        name: room.name,
        tier: room.tier,
        floor: room.floor,
        capacity: room.capacity,
        price_per_night: room.pricePerNight,
        description: room.description,
        amenities: room.amenities,
        images: room.images,
        is_active: room.isActive,
        condition: room.condition,
      };

      const response = await fetch('http://localhost:3007/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        let errorMsg = 'Failed to create room';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMsg = `HTTP ${response.status}: ${await response.text()}`;
        }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      const newRoom = mapRoomFromDB(data.data);
      setRooms(prev => [...prev, newRoom]);
      return newRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }, []);

  const updateRoom = useCallback(async (id: string, updates: Partial<Room>) => {
    try {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.tier !== undefined) updateData.tier = updates.tier;
      if (updates.floor !== undefined) updateData.floor = updates.floor;
      if (updates.capacity !== undefined) updateData.capacity = updates.capacity;
      if (updates.pricePerNight !== undefined) updateData.price_per_night = updates.pricePerNight;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amenities !== undefined) updateData.amenities = updates.amenities;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.condition !== undefined) updateData.condition = updates.condition;

      const response = await fetch(`http://localhost:3007/api/rooms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Failed to update room');
      const data = await response.json();
      const updatedRoom = mapRoomFromDB(data.data);
      setRooms(prev => prev.map(r => r.id === id ? updatedRoom : r));
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  }, []);

  // Update room condition (for housekeeping)
  const updateRoomCondition = useCallback(async (id: string, condition: Room['condition']) => {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`http://localhost:3007/api/rooms/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ condition }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update room condition');
      }
      
      const data = await response.json();
      const updatedRoom = mapRoomFromDB(data.data);
      
      // Update local state
      setRooms(prev => prev.map(r => r.id === id ? updatedRoom : r));
    } catch (error) {
      console.error('Error updating room condition:', error);
      throw error;
    }
  }, []);

  const deleteRoom = useCallback(async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3007/api/rooms/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete room');
      setRooms(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  }, []);

  const toggleRoomActive = useCallback(async (id: string) => {
    const room = rooms.find(r => r.id === id);
    if (!room) return;
    await updateRoom(id, { isActive: !room.isActive });
  }, [rooms, updateRoom]);

  const isRoomAvailable = useCallback((roomId: string, checkIn: string, checkOut: string, checkInTime?: string, checkOutTime?: string, excludeBookingId?: string) => {
    const conflicting = bookings.filter(b => {
      // Basic room and status check
      if (b.roomId !== roomId) return false;
      if (b.id === excludeBookingId) return false;
      if (b.status === 'cancelled' || b.status === 'checked_out') return false;
      
      // Check for actual date+time overlap
      // Create full datetime objects for comparison
      const newCheckIn = new Date(`${checkIn}T${checkInTime || '00:00:00'}`);
      const newCheckOut = new Date(`${checkOut}T${checkOutTime || '23:59:59'}`);
      const existingCheckIn = new Date(`${b.checkIn}T${b.checkInTime || '00:00:00'}`);
      const existingCheckOut = new Date(`${b.checkOut}T${b.checkOutTime || '23:59:59'}`);
      
      // Actual overlap: new booking starts before existing ends AND new booking ends after existing starts
      const overlap = newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
      return overlap;
    });
    return conflicting.length === 0;
  }, [bookings]);

  const createBooking = useCallback(async (booking: Omit<Booking, 'id' | 'createdAt'>) => {
    try {
      const bookingData = {
        room_id: booking.roomId,
        check_in: booking.checkIn,
        check_out: booking.checkOut,
        check_in_time: booking.checkInTime,
        check_out_time: booking.checkOutTime,
        guests: booking.guests,
        total_amount: booking.totalAmount,
        payment_method: booking.paymentMethod,
        payment_status: booking.paymentStatus,
        notes: booking.notes,
        guest_notes: booking.guestNotes,
      };

      const response = await fetch('http://localhost:3007/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to create booking' };
      }

      const data = await response.json();
      const newBooking = mapBookingFromDB(data.data);
      setBookings(prev => [...prev, newBooking]);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error creating booking:', error);
      return { success: false, error: error.message || 'Failed to create booking' };
    }
  }, []);

  const updateBookingStatus = useCallback(async (id: string, status: BookingStatus) => {
    try {
      const response = await fetch(`http://localhost:3007/api/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update booking');
      
      const data = await response.json();
      const updatedBooking = mapBookingFromDB(data.data);
      setBookings(prev => prev.map(b => b.id === id ? updatedBooking : b));
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }, []);

  const updateBookingForStaff = useCallback(async (id: string, status: BookingStatus) => {
    try {
      const response = await fetch(`http://localhost:3007/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error('Failed to update booking');
      
      const data = await response.json();
      const updatedBooking = mapBookingFromDB(data.data);
      setBookings(prev => prev.map(b => b.id === id ? updatedBooking : b));
    } catch (error) {
      console.error('Error updating booking for staff:', error);
      throw error;
    }
  }, []);

  const updateBookingPaymentStatus = useCallback(async (id: string, paymentStatus: PaymentStatus) => {
    try {
      // Get current booking to preserve other fields
      const currentBooking = bookings.find(b => b.id === id);
      if (!currentBooking) {
        throw new Error('Booking not found');
      }
      
      const response = await fetch(`http://localhost:3007/api/bookings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ 
          status: currentBooking.status,
          payment_status: paymentStatus 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Backend error:', errorData);
        throw new Error(errorData.error || 'Failed to update booking payment status');
      }
      
      const data = await response.json();
      const updatedBooking = mapBookingFromDB(data.data);
      
      setBookings(prev => prev.map(b => b.id === id ? updatedBooking : b));
    } catch (error) {
      console.error('Error updating booking payment status:', error);
      throw error;
    }
  }, [bookings]);

  const cancelBooking = useCallback(async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3007/api/bookings/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to cancel booking');
      
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b));
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }, []);

  const deleteBookingPermanently = useCallback(async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3007/api/bookings/${id}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete booking');
      
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }, []);

  const createPayment = useCallback(async (bookingId: string, amount: number, method: PaymentMethod) => {
    try {
      const userId = await getCurrentUserId();
      const response = await fetch('http://localhost:3007/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          amount,
          method,
          status: 'pending',
        }),
      });

      if (!response.ok) throw new Error('Failed to create payment');
      
      const data = await response.json();
      const newPayment = mapPaymentFromDB(data.data);
      
      setPayments(prev => [...prev, newPayment]);
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paymentStatus: 'pending' } : b));
      
      return newPayment;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }, []);

  const updatePaymentStatus = useCallback(async (paymentId: string, status: PaymentStatus, note?: string, _adjustedBy?: string) => {
    try {
      const userId = await getCurrentUserId();
      const response = await fetch(`http://localhost:3007/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ status, note, adjusted_by: userId }),
      });

      if (!response.ok) throw new Error('Failed to update payment');
      
      const data = await response.json();
      const updatedPayment = mapPaymentFromDB(data.data);
      
      setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      setBookings(prev => prev.map(b => b.id === updatedPayment.bookingId ? { ...b, paymentStatus: status } : b));
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }, []);

  const adjustPaymentAmount = useCallback(async (paymentId: string, amount: number, note?: string, _adjustedBy?: string) => {
    try {
      const userId = await getCurrentUserId();
      const response = await fetch(`http://localhost:3007/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ amount, note, adjusted_by: userId }),
      });

      if (!response.ok) throw new Error('Failed to adjust payment');
      
      const data = await response.json();
      const updatedPayment = mapPaymentFromDB(data.data);
      
      setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      setBookings(prev => prev.map(b => b.id === updatedPayment.bookingId ? { ...b, totalAmount: amount } : b));
    } catch (error) {
      console.error('Error adjusting payment amount:', error);
      throw error;
    }
  }, []);

  const processRefund = useCallback(async (paymentId: string, note?: string) => {
    try {
      const response = await fetch(`http://localhost:3007/api/payments/${paymentId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`,
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) throw new Error('Failed to process refund');
      
      const data = await response.json();
      const updatedPayment = mapPaymentFromDB(data.data);
      
      setPayments(prev => prev.map(p => p.id === paymentId ? updatedPayment : p));
      setBookings(prev => prev.map(b => b.id === updatedPayment.bookingId ? { ...b, paymentStatus: 'refunded', status: 'cancelled' } : b));
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }, []);

  const createPaymentAndUpdateBooking = useCallback(async (bookingId: string, amount: number, method: PaymentMethod) => {
    try {
      // Create payment record first
      const payment = await createPayment(bookingId, amount, method);
      
      // Update booking payment status to 'paid' (database constraint allows this)
      await updateBookingPaymentStatus(bookingId, 'paid');
      
      // Update booking status to pending (waiting for admin approval)
      await updateBookingStatus(bookingId, 'pending');
      
      return payment;
    } catch (error) {
      console.error('Error in combined payment and booking update:', error);
      throw error;
    }
  }, [createPayment, updateBookingPaymentStatus, updateBookingStatus]);

  const getRoomById = useCallback((id: string) => rooms.find(r => r.id === id), [rooms]);

  const getBookingsByUser = useCallback((userId: string) => bookings.filter(b => b.userId === userId), [bookings]);

  // Helper function to get display payment status
  const getDisplayPaymentStatus = useCallback((booking: Booking) => {
    // Show 'unpaid' for initial bookings, 'pending' after payment confirmation
    // If actual payment status is 'unpaid', show 'unpaid'
    // If actual payment status is 'paid' but booking is still pending, show 'pending'
    if (booking.paymentStatus === 'unpaid') {
      return 'unpaid';
    }
    if (booking.paymentStatus === 'paid' && booking.status === 'pending') {
      return 'pending';
    }
    return booking.paymentStatus;
  }, []);

  return (
    <HotelContext.Provider value={{
      rooms, bookings, payments, users,
      addRoom, updateRoom, deleteRoom, toggleRoomActive,
      createBooking, updateBookingStatus, updateBookingForStaff, updateBookingPaymentStatus, cancelBooking, deleteBookingPermanently, isRoomAvailable,
      createPayment, createPaymentAndUpdateBooking, updatePaymentStatus, adjustPaymentAmount, processRefund,
      getRoomById, getBookingsByUser, getDisplayPaymentStatus,
      refreshUsers: fetchUsers,
      updateRoomCondition,
      fetchPayments,
      getAuthToken,
    }}>
      {children}
    </HotelContext.Provider>
  );
};

export const useHotel = () => {
  const ctx = useContext(HotelContext);
  if (!ctx) throw new Error('useHotel must be used within HotelProvider');
  return ctx;
};
