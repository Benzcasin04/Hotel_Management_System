import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';
import { createAuditLog } from './audit.controller';

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
    console.log('🔄 Backend: Fetching all users...');
    console.log('🔧 supabaseAdmin URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
    console.log('🔧 Service Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    // First try a simple count query
    const countResult = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
    console.log('🔢 Total count result:', { count: countResult.count, error: countResult.error });
    
    // Use supabaseAdmin to bypass RLS and fetch all users
    const result = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('📥 Supabase select result:', { 
      dataLength: result.data?.length, 
      error: result.error,
      firstUser: result.data?.[0]
    });

    if (result.error) {
      console.error('❌ Error fetching users:', result.error);
      throw result.error;
    }

    console.log(`✅ Fetched ${result.data?.length || 0} users`);
    sendSuccess(res, result.data, 'Users retrieved successfully');
  } catch (error: any) {
    console.error('❌ Failed to fetch users:', error);
    sendError(res, error.message || 'Failed to fetch users');
  }
};

// Create user profile (Admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    
    const { data, error } = await supabaseAdmin
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
    const adminName = (req as any).user?.email || 'Admin';
    
    // Users can only update their own profile, admins and staff can update any
    if (id !== userId && !['admin', 'staff'].includes(userRole)) {
      return sendError(res, 'Unauthorized to update this user', 403);
    }

    const userData = req.body;
    
    // Get previous data for audit comparison
    const { data: prevData } = await supabaseAdmin
      .from('users')
      .select('name, email, role, is_active, phone')
      .eq('id', id)
      .single();
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(userData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Log audit actions
    if (userData.role && userData.role !== prevData?.role) {
      await createAuditLog(
        'Changed User Role',
        userId,
        adminName,
        data?.name || data?.email,
        `Role changed from "${prevData?.role}" to "${userData.role}"`,
        'success'
      );
    }
    
    if (userData.isActive !== undefined && userData.isActive !== prevData?.is_active) {
      await createAuditLog(
        userData.isActive ? 'Activated User' : 'Deactivated User',
        userId,
        adminName,
        data?.name || data?.email,
        `User account ${userData.isActive ? 'activated' : 'deactivated'}`,
        userData.isActive ? 'success' : 'warning'
      );
    }

    sendSuccess(res, data, 'User updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update user');
  }
};

// Delete user (Admin only) - deletes from both users table and Supabase Auth
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting user ${id}...`);
    
    // 1. Delete from users table first (this may have FK constraints)
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (dbError) {
      console.error('❌ Database delete error:', dbError);
      throw dbError;
    }
    console.log('✅ User deleted from database');

    // 2. Delete from Supabase Auth (requires service role key)
    console.log('🗑️ Deleting from Supabase Auth...');
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    
    if (authError) {
      console.error('❌ Auth delete error:', authError);
      // Return partial success - DB deleted but auth failed
      return sendSuccess(res, null, 'User deleted from database, but failed to delete from authentication');
    }
    
    console.log('✅ User deleted from Supabase Auth');
    sendSuccess(res, null, 'User deleted successfully from database and authentication');
  } catch (error: any) {
    console.error('💥 Delete user error:', error);
    sendError(res, error.message || 'Failed to delete user');
  }
};
