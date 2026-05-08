import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Middleware to verify JWT and attach user to request
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the JWT from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔐 Auth header:', authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('❌ No Bearer token');
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    console.log('🔐 Token:', token.substring(0, 20) + '...');

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get user role from user metadata or database
    const role = user.user_metadata?.role || 'user';

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email || '',
      role: role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Middleware to check if user is admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log('👮 requireAdmin - req.user:', req.user);
  if (!req.user) {
    console.log('❌ requireAdmin - No req.user');
    return res.status(401).json({ error: 'Not authenticated' });
  }
  if (req.user.role?.toLowerCase() !== 'admin') {
    console.log('❌ requireAdmin - Role is', req.user.role, 'not admin');
    return res.status(403).json({ error: 'Admin access required' });
  }
  console.log('✅ requireAdmin - Access granted');
  next();
};

// Middleware to check if user is admin or staff
export const requireAdminOrStaff = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const role = req.user.role?.toLowerCase();
  if (!['admin', 'staff'].includes(role)) {
    return res.status(403).json({ error: 'Admin or Staff access required' });
  }
  next();
};
