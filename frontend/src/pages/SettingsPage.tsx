import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Bell, Mail, Smartphone, Calendar, CreditCard } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const SettingsPage = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPassword: false, confirm: false });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailBookingConfirm: true,
    emailPaymentReceipt: true,
    emailPromotions: false,
    smsCheckIn: true,
    smsPaymentDue: true,
    pushRoomReady: false,
  });

  // Load notification preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  }, []);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('notification-preferences', JSON.stringify(updated));
  };

  // Wait for auth to finish loading before redirecting
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await updateProfile({ name: profile.name, phone: profile.phone });
    if (result.success) {
      toast({ title: 'Profile updated successfully!' });
    } else {
      toast({ title: 'Failed to update profile', description: result.error, variant: 'destructive' });
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    const result = await changePassword(passwords.current, passwords.newPassword);
    if (result.success) {
      toast({ title: 'Password changed successfully!' });
      setPasswords({ current: '', newPassword: '', confirm: '' });
    } else {
      toast({ title: 'Failed to change password', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in py-8">
      <div className="container mx-auto max-w-2xl px-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">Account Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your profile and preferences</p>

        <Tabs defaultValue="profile" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={profile.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Change Password</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                      <Input type={showPasswords.current ? 'text' : 'password'} value={passwords.current} onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))} required className="pr-10" />
                      <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input type={showPasswords.newPassword ? 'text' : 'password'} value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} required className="pr-10" />
                      <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, newPassword: !prev.newPassword }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPasswords.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <div className="relative">
                      <Input type={showPasswords.confirm ? 'text' : 'password'} value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} required className="pr-10" />
                      <button type="button" onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                        {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit">Update Password</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Booking Confirmations</Label>
                        <p className="text-xs text-muted-foreground">Receive email when booking is confirmed</p>
                      </div>
                      <Switch
                        checked={notifications.emailBookingConfirm}
                        onCheckedChange={() => handleNotificationChange('emailBookingConfirm')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Payment Receipts</Label>
                        <p className="text-xs text-muted-foreground">Receive email for every payment</p>
                      </div>
                      <Switch
                        checked={notifications.emailPaymentReceipt}
                        onCheckedChange={() => handleNotificationChange('emailPaymentReceipt')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Promotions & Offers</Label>
                        <p className="text-xs text-muted-foreground">Get notified about special deals</p>
                      </div>
                      <Switch
                        checked={notifications.emailPromotions}
                        onCheckedChange={() => handleNotificationChange('emailPromotions')}
                      />
                    </div>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                    SMS Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Check-in Reminders</Label>
                        <p className="text-xs text-muted-foreground">SMS reminder 24 hours before check-in</p>
                      </div>
                      <Switch
                        checked={notifications.smsCheckIn}
                        onCheckedChange={() => handleNotificationChange('smsCheckIn')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm">Payment Due Alerts</Label>
                        <p className="text-xs text-muted-foreground">SMS when payment is due</p>
                      </div>
                      <Switch
                        checked={notifications.smsPaymentDue}
                        onCheckedChange={() => handleNotificationChange('smsPaymentDue')}
                      />
                    </div>
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Bell className="h-4 w-4" />
                    Push Notifications
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Room Ready Alerts</Label>
                      <p className="text-xs text-muted-foreground">Get notified when your room is ready</p>
                    </div>
                    <Switch
                      checked={notifications.pushRoomReady}
                      onCheckedChange={() => handleNotificationChange('pushRoomReady')}
                    />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground pt-2">
                  Changes are saved automatically
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
