import { useEffect, useState } from 'react';

interface StatusData {
  backend: {
    status: string;
    message: string;
    timestamp: string;
  };
  database: {
    status: string;
    message: string;
    timestamp: string;
  };
}

interface StatusBarProps {
  compact?: boolean;
}

const StatusBar = ({ compact = false }: StatusBarProps) => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const response = await fetch(`${API_URL}/api/status`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch status');
        }
        
        const data = await response.json();
        setStatus(data);
        setError(null);
      } catch (err) {
        setError('backend is not running');
        setStatus(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compact inline version for LoginPage
  if (compact) {
    if (loading) {
      return <span className="text-xs text-muted-foreground">Checking...</span>;
    }

    return (
      <div className="flex flex-col gap-1 text-xs">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <span 
                className={`w-2 h-2 rounded-full ${
                  status?.backend.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className={status?.backend.status === 'running' ? 'text-green-600' : 'text-red-500'}>
                {status?.backend.message}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span 
                className={`w-2 h-2 rounded-full ${
                  status?.database.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className={status?.database.status === 'running' ? 'text-green-600' : 'text-red-500'}>
                {status?.database.message}
              </span>
            </div>
          </>
        )}
      </div>
    );
  }

  // Full bottom bar version
  if (loading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-sm p-2 z-50">
        <div className="container mx-auto flex justify-center items-center gap-4">
          <span>Checking backend status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white text-sm p-2 z-50">
      <div className="container mx-auto flex justify-center items-center gap-6">
        {error ? (
          <span className="text-red-400">{error}</span>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <span 
                className={`w-2 h-2 rounded-full ${
                  status?.backend.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className={status?.backend.status === 'running' ? 'text-green-400' : 'text-red-400'}>
                {status?.backend.message}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span 
                className={`w-2 h-2 rounded-full ${
                  status?.database.status === 'running' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className={status?.database.status === 'running' ? 'text-green-400' : 'text-red-400'}>
                {status?.database.message}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
