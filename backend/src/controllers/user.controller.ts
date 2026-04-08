import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// Get current user profile
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return sendError(res, 'User not authenticated', 401);
    }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'User profile retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch user profile');
  }
};

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    sendSuccess(res, data, 'Users retrieved successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to fetch users');
  }
};

// Create user profile (Admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'User created successfully', 201);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to create user');
  }
};

// Update user profile
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;
    
    // Users can only update their own profile, admins can update any
    if (id !== userId && userRole !== 'admin') {
      return sendError(res, 'Unauthorized to update this user', 403);
    }

    const userData = req.body;
    
    const { data, error } = await supabase
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    sendSuccess(res, data, 'User updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update user');
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;

    sendSuccess(res, null, 'User deleted successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to delete user');
  }
};
