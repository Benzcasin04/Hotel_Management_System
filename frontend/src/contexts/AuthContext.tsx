import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/hotel';
import { mockUsers } from '@/data/mockData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => { success: boolean; error?: string };
  signup: (data: { name: string; email: string; phone: string; password: string }) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(mockUsers);

  const login = useCallback((email: string, _password: string) => {
    const found = users.find(u => u.email === email);
    if (!found) {
      return { success: false, error: 'Invalid email or password' };
    }
    setUser(found);
    return { success: true };
  }, [users]);

  const signup = useCallback((data: { name: string; email: string; phone: string; password: string }) => {
    if (users.find(u => u.email === data.email)) {
      return { success: false, error: 'Email already registered' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: 'user' as UserRole,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    setUser(newUser);
    return { success: true };
  }, [users]);

  const logout = useCallback(() => setUser(null), []);

  const updateProfile = useCallback((updates: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updates } : null);
    setUsers(prev => prev.map(u => u.id === user?.id ? { ...u, ...updates } : u));
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
