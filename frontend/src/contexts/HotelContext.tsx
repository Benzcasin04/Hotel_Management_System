import React, { createContext, useContext, useState, useCallback } from 'react';
import { Room, Booking, Payment, BookingStatus, PaymentStatus, PaymentMethod } from '@/types/hotel';
import { mockRooms, mockBookings, mockPayments } from '@/data/mockData';

interface HotelContextType {
  rooms: Room[];
  bookings: Booking[];
  payments: Payment[];
  addRoom: (room: Omit<Room, 'id' | 'createdAt'>) => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  toggleRoomActive: (id: string) => void;
  createBooking: (booking: Omit<Booking, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  cancelBooking: (id: string) => void;
  isRoomAvailable: (roomId: string, checkIn: string, checkOut: string, excludeBookingId?: string) => boolean;
  updatePaymentStatus: (bookingId: string, status: PaymentStatus, note?: string, adjustedBy?: string) => void;
  adjustPaymentAmount: (bookingId: string, amount: number, note?: string, adjustedBy?: string) => void;
  getRoomById: (id: string) => Room | undefined;
  getBookingsByUser: (userId: string) => Booking[];
}

const HotelContext = createContext<HotelContextType | undefined>(undefined);

export const HotelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);

  const addRoom = useCallback((room: Omit<Room, 'id' | 'createdAt'>) => {
    const newRoom: Room = { ...room, id: `room-${Date.now()}`, createdAt: new Date().toISOString() };
    setRooms(prev => [...prev, newRoom]);
  }, []);

  const updateRoom = useCallback((id: string, updates: Partial<Room>) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRoom = useCallback((id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  }, []);

  const toggleRoomActive = useCallback((id: string) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
  }, []);

  const isRoomAvailable = useCallback((roomId: string, checkIn: string, checkOut: string, excludeBookingId?: string) => {
    const conflicting = bookings.filter(b =>
      b.roomId === roomId &&
      b.id !== excludeBookingId &&
      b.status !== 'cancelled' &&
      b.status !== 'checked_out' &&
      b.checkIn < checkOut &&
      b.checkOut > checkIn
    );
    return conflicting.length === 0;
  }, [bookings]);

  const createBooking = useCallback((booking: Omit<Booking, 'id' | 'createdAt'>) => {
    if (!isRoomAvailable(booking.roomId, booking.checkIn, booking.checkOut)) {
      return { success: false, error: 'Room is not available for the selected dates' };
    }
    const newBooking: Booking = {
      ...booking,
      id: `booking-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setBookings(prev => [...prev, newBooking]);
    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      bookingId: newBooking.id,
      amount: booking.totalAmount,
      method: booking.paymentMethod,
      status: booking.paymentStatus,
      createdAt: new Date().toISOString(),
    };
    setPayments(prev => [...prev, newPayment]);
    return { success: true };
  }, [isRoomAvailable]);

  const updateBookingStatus = useCallback((id: string, status: BookingStatus) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b));
  }, []);

  const updatePaymentStatus = useCallback((bookingId: string, status: PaymentStatus, note?: string, adjustedBy?: string) => {
    setPayments(prev => prev.map(p => p.bookingId === bookingId ? { ...p, status, note, adjustedBy } : p));
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, paymentStatus: status } : b));
  }, []);

  const adjustPaymentAmount = useCallback((bookingId: string, amount: number, note?: string, adjustedBy?: string) => {
    setPayments(prev => prev.map(p => p.bookingId === bookingId ? { ...p, amount, note, adjustedBy } : p));
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, totalAmount: amount } : b));
  }, []);

  const getRoomById = useCallback((id: string) => rooms.find(r => r.id === id), [rooms]);

  const getBookingsByUser = useCallback((userId: string) => bookings.filter(b => b.userId === userId), [bookings]);

  return (
    <HotelContext.Provider value={{
      rooms, bookings, payments,
      addRoom, updateRoom, deleteRoom, toggleRoomActive,
      createBooking, updateBookingStatus, cancelBooking, isRoomAvailable,
      updatePaymentStatus, adjustPaymentAmount,
      getRoomById, getBookingsByUser,
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
