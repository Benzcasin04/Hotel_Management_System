import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// Get all rooms
export const getRooms = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('is_active', true)
      .order('tier', { ascending: true })
      .order('floor', { ascending: true });

    if (error) throw error;

    sendSuccess(res, data, 'Rooms retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch rooms');
  }
};

// Get room by ID
export const getRoomById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'Room retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch room');
  }
};

// Create new room (Admin only)
export const createRoom = async (req: Request, res: Response) => {
  try {
    const roomData = req.body;
    
    const { data, error } = await supabase
      .from('rooms')
      .insert([roomData])
      .select()
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'Room created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create room');
  }
};

// Update room (Admin only)
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roomData = req.body;
    
    const { data, error } = await supabase
      .from('rooms')
      .update(roomData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'Room updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update room');
  }
};

// Delete room (Admin only)
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('rooms')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    sendSuccess(res, null, 'Room deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete room');
  }
};
