import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// Get all audit logs
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ data });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Create audit log (internal use)
export const createAuditLog = async (
  action: string,
  userId: string,
  userName: string,
  target: string,
  details?: string,
  status: 'success' | 'warning' | 'error' = 'success'
) => {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      action,
      user_id: userId,
      user_name: userName,
      target,
      details,
      status,
    });

    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (error) {
    console.error('Audit log error:', error);
  }
};
