import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { logAuditAction } from './AdminSettings';
import { supabase } from '@/lib/supabase';
import { UserRole, User } from '@/types/hotel';
import {
  Shield, ShieldOff, Plus, Loader2, Pencil, Trash2,
  Search, ArrowRight, X, Users, UserCheck, Crown,
} from 'lucide-react';

// API URL from environment variable
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3007';

// ── Design tokens — balanced warm palette ─────────────────
const GOLD    = '#c4a05a';
const BORDER  = 'rgba(196,160,90,0.15)';
const SURFACE = '#ffffff';
const TEXT    = '#1a1612';
const MUTED   = '#8a7d6e';
const CREAM   = '#faf8f4';
const DARK    = '#2c2418';

// ── Role config ────────────────────────────────────────────
const roleConfig: Record<string, {
  bg: string; color: string; border: string; gradient: string; glow: string; label: string;
}> = {
  admin:  { bg: 'rgba(196,160,90,0.15)', color: '#92660a', border: 'rgba(196,160,90,0.4)',  gradient: 'linear-gradient(135deg,#c4a05a,#d4b06a)', glow: 'rgba(196,160,90,0.25)', label: 'Admin'  },
  staff:  { bg: 'rgba(139,92,246,0.1)',  color: '#5b21b6', border: 'rgba(139,92,246,0.28)', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.2)',  label: 'Staff'  },
  user:   { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.2)',  label: 'Client' },
};

// ── Avatar color cycling ───────────────────────────────────
const AVATAR_COLORS = [
  { bg: 'linear-gradient(135deg,#c4a05a,#d4b06a)', text: '#1a1612' },
  { bg: 'linear-gradient(135deg,#6366f1,#4f46e5)', text: '#fff'    },
  { bg: 'linear-gradient(135deg,#10b981,#059669)', text: '#fff'    },
  { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', text: '#1a1612' },
  { bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', text: '#fff'    },
  { bg: 'linear-gradient(135deg,#ec4899,#db2777)', text: '#fff'    },
];
const getAvatar = (name: string) =>
  AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── Stat card config ───────────────────────────────────────
const statMeta = [
  { key: 'total',   label: 'Total Users',    icon: Users,       gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.2)'   },
  { key: 'active',  label: 'Active',          icon: UserCheck,   gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.2)'   },
  { key: 'admins',  label: 'Admins',          icon: Crown,       gradient: 'linear-gradient(135deg,#c4a05a,#d4b06a)', glow: 'rgba(196,160,90,0.25)'  },
  { key: 'staff',   label: 'Staff',           icon: Shield,      gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.2)'   },
];

// ── Shared dialog input style ──────────────────────────────
const dialogInput: React.CSSProperties = {
  height: 42, borderRadius: 8,
  border: `1px solid ${BORDER}`, background: CREAM,
  fontFamily: 'Georgia, serif', fontSize: 13, color: TEXT,
  padding: '0 12px', outline: 'none', width: '100%',
  transition: 'border-color 0.2s',
};

// ── Dialog label ───────────────────────────────────────────
const DialogLabel = ({ children }: { children: React.ReactNode }) => (
  <label style={{ fontSize: 9, textTransform: 'uppercase' as const, letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif', display: 'block', marginBottom: 5 }}>
    {children}
  </label>
);

// ── Field wrapper ──────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
    <DialogLabel>{label}</DialogLabel>
    {children}
  </div>
);

// ── Auth helper ────────────────────────────────────────────
const getToken = async (): Promise<string | null> => {
  const cachedUser = localStorage.getItem('cached-user');
  if (cachedUser) {
    try {
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ]) as any;
      if (result.data?.session?.access_token) return result.data.session.access_token;
    } catch { /* fall through */ }
  }
  try {
    const result = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
    ]) as any;
    return result.data?.session?.access_token || null;
  } catch { return null; }
};

// ── Component ──────────────────────────────────────────────
const AdminUsers = () => {
  const { bookings, users, refreshUsers } = useHotel();
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  const [search,         setSearch]         = useState('');
  const [filterRole,     setFilterRole]     = useState<'All' | UserRole>('All');
  const [isCreating,     setIsCreating]     = useState(false);

  const [isAddOpen,      setIsAddOpen]      = useState(false);
  const [isEditOpen,     setIsEditOpen]     = useState(false);
  const [isDeleteOpen,   setIsDeleteOpen]   = useState(false);
  const [isDetailsOpen,  setIsDetailsOpen]  = useState(false);

  const [editingUser,    setEditingUser]    = useState<User | null>(null);
  const [deletingUser,   setDeletingUser]   = useState<User | null>(null);
  const [selectedUser,   setSelectedUser]   = useState<User | null>(null);

  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '', role: 'user' as UserRole });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) refreshUsers();
  }, [isAuthLoading, isAuthenticated, refreshUsers]);

  // ── Stats ──────────────────────────────────────────────
  const adminCount  = users.filter(u => u.role === 'admin').length;
  const staffCount  = users.filter(u => u.role === 'staff').length;
  const activeCount = users.filter(u => u.isActive).length;

  const statValues: Record<string, string | number> = {
    total:  users.length,
    active: activeCount,
    admins: adminCount,
    staff:  staffCount,
  };

  // ── Filter ─────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Handlers ──────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error();
      const user = users.find(u => u.id === userId);
      logAuditAction('Changed User Role', user?.name || userId, 'success', `Role changed to ${newRole}`);
      await refreshUsers();
      toast({ title: `Role updated to ${newRole}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (users.find(u => u.email === newUser.email)) {
      toast({ title: 'Error', description: 'Email already exists', variant: 'destructive' });
      return;
    }
    setIsCreating(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.message); }
      await refreshUsers();
      toast({ title: 'User created!', description: `${newUser.name} has been added.` });
      setIsAddOpen(false);
      setNewUser({ name: '', email: '', password: '', phone: '', role: 'user' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create user', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) throw new Error();
      await refreshUsers();
      toast({ title: 'User updated!' });
      setIsEditOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to update user', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getToken()}` },
      });
      if (!response.ok) throw new Error();
      logAuditAction('Deleted User', deletingUser.name || deletingUser.email, 'warning', 'User permanently deleted');
      await refreshUsers();
      toast({ title: 'User deleted' });
      setIsDeleteOpen(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    }
  };

  const toggleUserActive = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify({ is_active: !user.isActive }),
      });
      if (!response.ok) throw new Error();
      logAuditAction(
        user.isActive ? 'Deactivated User' : 'Activated User',
        user.name || user.email, user.isActive ? 'warning' : 'success',
        `User account ${user.isActive ? 'deactivated' : 'activated'}`
      );
      await refreshUsers();
      toast({ title: user.isActive ? 'Account deactivated' : 'Account activated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, phone: user.phone || '' });
    setIsEditOpen(true);
  };

  // ── Shared dialog components ───────────────────────────
  const DialogHeader = ({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose?: () => void }) => (
    <div style={{ background: DARK, padding: '20px 24px', borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, fontWeight: 700 }}>{eyebrow}</span>
          </div>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 300, color: '#f7f3ee', fontStyle: 'italic', margin: 0 }}>{title}</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ background: 'rgba(247,243,238,0.1)', border: '1px solid rgba(247,243,238,0.15)', borderRadius: 7, padding: 6, cursor: 'pointer', color: 'rgba(247,243,238,0.6)', display: 'flex', alignItems: 'center', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(247,243,238,0.1)'; e.currentTarget.style.color = 'rgba(247,243,238,0.6)'; }}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );

  const SaveBtn = ({ label, type = 'button', disabled = false, onClick }: { label: string; type?: 'button' | 'submit'; disabled?: boolean; onClick?: () => void }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '11px', borderRadius: 9,
        background: disabled ? 'rgba(196,160,90,0.4)' : 'linear-gradient(135deg, #c4a05a, #d4b06a)',
        border: 'none', fontSize: 11, fontWeight: 700, color: '#1a1612',
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Georgia, serif',
        boxShadow: disabled ? 'none' : '0 3px 12px rgba(196,160,90,0.32)', transition: 'opacity 0.2s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.9'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
    >
      {disabled && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />}
      {label}
      {!disabled && <ArrowRight size={13} />}
    </button>
  );

  const CancelBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '11px', borderRadius: 9,
        background: CREAM, border: `1px solid ${BORDER}`,
        fontSize: 11, fontWeight: 600, color: MUTED,
        cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
    >
      Cancel
    </button>
  );

  const dialogShell: React.CSSProperties = {
    background: '#fff', borderRadius: 16, border: 'none',
    boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
    maxWidth: 500, padding: 0,
    fontFamily: 'Georgia, serif',
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT }}>

      {/* ── Page Header ── */}
      <div style={{
        background: DARK, borderRadius: 14,
        padding: 'clamp(18px,3vw,28px) clamp(20px,4vw,32px)',
        marginBottom: 22, position: 'relative', overflow: 'hidden',
        boxShadow: '0 5px 24px rgba(0,0,0,0.14)',
      }}>
        <div style={{ position: 'absolute', top: -35, right: -35, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Directory</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem,3vw,1.9rem)', fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1 }}>
              Users &amp; <em style={{ fontStyle: 'italic', color: GOLD }}>Staff</em>
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.45)', marginTop: 4 }}>
              {users.length} registered account{users.length !== 1 ? 's' : ''}
            </p>
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
              padding: '12px 22px', borderRadius: 10,
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
              color: '#1a1612', border: 'none', cursor: 'pointer',
              boxShadow: '0 3px 14px rgba(196,160,90,0.35)', transition: 'all 0.22s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(196,160,90,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(196,160,90,0.35)'; }}
          >
            <Plus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {statMeta.map(meta => (
          <div
            key={meta.key}
            style={{
              background: SURFACE, borderRadius: 12, padding: '15px 16px',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${meta.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: meta.gradient, borderRadius: '12px 12px 0 0' }} />
            <div style={{ width: 30, height: 30, borderRadius: 8, background: meta.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 11, marginTop: 3, boxShadow: `0 2px 8px ${meta.glow}` }}>
              <meta.icon size={14} color="#fff" />
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 300, color: TEXT, lineHeight: 1, marginBottom: 3 }}>
              {statValues[meta.key]}
            </div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, fontWeight: 700 }}>
              {meta.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18,
        alignItems: 'center', padding: '12px 16px',
        background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`,
        boxShadow: '0 1px 6px rgba(26,22,18,0.05)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 160, maxWidth: 320 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
          <input
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              height: 38, paddingLeft: 34, paddingRight: 12,
              border: `1px solid ${BORDER}`, borderRadius: 8,
              background: CREAM, fontSize: 13, color: TEXT,
              fontFamily: 'Georgia, serif', outline: 'none', width: '100%',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        {/* Role filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(['All', 'admin', 'staff', 'user'] as const).map(r => {
            const cfg    = r !== 'All' ? roleConfig[r] : null;
            const active = filterRole === r;
            return (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  padding: '5px 13px', borderRadius: 999,
                  fontSize: 10, fontWeight: 600, fontFamily: 'Georgia, serif',
                  cursor: 'pointer', transition: 'all 0.18s',
                  background: active ? (cfg ? cfg.bg : DARK) : 'transparent',
                  color: active ? (cfg ? cfg.color : '#f7f3ee') : MUTED,
                  border: active ? `1px solid ${cfg ? cfg.border : 'rgba(44,36,24,0.4)'}` : `1px solid ${BORDER}`,
                  boxShadow: active ? '0 2px 6px rgba(26,22,18,0.1)' : 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = cfg?.border || BORDER; e.currentTarget.style.color = cfg?.color || GOLD; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; } }}
              >
                {r === 'All' ? `All (${users.length})` : r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            );
          })}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: MUTED, flexShrink: 0 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Loading ── */}
      {isAuthLoading && (
        <div style={{ padding: '60px 24px', textAlign: 'center', background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}` }}>
          <Loader2 size={22} color={GOLD} style={{ margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: MUTED }}>Checking authentication…</p>
        </div>
      )}

      {/* ── User List ── */}
      {!isAuthLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{ padding: '60px 24px', textAlign: 'center', background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}` }}>
              <div style={{ width: 52, height: 52, borderRadius: 13, background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <Users size={22} color="rgba(196,160,90,0.4)" />
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No users found</p>
              <p style={{ fontSize: 11, color: MUTED }}>Try adjusting your search or filter</p>
            </div>
          )}

          {filtered.map(user => {
            const av    = getAvatar(user.name || 'U');
            const rcfg  = roleConfig[user.role] ?? roleConfig.user;
            const ubs   = bookings.filter(b => b.userId === user.id);

            return (
              <div
                key={user.id}
                style={{
                  background: SURFACE, borderRadius: 12, overflow: 'hidden',
                  border: `1px solid ${BORDER}`,
                  boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                  opacity: user.isActive ? 1 : 0.65,
                  transition: 'all 0.25s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; e.currentTarget.style.boxShadow = '0 5px 18px rgba(26,22,18,0.09)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
              >
                {/* Role accent bar */}
                <div style={{ height: 3, background: rcfg.gradient }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', flexWrap: 'wrap' }}>
                  {/* Avatar */}
                  <div
                    onClick={() => { setSelectedUser(user); setIsDetailsOpen(true); }}
                    style={{
                      width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                      background: av.bg, color: av.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem', fontWeight: 400,
                      cursor: 'pointer', transition: 'opacity 0.2s',
                      boxShadow: `0 2px 8px ${rcfg.glow}`,
                      border: `2px solid rgba(255,255,255,0.6)`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    title="View details"
                  >
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div
                    style={{ flex: '1 1 160px', minWidth: 0, cursor: 'pointer' }}
                    onClick={() => { setSelectedUser(user); setIsDetailsOpen(true); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{user.name}</span>
                      {/* Role pill */}
                      <span style={{
                        fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
                        padding: '2px 8px', borderRadius: 999,
                        background: rcfg.bg, color: rcfg.color, border: `1px solid ${rcfg.border}`,
                      }}>
                        {rcfg.label}
                      </span>
                      {!user.isActive && (
                        <span style={{
                          fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
                          padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(239,68,68,0.08)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.25)',
                        }}>Inactive</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: MUTED, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                      {user.phone && <><span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>{user.phone}</>}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(138,125,110,0.5)' }}>
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      <span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>
                      {ubs.length} booking{ubs.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Role selector */}
                  <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <Select value={user.role} onValueChange={v => handleRoleChange(user.id, v as UserRole)}>
                      <SelectTrigger style={{
                        height: 34, width: 110, borderRadius: 8,
                        border: `1px solid ${BORDER}`, background: CREAM,
                        fontSize: 11, color: TEXT, fontFamily: 'Georgia, serif',
                        padding: '0 10px',
                      }} className="focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                        <SelectItem value="user"  style={{ fontSize: 12, color: TEXT, fontFamily: 'Georgia, serif' }}>Client</SelectItem>
                        <SelectItem value="staff" style={{ fontSize: 12, color: TEXT, fontFamily: 'Georgia, serif' }}>Staff</SelectItem>
                        <SelectItem value="admin" style={{ fontSize: 12, color: TEXT, fontFamily: 'Georgia, serif' }}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                    {/* Activate / Deactivate */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleUserActive(user.id); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 12px', fontSize: 10, fontWeight: 600,
                        fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
                        borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                        border: user.isActive ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(16,185,129,0.25)',
                        background: user.isActive ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.08)',
                        color: user.isActive ? '#dc2626' : '#059669',
                        whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = user.isActive ? 'rgba(239,68,68,0.14)' : 'rgba(16,185,129,0.15)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = user.isActive ? 'rgba(239,68,68,0.07)' : 'rgba(16,185,129,0.08)'; }}
                    >
                      {user.isActive ? <><ShieldOff size={11} /> Deactivate</> : <><Shield size={11} /> Activate</>}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(user); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 12px', fontSize: 10, fontWeight: 600,
                        fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
                        borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                        border: `1px solid ${BORDER}`, background: CREAM, color: MUTED,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(196,160,90,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; e.currentTarget.style.background = CREAM; }}
                    >
                      <Pencil size={11} /> Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingUser(user); setIsDeleteOpen(true); }}
                      style={{
                        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                        border: '1px solid rgba(239,68,68,0.22)',
                        background: 'rgba(239,68,68,0.07)', color: '#dc2626',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.45)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.22)'; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════ DIALOGS ════════════════ */}

      {/* ── Add User Dialog ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent style={dialogShell}>
          <DialogHeader eyebrow="New Account" title="Create a New User" onClose={() => setIsAddOpen(false)} />
          <form
            onSubmit={handleAddUser}
            style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 13, maxHeight: '70vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              <Field label="Full Name *">
                <input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                  placeholder="Alexandra Beaumont" required style={dialogInput}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
              </Field>
              <Field label="Phone">
                <input value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (000) 000-0000" type="tel" style={dialogInput}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
              </Field>
            </div>
            <Field label="Email Address *">
              <input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                placeholder="a.beaumont@email.com" type="email" required style={dialogInput}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </Field>
            <Field label="Password *">
              <input value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                placeholder="Min 8 chars, upper, lower, number" type="password" required style={dialogInput}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </Field>
            <Field label="Role *">
              <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                <SelectTrigger style={{ ...dialogInput, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                  <SelectItem value="user"  style={{ fontSize: 13, color: TEXT, fontFamily: 'Georgia, serif' }}>Client</SelectItem>
                  <SelectItem value="staff" style={{ fontSize: 13, color: TEXT, fontFamily: 'Georgia, serif' }}>Staff</SelectItem>
                  <SelectItem value="admin" style={{ fontSize: 13, color: TEXT, fontFamily: 'Georgia, serif' }}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div style={{ height: 1, background: BORDER }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <CancelBtn onClick={() => setIsAddOpen(false)} />
              <SaveBtn label={isCreating ? 'Creating…' : 'Create User'} type="submit" disabled={isCreating} />
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit User Dialog ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent style={dialogShell}>
          <DialogHeader eyebrow="Edit Account" title={`Editing: ${editingUser?.name || ''}`} onClose={() => setIsEditOpen(false)} />
          <form
            onSubmit={handleEditUser}
            style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 13 }}
          >
            <Field label="Full Name">
              <input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                required style={dialogInput}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </Field>
            <Field label="Email Address">
              <input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                type="email" required style={dialogInput}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </Field>
            <Field label="Phone">
              <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                style={dialogInput}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)} onBlur={e => (e.currentTarget.style.borderColor = BORDER)} />
            </Field>
            <div style={{ height: 1, background: BORDER }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <CancelBtn onClick={() => setIsEditOpen(false)} />
              <SaveBtn label="Save Changes" type="submit" />
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent style={{ ...dialogShell, maxWidth: 420 }}>
          <DialogHeader eyebrow="Danger Zone" title="Delete User Account" onClose={() => setIsDeleteOpen(false)} />
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {deletingUser && (() => {
              const av = getAvatar(deletingUser.name || 'U');
              return (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1rem', flexShrink: 0 }}>
                    {(deletingUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 2 }}>{deletingUser.name}</p>
                    <p style={{ fontSize: 11, color: MUTED }}>{deletingUser.email}</p>
                  </div>
                </div>
              );
            })()}
            <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>
              This action is <span style={{ color: '#dc2626', fontWeight: 700 }}>permanent and irreversible</span>.
              All data associated with this account will be removed.
            </p>
            <div style={{ height: 1, background: BORDER }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <CancelBtn onClick={() => setIsDeleteOpen(false)} />
              <button
                onClick={handleDeleteUser}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px', borderRadius: 9,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)',
                  fontSize: 11, fontWeight: 700, color: '#dc2626',
                  cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.18)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
              >
                <Trash2 size={13} /> Delete Permanently
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── User Details Dialog ── */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent style={{ ...dialogShell, maxWidth: 440 }}>
          <DialogHeader eyebrow="Account Profile" title="User Details" onClose={() => setIsDetailsOpen(false)} />
          {selectedUser && (() => {
            const av   = getAvatar(selectedUser.name || 'U');
            const rcfg = roleConfig[selectedUser.role] ?? roleConfig.user;
            const ubs  = bookings.filter(b => b.userId === selectedUser.id);
            return (
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 10, background: CREAM, border: `1px solid ${BORDER}` }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: av.bg, color: av.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.4rem', flexShrink: 0, boxShadow: `0 2px 10px ${rcfg.glow}` }}>
                    {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: TEXT, marginBottom: 5 }}>{selectedUser.name}</p>
                    <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: rcfg.bg, color: rcfg.color, border: `1px solid ${rcfg.border}` }}>
                      {rcfg.label}
                    </span>
                  </div>
                </div>

                {/* Details table */}
                <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                  {[
                    { label: 'Email',    value: selectedUser.email },
                    { label: 'Phone',    value: selectedUser.phone || '—' },
                    { label: 'Status',   value: selectedUser.isActive ? 'Active' : 'Inactive', highlight: selectedUser.isActive ? '#059669' : '#dc2626' },
                    { label: 'Bookings', value: `${ubs.length} booking${ubs.length !== 1 ? 's' : ''}` },
                    { label: 'Joined',   value: new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: i % 2 === 0 ? SURFACE : CREAM, borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700 }}>{row.label}</span>
                      <span style={{ fontSize: 12, color: row.highlight || TEXT, fontWeight: row.highlight ? 700 : 400 }}>{row.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ height: 1, background: BORDER }} />
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '11px', borderRadius: 9,
                    background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                    border: 'none', fontSize: 11, fontWeight: 700, color: '#1a1612',
                    cursor: 'pointer', fontFamily: 'Georgia, serif',
                    boxShadow: '0 3px 12px rgba(196,160,90,0.32)', transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Close
                </button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminUsers;