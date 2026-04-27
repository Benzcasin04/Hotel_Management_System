import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus';
import { Building2, Database, Shield, Server, CheckCircle2, XCircle, Clock, User, Edit3, Save } from 'lucide-react';

interface AuditEntry {
  id: string;
  action: string;
  user_name: string;
  target: string;
  created_at: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

const STORAGE_KEY = 'hotel-settings';
const SYSTEM_STATUS_KEY = 'system-status';
const AUDIT_LOG_KEY = 'audit-logs';

const defaultHotelInfo = {
  name: 'LuxeStay',
  address: '123 Luxury Ave, Makati City, Manila',
  phone: '+63 2 8888 0000',
  email: 'info@luxestay.com',
  checkInTime: '2:00 PM',
  checkOutTime: '12:00 PM',
};

// Helper to log actions to localStorage
export const logAuditAction = (action: string, target: string, status: 'success' | 'warning' | 'error' = 'success', details?: string) => {
  const userStr = localStorage.getItem('cached-user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  const entry: AuditEntry = {
    id: Date.now().toString(),
    action,
    user_name: user?.name || user?.email || 'Unknown',
    target,
    created_at: new Date().toISOString(),
    status,
    details,
  };
  
  const existing = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
  const updated = [entry, ...existing].slice(0, 100); // Keep last 100 entries
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(updated));
  
  return entry;
};

const AdminSettings = () => {
  const { toast } = useToast();
  const { connected: isSupabaseConnected, loading: isStatusLoading } = useSupabaseStatus();
  const [isEditingHotel, setIsEditingHotel] = useState(false);
  const [isEditingSystem, setIsEditingSystem] = useState(false);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [isPaymentGatewayConnected, setIsPaymentGatewayConnected] = useState(() => {
    const saved = localStorage.getItem(SYSTEM_STATUS_KEY);
    return saved ? JSON.parse(saved).paymentGatewayConnected : false;
  });
  
  // Load from localStorage on mount, fallback to defaults
  const [hotelInfo, setHotelInfo] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultHotelInfo;
  });

  // Load audit logs from localStorage
  const fetchAuditLogs = () => {
    setIsLoadingAudit(true);
    try {
      const saved = localStorage.getItem(AUDIT_LOG_KEY);
      if (saved) {
        setAuditTrail(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchAuditLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveHotelInfo = () => {
    // Save to localStorage for persistence
    localStorage.setItem(STORAGE_KEY, JSON.stringify(hotelInfo));
    setIsEditingHotel(false);
    toast({
      title: 'Hotel Information Updated',
      description: 'Your changes have been saved successfully.',
    });
    // TODO: Connect to backend API to persist changes
  };

  const StatusIndicator = ({ isConnected, label }: { isConnected: boolean; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-1 text-sm">
        {isConnected ? (
          <>
            <CheckCircle2 size={14} className="text-green-500" />
            <span className="text-green-600">Connected</span>
          </>
        ) : (
          <>
            <XCircle size={14} className="text-red-500" />
            <span className="text-red-600">Disconnected</span>
          </>
        )}
      </div>
    </div>
  );

  const getStatusIcon = (status: AuditEntry['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 size={14} className="text-green-500" />;
      case 'warning':
        return <Clock size={14} className="text-amber-500" />;
      case 'error':
        return <XCircle size={14} className="text-red-500" />;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-foreground">Admin Settings</h1>
        <p className="text-sm text-muted-foreground">Manage hotel configuration and system settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Hotel Information - Editable */}
        <Card className="md:col-span-2 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-accent" />
              <CardTitle className="font-heading text-lg">Hotel Information</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => isEditingHotel ? handleSaveHotelInfo() : setIsEditingHotel(true)}
              className="h-8 gap-1"
            >
              {isEditingHotel ? (
                <><Save size={14} /> Save</>
              ) : (
                <><Edit3 size={14} /> Edit</>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {isEditingHotel ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotel-name">Hotel Name</Label>
                  <Input
                    id="hotel-name"
                    value={hotelInfo.name}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-email">Email</Label>
                  <Input
                    id="hotel-email"
                    type="email"
                    value={hotelInfo.email}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="hotel-address">Address</Label>
                  <Input
                    id="hotel-address"
                    value={hotelInfo.address}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hotel-phone">Phone</Label>
                  <Input
                    id="hotel-phone"
                    value={hotelInfo.phone}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="check-in">Check-in Time</Label>
                  <Input
                    id="check-in"
                    value={hotelInfo.checkInTime}
                    onChange={(e) => setHotelInfo({ ...hotelInfo, checkInTime: e.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hotel Name</p>
                  <p className="text-sm font-medium text-foreground mt-1">{hotelInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email</p>
                  <p className="text-sm font-medium text-foreground mt-1">{hotelInfo.email}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Address</p>
                  <p className="text-sm text-foreground mt-1">{hotelInfo.address}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Phone</p>
                  <p className="text-sm text-foreground mt-1">{hotelInfo.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Check-in / Check-out</p>
                  <p className="text-sm text-foreground mt-1">{hotelInfo.checkInTime} / {hotelInfo.checkOutTime}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2 text-base">
              <Server className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusIndicator isConnected={isSupabaseConnected} label="Database" />
            <StatusIndicator isConnected={true} label="Authentication" />
            <StatusIndicator isConnected={true} label="API Server" />
            <StatusIndicator isConnected={true} label="Payment Gateway" />
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <CardTitle className="font-heading text-lg">Audit Trail</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Action</th>
                    <th className="py-3 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">User</th>
                    <th className="py-3 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Target</th>
                    <th className="py-3 pr-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Timestamp</th>
                    <th className="py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoadingAudit ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        Loading audit logs...
                      </td>
                    </tr>
                  ) : auditTrail.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                        No audit logs available. Actions will be logged here automatically.
                      </td>
                    </tr>
                  ) : (
                    auditTrail.map((entry) => (
                      <tr key={entry.id} className="hover:bg-muted/50">
                        <td className="py-3 pr-4 text-sm font-medium text-foreground">{entry.action}</td>
                        <td className="py-3 pr-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-muted-foreground" />
                            {entry.user_name}
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">{entry.target}</td>
                        <td className="py-3 pr-4 text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(entry.status)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
