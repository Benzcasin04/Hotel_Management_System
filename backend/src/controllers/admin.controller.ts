import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { sendSuccess, sendError } from '../utils/response';

// Create user via Admin API (bypasses signup restrictions)
// Flow: Create Auth User -> Trigger creates public.users -> Update role
export const createUserAsAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, role } = req.body;
    
    console.log('📥 Creating user:', { email, name, role, phone });

    // Validate required fields (phone is optional)
    if (!email || !password || !name || !role) {
      console.log('❌ Missing required fields:', { email: !!email, password: !!password, name: !!name, role: !!role });
      return sendError(res, 'Missing required fields: email, password, name, role', 400);
    }

    // Validate role
    if (!['admin', 'staff', 'user'].includes(role)) {
      console.log('❌ Invalid role:', role);
      return sendError(res, 'Invalid role. Must be: admin, staff, or user', 400);
    }

    // Step 1: Create user in Supabase Auth using Admin API
    let userId: string;
    let authData: any;
    
    try {
      const result = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name,
          phone,
          role: role === 'user' ? 'client' : role,
        },
      });
      authData = result.data;
      
      if (result.error) {
        // Check if error is because user already exists
        if (result.error.message?.includes('already been registered') || result.error.code === 'email_exists') {
          console.log('⚠️ User already exists in Auth, fetching existing user...');
          
          // List users to find the existing one
          const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
          
          if (listError) {
            return sendError(res, `Failed to fetch existing user: ${listError.message}`, 400);
          }
          
          const existingUser = listData.users.find(u => u.email === email);
          
          if (!existingUser) {
            return sendError(res, 'User exists but could not be found', 400);
          }
          
          userId = existingUser.id;
          console.log('✅ Found existing user:', userId);
        } else {
          console.log('❌ Supabase Auth error:', result.error);
          return sendError(res, `Auth creation failed: ${result.error.message}`, 400);
        }
      } else if (!result.data?.user) {
        return sendError(res, 'Failed to create auth user', 500);
      } else {
        userId = result.data.user.id;
        console.log('✅ Created new auth user:', userId);
      }
    } catch (error: any) {
      console.log('❌ Exception creating user:', error);
      return sendError(res, `Auth creation failed: ${error.message}`, 400);
    }

    // Step 2: Wait for trigger to run (but we won't rely on it)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Step 3: Ensure user exists in public.users (using upsert)
    console.log('📝 Upserting user to public.users:', userId);
    
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: userId,
        email,
        name,
        phone: phone || '',
        role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Failed to upsert user:', userError);
      // Don't fail - auth user was created
    } else {
      console.log('✅ User saved to public.users:', userData?.id);
    }

    sendSuccess(res, {
      id: userId,
      email,
      name,
      phone,
      role,
    }, 'User created successfully', 201);

  } catch (error: any) {
    console.error('Create user error:', error);
    sendError(res, error.message || 'Failed to create user');
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;

    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (error) {
      return sendError(res, `Password reset failed: ${error.message}`, 400);
    }

    sendSuccess(res, null, 'Password reset successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to reset password');
  }
};

// Suspend/Unsuspend user (set is_active)
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const action = is_active ? 'activated' : 'suspended';
    sendSuccess(res, data, `User ${action} successfully`);
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update user status');
  }
};
