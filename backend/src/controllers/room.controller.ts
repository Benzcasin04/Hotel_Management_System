import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { randomUUID } from 'crypto';
import { createAuditLog } from './audit.controller';

// Get all rooms (Admin - gets all, including inactive)
export const getRooms = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .select('*')
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
    
    const { data, error } = await supabaseAdmin
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
    console.log('🏨 Creating room:', roomData);
    
    // Ensure required fields have defaults
    const insertData = {
      id: randomUUID(),
      name: roomData.name,
      tier: roomData.tier,
      floor: roomData.floor || 1,
      capacity: roomData.capacity || 2,
      price_per_night: roomData.price_per_night || 0,
      description: roomData.description || '',
      amenities: roomData.amenities || [],
      images: roomData.images || [],
      is_active: roomData.is_active !== undefined ? roomData.is_active : true,
      condition: roomData.condition || 'clean',
      created_at: new Date().toISOString(),
    };
    
    console.log('📦 Insert data:', insertData);
    
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error:', error);
      return sendError(res, `Database error: ${error.message} (${error.code})`, 400);
    }

    console.log('✅ Room created:', data);
    sendSuccess(res, data, 'Room created successfully', 201);
  } catch (error: any) {
    console.error('💥 Create room error:', error);
    sendError(res, error.message || 'Failed to create room', 500);
  }
};

// Update room (Admin only)
export const updateRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const roomData = req.body;
    const adminId = (req as any).user?.id;
    const adminName = (req as any).user?.email || 'Admin';
    
    // Get previous room data for comparison
    const { data: prevData } = await supabaseAdmin
      .from('rooms')
      .select('name, is_active, condition')
      .eq('id', id)
      .single();
    
    const { data, error } = await supabaseAdmin
      .from('rooms')
      .update(roomData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit for condition changes
    if (roomData.condition && roomData.condition !== prevData?.condition) {
      await createAuditLog(
        'Updated Room Condition',
        adminId,
        adminName,
        data?.name || id,
        `Room condition changed to ${roomData.condition}`,
        'success'
      );
    }

    sendSuccess(res, data, 'Room updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update room');
  }
};

// Delete room (Admin only)
export const deleteRoom = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabaseAdmin
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting room:', error);
      throw error;
    }

    console.log('✅ Room deleted:', id);
    sendSuccess(res, null, 'Room deleted successfully');
  } catch (error: any) {
    console.error('💥 Delete room error:', error);
    sendError(res, error.message || 'Failed to delete room');
  }
};
