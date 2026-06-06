import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User, UserRole } from '@/types/hotel';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  signup: (data: { name: string; email: string; phone: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const cachedUser = localStorage.getItem('cached-user');
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          setIsLoading(false);
        }
        try {
          const { data: { session } } = await Promise.race([
            supabase.auth.getSession(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Session check timeout')), 5000))
          ]) as any;
          if (session?.user) {
            const cached = cachedUser ? JSON.parse(cachedUser) : null;
            if (!cached || cached.id !== session.user.id) {
              fetchUserProfile(session.user.id).catch(() => {});
            }
          } else if (!cachedUser) {
            setUser(null);
          }
        } catch {
          if (!cachedUser) setUser(null);
        }
      } catch {
        // Silent fail
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserProfile(session.user.id).catch(() => {});
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, retries = 1): Promise<User | null> => {
    for (let i = 0; i < retries; i++) {
      try {
        // Check if we have a session first
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('No active session for profile fetch');
          return null;
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          console.error('Profile fetch error:', error.message, error.code);
          if (error.message?.includes('503') || error.code === 'PGRST002') {
            await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            continue;
          }
          if (error.code === '406') {
            console.error('406 Not Acceptable - check RLS policies or headers');
          }
          return null;
        }
        if (data) {
          const userData: User = { id: data.id, email: data.email, name: data.name, phone: data.phone, role: data.role as UserRole, isActive: data.is_active, createdAt: data.created_at };
          setUser(userData);
          localStorage.setItem('cached-user', JSON.stringify(userData));
          return userData;
        }
      } catch (err) {
        console.error('Profile fetch exception:', err);
      }
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
    return null;
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const authStatePromise = new Promise((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            subscription.unsubscribe();
            resolve({ user: session.user });
          }
        });
        setTimeout(() => subscription.unsubscribe(), 60000);
      });
      const loginPromise = supabase.auth.signInWithPassword({ email, password });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Login timeout')), 60000));
      const result = await Promise.race([authStatePromise, loginPromise, timeoutPromise]) as any;
      if (result?.error) return { success: false, error: result.error.message };
      const user = result?.user || result?.data?.user;
      if (user) {
        // Wait for profile fetch to get the correct role and active status
        const userData = await fetchUserProfile(user.id);
        
        // Check if account is deactivated
        if (userData?.isActive === false) {
          await supabase.auth.signOut(); // Sign out immediately
          return { success: false, error: 'Your account has been deactivated. Please contact an administrator.' };
        }
        
        const role = userData?.role || 'user';
        toast({ title: 'Welcome back!', description: `Logged in as ${user.email}` });
        return { success: true, role };
      }
      return { success: false, error: 'No user data returned' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed' };
    }
  }, [toast]);

  const signup = useCallback(async (data: { name: string; email: string; phone: string; password: string }) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name, phone: data.phone } }
    });
    if (authError) {
      const errorMsg = authError.message.toLowerCase();
      if (errorMsg.includes('invalid') && errorMsg.includes('email')) {
        return { success: false, error: `Email "${data.email}" is blocked. Use a real email format.` };
      }
      return { success: false, error: authError.message };
    }
    if (!authData.user) return { success: false, error: 'Failed to create user account' };
    await new Promise(r => setTimeout(r, 2000));
    const profileFetched = await fetchUserProfile(authData.user.id);
    if (profileFetched) {
      toast({ title: 'Account created!', description: 'Welcome to LuxeStay' });
    } else {
      toast({ title: 'Account created!', description: 'Refresh the page if you don\'t see your profile.' });
    }
    return { success: true };
  }, [toast]);

  const logout = useCallback(async () => {
    try {
      await Promise.race([supabase.auth.signOut(), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))]);
    } catch {
      // Silent fail
    }
    localStorage.removeItem('cached-user');
    setUser(null);
    toast({ title: 'Logged out successfully' });
  }, [toast]);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not logged in' };
    
    console.log('Updating profile for user:', user.id, 'with data:', updates);
    
    try {
      // Get auth token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        return { success: false, error: 'No active session' };
      }
      
      // Call backend API instead of Supabase directly
      const response = await fetch(`${API_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: updates.name,
          phone: updates.phone,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to update profile' };
      }
      
      const result = await response.json();
      console.log('Profile updated successfully:', result.data);
      
      // Update local state with returned data
      setUser(prev => prev ? {
        ...prev,
        name: result.data.name || prev.name,
        phone: result.data.phone || prev.phone,
        updatedAt: result.data.updated_at,
      } : null);
      
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: error.message };
    }
  }, [user]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    // First verify current password by attempting to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    });
    
    if (signInError || !signInData.user) {
      return { success: false, error: 'Current password is incorrect' };
    }
    
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (updateError) {
      return { success: false, error: updateError.message };
    }
    
    return { success: true };
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => { if (isLoading) setIsLoading(false); }, 3000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
