import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Eye, EyeOff, Bell, Mail, Smartphone, User,
  Lock, Settings, ChevronRight, Check, Shield,
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────
const GOLD     = '#c4a05a';
const BORDER   = 'rgba(196,160,90,0.15)';
const SURFACE  = '#ffffff';
const PAGE_BG  = '#f7f3ee';
const DARK_HDR = '#2c2418';
const TEXT     = '#1a1612';
const MUTED    = '#8a7d6e';
const CREAM    = '#faf8f4';

// ── Shared input style ─────────────────────────────────────
const inputStyle: React.CSSProperties = {
  height: 44, borderRadius: 8,
  border: `1px solid ${BORDER}`, background: CREAM,
  fontFamily: 'Georgia, serif', fontSize: 13, color: TEXT,
  paddingLeft: 14, paddingRight: 14, width: '100%', outline: 'none',
  transition: 'border-color 0.2s',
};

// ── Section label ──────────────────────────────────────────
const SectionLabel = ({ icon: Icon, label }: { icon: any; label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{
      width: 28, height: 28, borderRadius: 7,
      background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(196,160,90,0.3)', flexShrink: 0,
    }}>
      <Icon size={13} color="#1a1612" />
    </div>
    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: GOLD, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, background: BORDER }} />
  </div>
);

// ── Panel wrapper ──────────────────────────────────────────
const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: SURFACE, borderRadius: 12, padding: '24px 26px',
    border: `1px solid ${BORDER}`,
    boxShadow: '0 2px 14px rgba(26,22,18,0.06)',
    ...style,
  }}>
    {children}
  </div>
);

// ── Notification toggle row ────────────────────────────────
const NotifRow = ({
  label, desc, checked, onChange, accent,
}: {
  label: string; desc: string; checked: boolean; onChange: () => void; accent?: string;
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderRadius: 10,
    background: checked ? `rgba(196,160,90,0.05)` : CREAM,
    border: `1px solid ${checked ? 'rgba(196,160,90,0.2)' : BORDER}`,
    transition: 'all 0.2s', gap: 16,
  }}>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 11, color: MUTED }}>{desc}</div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const SettingsPage = () => {
  const { user, updateProfile, changePassword, isLoading } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, newPassword: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const [notifications, setNotifications] = useState({
    emailBookingConfirm: true,
    emailPaymentReceipt: true,
    emailPromotions: false,
    smsCheckIn: true,
    smsPaymentDue: true,
    pushRoomReady: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('notification-preferences');
    if (saved) setNotifications(JSON.parse(saved));
  }, []);

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] };
    setNotifications(updated);
    localStorage.setItem('notification-preferences', JSON.stringify(updated));
    toast({ title: 'Preference saved' });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const result = await updateProfile({ name: profile.name, phone: profile.phone });
    setSaving(false);
    if (result.success) toast({ title: 'Profile updated successfully!' });
    else toast({ title: 'Failed to update profile', description: result.error, variant: 'destructive' });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const result = await changePassword(passwords.current, passwords.newPassword);
    setSaving(false);
    if (result.success) {
      toast({ title: 'Password changed successfully!' });
      setPasswords({ current: '', newPassword: '', confirm: '' });
    } else {
      toast({ title: 'Failed to change password', description: result.error, variant: 'destructive' });
    }
  };

  const tabs = [
    { key: 'profile',     label: 'Profile',     icon: User    },
    { key: 'password',    label: 'Password',    icon: Lock    },
    { key: 'preferences', label: 'Preferences', icon: Bell    },
  ] as const;

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT, background: PAGE_BG, minHeight: '100vh' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>

        {/* ── Page Header ── */}
        <div style={{
          background: DARK_HDR, borderRadius: 14, padding: '24px 28px',
          marginBottom: 28, position: 'relative', overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
        }}>
          {/* Glow blobs */}
          <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -20, left: '35%', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#1a1612',
              boxShadow: '0 3px 12px rgba(196,160,90,0.4)',
              border: '2px solid rgba(196,160,90,0.4)',
            }}>
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Account</span>
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.7rem', fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1 }}>
                Account <em style={{ fontStyle: 'italic', color: GOLD }}>Settings</em>
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.45)', marginTop: 3 }}>
                Manage your profile and preferences
              </p>
            </div>
          </div>
        </div>

        {/* ── Tab Nav ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          marginBottom: 22,
        }}>
          {tabs.map(tab => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px 16px', borderRadius: 10,
                  fontSize: 12, fontWeight: 600, fontFamily: 'Georgia, serif',
                  cursor: 'pointer', transition: 'all 0.22s',
                  background: active ? DARK_HDR : SURFACE,
                  color: active ? '#f7f3ee' : MUTED,
                  border: active ? `1px solid rgba(196,160,90,0.3)` : `1px solid ${BORDER}`,
                  boxShadow: active ? '0 4px 14px rgba(26,22,18,0.18)' : '0 1px 4px rgba(26,22,18,0.04)',
                }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                  background: active ? 'linear-gradient(135deg, #c4a05a, #d4b06a)' : 'rgba(196,160,90,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <tab.icon size={12} color={active ? '#1a1612' : GOLD} />
                </div>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── PROFILE TAB ── */}
        {activeTab === 'profile' && (
          <Panel>
            <SectionLabel icon={User} label="Profile Information" />
            <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                  Full Name
                </Label>
                <input
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  placeholder="Your full name"
                />
              </div>

              {/* Email (disabled) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                  Email Address
                </Label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    style={{ ...inputStyle, background: 'rgba(138,125,110,0.06)', color: MUTED, cursor: 'not-allowed' }}
                  />
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <Shield size={13} color="rgba(138,125,110,0.4)" />
                  </div>
                </div>
                <p style={{ fontSize: 10, color: 'rgba(138,125,110,0.6)', marginTop: 0 }}>Email cannot be changed</p>
              </div>

              {/* Phone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                  Phone Number
                </Label>
                <input
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 4, padding: '12px 24px', borderRadius: 9,
                  background: saving ? 'rgba(196,160,90,0.5)' : 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                  border: 'none', fontSize: 12, fontWeight: 700, color: '#1a1612',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
                  boxShadow: '0 3px 10px rgba(196,160,90,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'opacity 0.2s', alignSelf: 'flex-start',
                }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {saving ? 'Saving…' : <><Check size={13} /> Save Changes</>}
              </button>
            </form>
          </Panel>
        )}

        {/* ── PASSWORD TAB ── */}
        {activeTab === 'password' && (
          <Panel>
            <SectionLabel icon={Lock} label="Change Password" />
            <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { field: 'current',     label: 'Current Password',     placeholder: 'Enter current password'  },
                { field: 'newPassword', label: 'New Password',         placeholder: 'Enter new password'      },
                { field: 'confirm',     label: 'Confirm New Password', placeholder: 'Repeat new password'     },
              ].map(({ field, label, placeholder }) => (
                <div key={field} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <Label style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                    {label}
                  </Label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswords[field as keyof typeof showPasswords] ? 'text' : 'password'}
                      value={passwords[field as keyof typeof passwords]}
                      onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                      placeholder={placeholder}
                      required
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                      onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [field]: !prev[field as keyof typeof prev] }))}
                      style={{
                        position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer', color: MUTED,
                        display: 'flex', alignItems: 'center', transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                      onMouseLeave={e => (e.currentTarget.style.color = MUTED)}
                    >
                      {showPasswords[field as keyof typeof showPasswords] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Password strength hint */}
              <div style={{
                padding: '10px 14px', borderRadius: 8,
                background: 'rgba(196,160,90,0.06)', border: `1px solid ${BORDER}`,
                fontSize: 11, color: MUTED, lineHeight: 1.6,
              }}>
                💡 Use at least 8 characters with a mix of uppercase, lowercase, numbers, and symbols.
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  marginTop: 4, padding: '12px 24px', borderRadius: 9,
                  background: saving ? 'rgba(196,160,90,0.5)' : 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                  border: 'none', fontSize: 12, fontWeight: 700, color: '#1a1612',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
                  boxShadow: '0 3px 10px rgba(196,160,90,0.3)',
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  transition: 'opacity 0.2s', alignSelf: 'flex-start',
                }}
                onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                {saving ? 'Updating…' : <><Lock size={13} /> Update Password</>}
              </button>
            </form>
          </Panel>
        )}

        {/* ── PREFERENCES TAB ── */}
        {activeTab === 'preferences' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Email Notifications */}
            <Panel>
              <SectionLabel icon={Mail} label="Email Notifications" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <NotifRow
                  label="Booking Confirmations"
                  desc="Receive email when booking is confirmed"
                  checked={notifications.emailBookingConfirm}
                  onChange={() => handleNotificationChange('emailBookingConfirm')}
                />
                <NotifRow
                  label="Payment Receipts"
                  desc="Receive email for every payment"
                  checked={notifications.emailPaymentReceipt}
                  onChange={() => handleNotificationChange('emailPaymentReceipt')}
                />
                <NotifRow
                  label="Promotions & Offers"
                  desc="Get notified about special deals and exclusive offers"
                  checked={notifications.emailPromotions}
                  onChange={() => handleNotificationChange('emailPromotions')}
                />
              </div>
            </Panel>

            {/* SMS Notifications */}
            <Panel>
              <SectionLabel icon={Smartphone} label="SMS Notifications" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <NotifRow
                  label="Check-in Reminders"
                  desc="SMS reminder 24 hours before check-in"
                  checked={notifications.smsCheckIn}
                  onChange={() => handleNotificationChange('smsCheckIn')}
                />
                <NotifRow
                  label="Payment Due Alerts"
                  desc="SMS when payment is due or overdue"
                  checked={notifications.smsPaymentDue}
                  onChange={() => handleNotificationChange('smsPaymentDue')}
                />
              </div>
            </Panel>

            {/* Push Notifications */}
            <Panel>
              <SectionLabel icon={Bell} label="Push Notifications" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <NotifRow
                  label="Room Ready Alerts"
                  desc="Get notified when your room is ready for check-in"
                  checked={notifications.pushRoomReady}
                  onChange={() => handleNotificationChange('pushRoomReady')}
                />
              </div>

              {/* Auto-save note */}
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 11, color: '#065f46',
              }}>
                <Check size={12} color="#10b981" />
                Changes are saved automatically
              </div>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;