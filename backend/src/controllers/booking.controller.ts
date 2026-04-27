import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from './audit.controller';

// Get all bookings (Admin only)
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
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

    const { data, error } = await supabaseAdmin
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
    
    let query = supabaseAdmin
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
    const { data: conflicts, error: conflictError } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('room_id', bookingData.room_id)
      .in('status', ['confirmed', 'checked_in', 'pending'])
      .lt('check_in', bookingData.check_out)
      .gt('check_out', bookingData.check_in);

    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      // Check for actual date/time overlap considering times
      const hasConflict = conflicts.some((b: any) => {
        // Parse dates and times
        const newCheckIn = new Date(`${bookingData.check_in}T${bookingData.check_in_time || '00:00:00'}`);
        const newCheckOut = new Date(`${bookingData.check_out}T${bookingData.check_out_time || '23:59:59'}`);
        const existingCheckIn = new Date(`${b.check_in}T${b.check_in_time || '00:00:00'}`);
        const existingCheckOut = new Date(`${b.check_out}T${b.check_out_time || '23:59:59'}`);
        
        // Actual overlap: new booking starts before existing ends AND new booking ends after existing starts
        const overlap = newCheckIn < existingCheckOut && newCheckOut > existingCheckIn;
        return overlap;
      });
      
      if (hasConflict) {
        return sendError(res, 'Room is not available for selected dates/times. The booking overlaps with an existing reservation.');
      }
    }

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert([bookingData])
      .select(`
        *,
        rooms: room_id (id, name, tier, price_per_night)
      `)
      .single();

    if (error) throw error;

    // Automatically create a payment record for this booking
    console.log('Creating payment for booking:', data.id, 'Amount:', bookingData.total_amount, 'Method:', bookingData.payment_method);
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert([{
        booking_id: data.id,
        amount: bookingData.total_amount,
        method: bookingData.payment_method || 'credit_card',
        status: 'pending',
        note: null,
        adjusted_by: null
      }])
      .select();

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
    } else {
      console.log('Payment created successfully:', paymentData);
    }

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
    
    // Users can only update their own bookings, admins and staff can update any
    const normalizedRole = userRole?.toLowerCase();
    if (normalizedRole !== 'admin' && normalizedRole !== 'staff') {
      const { data: booking, error: fetchError } = await supabaseAdmin
        .from('bookings')
        .select('user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      if (booking.user_id !== userId) {
        return sendError(res, 'Unauthorized to update this booking', 403);
      }
    }

    const { data, error } = await supabaseAdmin
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
    
    // Users can only cancel their own bookings, admins and staff can cancel any
    const normalizedRole = userRole?.toLowerCase();
    if (normalizedRole !== 'admin' && normalizedRole !== 'staff') {
      const { data: booking, error: fetchError } = await supabaseAdmin
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

    const { data, error } = await supabaseAdmin
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

// Hard delete booking (Admin only - completely removes from database)
export const deleteBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'admin') {
      return sendError(res, 'Unauthorized - Admin only', 403);
    }

    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting booking:', error);
      throw error;
    }

    console.log('✅ Booking permanently deleted:', id);
    sendSuccess(res, null, 'Booking permanently deleted');
  } catch (error: any) {
    console.error('💥 Delete booking error:', error);
    sendError(res, error.message || 'Failed to delete booking');
  }
};
