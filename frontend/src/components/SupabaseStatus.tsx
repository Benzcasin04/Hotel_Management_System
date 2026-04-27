import { useEffect } from 'react';
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus';

export function SupabaseStatus() {
  const { connected, loading, error } = useSupabaseStatus();

  useEffect(() => {
    // Log to terminal via Vite's console proxy
    if (!loading) {
      if (connected) {
        console.log('[Supabase] ✅ Database connected successfully!');
      } else if (error?.includes('503') || error?.includes('temporarily unavailable')) {
        // 503 errors are temporary, show warning instead of error
        console.warn('[Supabase] ⚠️ Service temporarily unavailable, will retry...');
      } else {
        console.error('[Supabase] ❌ Database disconnected:', error);
      }
    }
  }, [connected, loading, error]);

  // No visual UI - only terminal logging
  return null;
}
