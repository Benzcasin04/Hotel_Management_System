import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// Get all bookings (Admin only)
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users: user_id (id, name, email),
        rooms: room_id (id, name, tier, price_per_night)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 'Bookings retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch bookings');
  }
};

// Get current user's bookings
export const getUserBookings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        rooms: room_id (id, name, tier, price_per_night, images)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 'User bookings retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch user bookings');
  }
};

// Get booking by ID
export const getBookingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    let query = supabase
      .from('bookings')
      .select(`
        *,
        users: user_id (id, name, email),
        rooms: room_id (id, name, tier, price_per_night, images)
      `)
      .eq('id', id);

    // Users can only see their own bookings, admins can see all
    if (userRole !== 'admin') {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.single();

    if (error) throw error;

    sendSuccess(res, data, 'Booking retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch booking');
  }
};

// Create new booking
export const createBooking = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const bookingData = {
      ...req.body,
      user_id: userId,
      status: 'pending',
      payment_status: 'unpaid'
    };
    
    // Check if room is available for the dates
    const { data: conflicts, error: conflictError } = await supabase
      .from('bookings')
      .select('*')
      .eq('room_id', bookingData.room_id)
      .in('status', ['confirmed', 'checked_in'])
      .or(`check_in.lte.${bookingData.check_out},check_out.gte.${bookingData.check_in}`);

    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      return sendError(res, 'Room is not available for selected dates');
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select(`
        *,
        rooms: room_id (id, name, tier, price_per_night)
      `)
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'Booking created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create booking');
  }
};

// Update booking
export const updateBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    const bookingData = req.body;
    
    // Users can only update their own bookings, admins can update any
    if (userRole !== 'admin') {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (booking.user_id !== userId) {
        return sendError(res, 'Unauthorized to update this booking', 403);
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(bookingData)
      .eq('id', id)
      .select(`
        *,
        rooms: room_id (id, name, tier, price_per_night)
      `)
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'Booking updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update booking');
  }
};

// Cancel booking
export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    // Users can only cancel their own bookings, admins can cancel any
    if (userRole !== 'admin') {
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('user_id, status')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (booking.user_id !== userId) {
        return sendError(res, 'Unauthorized to cancel this booking', 403);
      }
      if (booking.status === 'checked_in') {
        return sendError(res, 'Cannot cancel checked-in booking');
      }
    }

    const { data, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'Booking cancelled successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to cancel booking');
  }
};
