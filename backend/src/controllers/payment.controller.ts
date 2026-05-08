import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from './audit.controller';

// Get all payments (Admin only)
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        bookings: booking_id (
          id,
          users: user_id (id, name, email),
          rooms: room_id (id, name, tier)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 'Payments retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch payments');
  }
};

// Get payments for user's bookings
export const getUserPayments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    // First get user's booking IDs
    const { data: userBookings, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('user_id', userId);

    if (bookingError) throw bookingError;

    const bookingIds = userBookings?.map(b => b.id) || [];

    const { data, error } = await supabaseAdmin
      .from('payments')
      .select(`
        *,
        bookings: booking_id (
          id,
          rooms: room_id (id, name, tier)
        )
      `)
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 'User payments retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch user payments');
  }
};

// Get payment by ID
export const getPaymentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    let query = supabaseAdmin
      .from('payments')
      .select(`
        *,
        bookings: booking_id (
          id,
          users: user_id (id, name, email),
          rooms: room_id (id, name, tier)
        )
      `)
      .eq('id', id);

    // Users can only see their own payments, admins can see all
    if (userRole !== 'admin') {
      // First get user's booking IDs
      const { data: userBookings, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('user_id', userId);

      if (bookingError) throw bookingError;

      const bookingIds = userBookings?.map(b => b.id) || [];
      query = query.in('booking_id', bookingIds);
    }

    const { data, error } = await query.single();

    if (error) throw error;

    sendSuccess(res, data, 'Payment retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch payment');
  }
};

// Create new payment
export const createPayment = async (req: Request, res: Response) => {
  try {
    const paymentData = {
      ...req.body,
      status: 'pending'
    };
    
    // Verify booking exists and belongs to user (if not admin)
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    if (userRole !== 'admin') {
      const { data: booking, error: bookingError } = await supabaseAdmin
        .from('bookings')
        .select('user_id, total_amount')
        .eq('id', paymentData.booking_id)
        .single();

      if (bookingError) throw bookingError;
      if (booking.user_id !== userId) {
        return sendError(res, 'Unauthorized to create payment for this booking', 403);
      }
    }

    // Check if payment already exists for this booking (any status)
    const { data: existingPayment, error: existingError } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('booking_id', paymentData.booking_id)
      .maybeSingle();

    if (existingError) throw existingError;

    // If payment already exists, return the existing one instead of creating duplicate
    if (existingPayment) {
      // Update the existing payment with new method if provided
      if (paymentData.method && paymentData.method !== existingPayment.method) {
        const { data: updatedPayment, error: updateError } = await supabaseAdmin
          .from('payments')
          .update({ 
            method: paymentData.method,
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayment.id)
          .select(`
            *,
            bookings: booking_id (id, total_amount)
          `)
          .single();

        if (updateError) throw updateError;
        
        sendSuccess(res, updatedPayment, 'Payment updated successfully', 200);
        return;
      }

      // Return existing payment without modification
      sendSuccess(res, existingPayment, 'Payment already exists', 200);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert([paymentData])
      .select(`
        *,
        bookings: booking_id (id, total_amount)
      `)
      .single();

    if (error) throw error;

    // Update booking payment status to 'paid' when payment is created (database constraint)
    if (data && paymentData.status === 'pending') {
      console.log('Updating booking payment status to paid for booking:', paymentData.booking_id);
      console.log('Payment data received:', paymentData);
      
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          payment_status: 'paid'
        })
        .eq('id', paymentData.booking_id);
      
      if (bookingError) {
        console.error('Error updating booking payment status:', bookingError);
      } else {
        console.log('Booking payment status updated to paid successfully for booking:', paymentData.booking_id);
      }
    }

    sendSuccess(res, data, 'Payment created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create payment');
  }
};

// Update payment status
export const updatePayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const paymentData = req.body;
    
    console.log('Updating payment:', id, 'with data:', paymentData);
    
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update(paymentData)
      .eq('id', id)
      .select(`
        *,
        bookings: booking_id (
          id,
          users: user_id (id, name, email),
          rooms: room_id (id, name, tier)
        )
      `)
      .single();

    if (error) {
      console.error('Supabase error updating payment:', error);
      throw error;
    }

    console.log('Payment updated successfully:', data);

    // If payment is completed or pending, update booking payment status
    if (paymentData.status === 'completed' || paymentData.status === 'paid') {
      console.log('Updating booking payment status for booking:', data.booking_id);
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          payment_status: 'paid',
          status: 'confirmed'
        })
        .eq('id', data.booking_id);
      
      if (bookingError) {
        console.error('Error updating booking:', bookingError);
      }
    } else if (paymentData.status === 'pending') {
      console.log('Updating booking payment status to paid for booking:', data.booking_id);
      const { error: bookingError } = await supabaseAdmin
        .from('bookings')
        .update({ 
          payment_status: 'paid'
        })
        .eq('id', data.booking_id);
      
      if (bookingError) {
        console.error('Error updating booking payment status:', bookingError);
      } else {
        console.log('Booking payment status updated to paid successfully for booking:', data.booking_id);
      }
    }

    sendSuccess(res, data, 'Payment updated successfully');
  } catch (error: any) {
    console.error('Update payment error:', error);
    sendError(res, error.message || 'Failed to update payment', 400);
  }
};

// Process refund
export const processRefund = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;
    const adminId = (req as any).user?.id;
    const adminName = (req as any).user?.email || 'Admin';
    const userId = (req as any).user?.id;
    
    const { data: prevData } = await supabaseAdmin
      .from('payments')
      .select('amount, status')
      .eq('id', id)
      .single();
    
    const { data, error } = await supabaseAdmin
      .from('payments')
      .update({ 
        status: 'refunded',
        note,
        adjusted_by: userId
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Log audit
    await createAuditLog(
      'Processed Refund',
      adminId,
      adminName,
      `Payment #${id.slice(0, 8)}`,
      `Refunded $${prevData?.amount || 0} - ${note || 'No note provided'}`,
      'warning'
    );
    

    // Update booking status to cancelled
    await supabaseAdmin
      .from('bookings')
      .update({ 
        status: 'cancelled',
        payment_status: 'refunded'
      })
      .eq('id', data.booking_id);

    sendSuccess(res, data, 'Refund processed successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to process refund');
  }
};
