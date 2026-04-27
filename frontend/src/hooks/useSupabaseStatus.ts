import { useState, useEffect } from 'react';
import { checkSupabaseConnection } from '@/lib/supabase';

interface SupabaseStatus {
  connected: boolean;
  loading: boolean;
  error?: string;
}

export function useSupabaseStatus() {
  const [status, setStatus] = useState<SupabaseStatus>({ connected: false, loading: true });

  useEffect(() => {
    let mounted = true;

    async function checkConnection() {
      try {
        const result = await checkSupabaseConnection();
        if (mounted) {
          setStatus({ connected: result.connected, loading: false, error: result.error });
          
          // Log to browser console (visible in terminal via vite)
          if (result.connected) {
            console.log('%c✅ Supabase database connected successfully!', 'color: green; font-weight: bold; font-size: 14px;');
          } else if (result.error?.includes('503') || result.error?.includes('temporarily unavailable')) {
            // Don't show scary error for temporary service issues
            console.warn('⚠️ Supabase service temporarily unavailable, will retry...');
          } else {
            console.error('❌ Database disconnected:', result.error);
          }
        }
      } catch (err) {
        if (mounted) {
          setStatus({ connected: false, loading: false, error: 'Failed to check connection' });
          console.error('❌ Database connection failed:', err);
        }
      }
    }

    checkConnection();

    // Re-check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return status;
}
