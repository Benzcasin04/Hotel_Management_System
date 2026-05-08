import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Notification } from '@/types/hotel';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  createNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Helper to check if user is admin or staff
  const isAdminOrStaff = useCallback(() => {
    return (user?.role as string) === 'admin' || (user?.role as string) === 'staff';
  }, [user]);

  // Helper to check if user is admin only
  const isAdmin = useCallback(() => {
    return (user?.role as string) === 'admin';
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase.from('notifications').select('*');
      
      // Admin/Staff see notifications for them + admin-wide notifications (null user_id)
      // Regular users only see notifications specifically for them
      if (isAdminOrStaff()) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Map snake_case to camelCase for frontend
      let mappedNotifications = (data || []).map((n: any) => ({
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.type,
        relatedId: n.related_id,
        read: n.read,
        createdAt: n.created_at,
        hiddenFor: n.hidden_for || [],
      }));

      // Filter out notifications hidden for current user
      mappedNotifications = mappedNotifications.filter(n => !n.hiddenFor?.includes(user.id));

      // Filter out admin-only notifications for staff users
      // Staff should not see notifications with relatedId starting with 'ADMIN_ONLY:'
      if (!isAdmin()) {
        mappedNotifications = mappedNotifications.filter(n => !n.relatedId?.startsWith('ADMIN_ONLY:'));
      }

      setNotifications(mappedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user, isAdminOrStaff]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    try {
      let query = supabase.from('notifications').update({ read: true }).eq('read', false);
      
      // Admin/Staff mark their own + admin-wide notifications as read
      // Regular users only mark their own
      if (isAdminOrStaff()) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.eq('user_id', user.id);
      }
      
      const { error } = await query;

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user, isAdminOrStaff]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!user) return;
    
    try {
      console.log('Soft-deleting notification for user:', notificationId, user.id);
      
      // Get current hidden_for array
      const { data: currentData, error: fetchError } = await supabase
        .from('notifications')
        .select('hidden_for')
        .eq('id', notificationId)
        .single();
      
      if (fetchError) {
        console.error('Error fetching notification:', fetchError);
        return;
      }
      
      // Append current user ID to hidden_for array
      const currentHidden = currentData?.hidden_for || [];
      const newHidden = [...new Set([...currentHidden, user.id])];
      
      const { error } = await supabase
        .from('notifications')
        .update({ hidden_for: newHidden })
        .eq('id', notificationId);

      if (error) {
        console.error('Supabase error hiding notification:', error);
        alert('Failed to delete notification: ' + error.message);
        return;
      }

      console.log('Successfully hidden notification for user:', user.id);
      // Remove from local state (only for current user)
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      alert('Error deleting notification: ' + error.message);
    }
  }, [user]);

  const deleteAllNotifications = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Soft-deleting all notifications for user:', user.id);
      
      // Get all notifications visible to this user
      let query = supabase.from('notifications').select('id, hidden_for');
      
      if (isAdminOrStaff()) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      } else {
        query = query.eq('user_id', user.id);
      }
      
      const { data: notifications, error: fetchError } = await query;
      
      if (fetchError) {
        console.error('Error fetching notifications:', fetchError);
        alert('Failed to delete all notifications: ' + fetchError.message);
        return;
      }

      // Update each notification to add user to hidden_for
      for (const n of notifications || []) {
        const currentHidden = n.hidden_for || [];
        const newHidden = [...new Set([...currentHidden, user.id])];
        
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ hidden_for: newHidden })
          .eq('id', n.id);
        
        if (updateError) {
          console.error('Error hiding notification:', n.id, updateError);
        }
      }

      console.log('Successfully hidden all notifications for user:', user.id);
      setNotifications([]);
    } catch (error: any) {
      console.error('Error deleting all notifications:', error);
      alert('Error deleting all notifications: ' + error.message);
    }
  }, [user, isAdminOrStaff]);

  const createNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          related_id: notification.relatedId,
          read: notification.read,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating notification:', error);
        return;
      }

      // Refresh notifications if the current user should see this notification
      if (!notification.userId || notification.userId === user?.id) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [user, fetchNotifications]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) return;

    // Initial fetch
    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const raw = payload.new as any;
          // Map snake_case to camelCase
          const newNotification: Notification = {
            id: raw.id,
            userId: raw.user_id,
            title: raw.title,
            message: raw.message,
            type: raw.type,
            relatedId: raw.related_id,
            read: raw.read,
            createdAt: raw.created_at,
            hiddenFor: raw.hidden_for || [],
          };
          
          // Skip if hidden for current user
          if (newNotification.hiddenFor?.includes(user.id)) {
            return;
          }
          
          // Check if this notification should be shown to current user
          const isForThisUser = newNotification.userId === user.id;
          const isAdminWide = newNotification.userId === null;
          const userIsAdminOrStaff = isAdminOrStaff();
          
          // Show if:
          // 1. It's specifically for this user, OR
          // 2. It's an admin-wide notification AND user is admin/staff
          if (isForThisUser || (isAdminWide && userIsAdminOrStaff)) {
            setNotifications(prev => [newNotification, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications,
        fetchNotifications,
        createNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
