import { useEffect, useState } from 'react';
import { Server, Database, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

const SystemStatus = () => {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';
      const response = await fetch(`${API_URL}/api/status`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }
      
      const data = await response.json();
      setStatus(data);
      setLastUpdated(new Date());
    } catch (err) {
      setStatus({
        backend: {
          status: 'error',
          message: 'backend is not running on frontend',
          timestamp: new Date().toISOString()
        },
        database: {
          status: 'disconnected',
          message: 'database connection failed',
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const isBackendRunning = status?.backend.status === 'running';
  const isDatabaseRunning = status?.database.status === 'running';

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <Server className="h-5 w-5" />
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Backend Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Backend</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isBackendRunning ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  running
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  stopped
                </span>
              </>
            )}
          </div>
        </div>

        {/* Database Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Database</span>
          </div>
          <div className="flex items-center gap-1.5">
            {isDatabaseRunning ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  running
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                  disconnected
                </span>
              </>
            )}
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2">
          <div className={`p-2.5 rounded-md text-sm ${
            isBackendRunning 
              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status?.backend.message || 'backend is not running on frontend'}
          </div>
          <div className={`p-2.5 rounded-md text-sm ${
            isDatabaseRunning 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status?.database.status === 'running' 
              ? 'database is running with the backend and frontend'
              : 'database connection failed'}
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Last updated: {formatTime(lastUpdated)}
          </p>
        </div>

        {/* Refresh Button */}
        <Button 
          onClick={fetchStatus} 
          disabled={loading}
          className="w-full"
          variant="default"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
