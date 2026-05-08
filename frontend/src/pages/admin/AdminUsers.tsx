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
  Search, ArrowRight, X, Users, UserCheck, UserX, Crown,
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────
const GOLD        = '#c4a05a';
const GOLD_LIGHT  = '#d4b06a';
const GOLD_PALE   = 'rgba(196,160,90,0.10)';
const GOLD_BORDER = 'rgba(196,160,90,0.22)';

const PAGE_BG      = '#f0ebe0';
const PANEL_BG     = '#faf7f1';
const DARK_BG      = '#1e1b14';
const DARK_MID     = '#272319';

const TEXT_DARK    = '#1e1b14';
const TEXT_WARM    = '#3d3526';
const TEXT_MUTED   = 'rgba(61,53,38,0.48)';
const TEXT_LIGHT   = '#f0ead6';
const TEXT_LIGHT_MUTED = 'rgba(184,173,150,0.55)';

const BORDER_LIGHT = 'rgba(61,53,38,0.10)';
const BORDER_DARK  = 'rgba(240,234,214,0.08)';
const DIVIDER      = 'rgba(196,160,90,0.15)';

// Role palette — keys match lowercase backend values
const ROLE_STYLES: Record<string, { color: string; bg: string; border: string; label: string }> = {
  admin:  { color: '#0c0b09', bg: GOLD,                    border: GOLD,                    label: 'Admin'  },
  staff:  { color: '#b8892a', bg: 'rgba(196,145,58,0.10)', border: 'rgba(196,145,58,0.35)', label: 'Staff'  },
  user:   { color: TEXT_MUTED, bg: 'rgba(61,53,38,0.06)',  border: 'rgba(61,53,38,0.18)',   label: 'Client' },
};

// Avatar palette — warm tones cycling
const AVATAR_COLORS = [
  { bg: '#c4a05a', text: '#0c0b09' },
  { bg: '#4a7c6a', text: '#f0ead6' },
  { bg: '#7a5c3a', text: '#f0ead6' },
  { bg: '#5a6a8a', text: '#f0ead6' },
  { bg: '#8a5a5a', text: '#f0ead6' },
];

const getAvatar = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// Shared input style (dark – dialog)
const sharedInput: React.CSSProperties = {
  backgroundColor: 'transparent',
  border: `0.5px solid rgba(240,234,214,0.13)`,
  borderRadius: 0,
  color: TEXT_LIGHT,
  fontSize: 13,
  height: 42,
  outline: 'none',
  fontFamily: 'inherit',
};

const labelDark: React.CSSProperties = {
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.22em',
  color: TEXT_LIGHT_MUTED,
  display: 'block',
  marginBottom: 6,
};

// ── Helper: auth token ─────────────────────────────────────────
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

// ── Component ──────────────────────────────────────────────────
const AdminUsers = () => {
  const { bookings, users, refreshUsers } = useHotel();
  const { toast } = useToast();
  const { user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // UI state
  const [search,        setSearch]        = useState('');
  const [filterRole,    setFilterRole]    = useState<'All' | UserRole>('All');
  const [hoveredId,     setHoveredId]     = useState<string | null>(null);
  const [isCreating,    setIsCreating]    = useState(false);

  // Dialog state
  const [isAddOpen,     setIsAddOpen]     = useState(false);
  const [isEditOpen,    setIsEditOpen]    = useState(false);
  const [isDeleteOpen,  setIsDeleteOpen]  = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [editingUser,   setEditingUser]   = useState<User | null>(null);
  const [deletingUser,  setDeletingUser]  = useState<User | null>(null);
  const [selectedUser,  setSelectedUser]  = useState<User | null>(null);

  const [newUser, setNewUser] = useState({
    name: '', email: '', password: '', phone: '', role: 'user' as UserRole,
  });
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  // ── Auth ready ───────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated) refreshUsers();
  }, [isAuthLoading, isAuthenticated, refreshUsers]);

  // ── Stats ────────────────────────────────────────────────────
  const adminCount  = users.filter(u => u.role === 'admin').length;
  const staffCount  = users.filter(u => u.role === 'staff').length;
  const activeCount = users.filter(u => u.isActive).length;

  // ── Filtering ────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // ── Handlers ─────────────────────────────────────────────────
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
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
      const response = await fetch('http://localhost:3000/api/admin/users', {
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
      const response = await fetch(`http://localhost:3000/api/users/${editingUser.id}`, {
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
      const response = await fetch(`http://localhost:3000/api/users/${deletingUser.id}`, {
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
      const response = await fetch(`http://localhost:3000/api/admin/users/${userId}/status`, {
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

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="animate-fade-in"
      style={{
        color: TEXT_DARK,
        fontFamily: "'Jost', 'DM Sans', sans-serif",
        backgroundColor: PAGE_BG,
        minHeight: '100vh',
        padding: '36px 40px',
      }}
    >
      {/* ── Page Header ──────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        marginBottom: 32, paddingBottom: 24,
        borderBottom: `0.5px solid ${DIVIDER}`,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ display: 'block', height: 1, width: 20, background: GOLD }} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.32em', color: GOLD }}>
              Directory
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.02em',
            color: TEXT_DARK, lineHeight: 1.1, marginBottom: 6,
          }}>
            Users &amp;{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>Staff</span>
          </h1>
          <p style={{ fontSize: 12, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            {users.length} registered accounts
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            backgroundColor: GOLD, padding: '12px 22px',
            fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em',
            fontWeight: 700, color: '#0c0b09', border: 'none',
            cursor: 'pointer', transition: 'background-color 0.2s', fontFamily: 'inherit',
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = GOLD)}
        >
          <Plus style={{ width: 13, height: 13 }} />
          Add User
        </button>
      </div>

      {/* ── Stats Strip ──────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1, marginBottom: 32,
        border: `0.5px solid ${BORDER_LIGHT}`,
        backgroundColor: BORDER_LIGHT,
        overflow: 'hidden',
      }}>
        {[
          { icon: <Users style={{ width: 14, height: 14, color: GOLD }} />,         label: 'Total Users',  value: users.length,  unit: 'accounts' },
          { icon: <UserCheck style={{ width: 14, height: 14, color: '#4a9c6a' }} />, label: 'Active',       value: activeCount,   unit: 'enabled'  },
          { icon: <Crown style={{ width: 14, height: 14, color: GOLD }} />,          label: 'Admins',       value: adminCount,    unit: 'accounts' },
          { icon: <Shield style={{ width: 14, height: 14, color: '#c4913a' }} />,    label: 'Staff',        value: staffCount,    unit: 'members'  },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: PANEL_BG, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              {stat.icon}
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: TEXT_MUTED }}>
                {stat.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '1.6rem', fontWeight: 300, color: TEXT_DARK, lineHeight: 1,
              }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 10, color: TEXT_MUTED }}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 340 }}>
          <Search style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', width: 13, height: 13, color: TEXT_MUTED,
          }} />
          <input
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              height: 42, backgroundColor: PANEL_BG,
              border: `0.5px solid ${BORDER_LIGHT}`,
              borderRadius: 0, paddingLeft: 36, paddingRight: 12,
              fontSize: 13, color: TEXT_DARK, fontFamily: 'inherit',
              outline: 'none', width: '100%',
            }}
          />
        </div>

        {/* Role filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['All', 'admin', 'staff', 'user'] as const).map(r => {
            const rs = r !== 'All' ? ROLE_STYLES[r] : null;
            const isActive = filterRole === r;
            return (
              <button
                key={r}
                onClick={() => setFilterRole(r)}
                style={{
                  padding: '6px 16px', fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.18em',
                  border: isActive
                    ? `0.5px solid ${rs?.border || GOLD_BORDER}`
                    : `0.5px solid ${BORDER_LIGHT}`,
                  backgroundColor: isActive ? (rs?.bg || GOLD_PALE) : 'transparent',
                  color: isActive ? (r === 'admin' ? '#0c0b09' : rs?.color || GOLD) : TEXT_MUTED,
                  cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = rs?.border || GOLD_BORDER;
                    e.currentTarget.style.color = rs?.color || GOLD;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = BORDER_LIGHT;
                    e.currentTarget.style.color = TEXT_MUTED;
                  }
                }}
              >
                {r === 'All' ? 'All' : r}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Loading ───────────────────────────────────────── */}
      {isAuthLoading && (
        <div style={{ padding: '64px 24px', textAlign: 'center', border: `0.5px solid ${BORDER_LIGHT}`, backgroundColor: PANEL_BG }}>
          <Loader2 style={{ width: 22, height: 22, color: GOLD, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.28em', color: TEXT_MUTED }}>
            Checking authentication…
          </p>
        </div>
      )}

      {/* ── User List ─────────────────────────────────────── */}
      {!isAuthLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.length === 0 && (
            <div style={{
              padding: '64px 24px', textAlign: 'center',
              border: `0.5px solid ${BORDER_LIGHT}`, backgroundColor: PANEL_BG,
            }}>
              <Users style={{ width: 24, height: 24, color: GOLD, margin: '0 auto 12px', opacity: 0.4 }} />
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.28em', color: TEXT_MUTED }}>
                No users found
              </p>
            </div>
          )}

          {filtered.map(user => {
            const userBookings = bookings.filter(b => b.userId === user.id);
            const rs      = ROLE_STYLES[user.role] ?? ROLE_STYLES.user;
            const av      = getAvatar(user.name || 'U');
            const isHover = hoveredId === user.id;

            return (
              <div
                key={user.id}
                onMouseEnter={() => setHoveredId(user.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  backgroundColor: PANEL_BG,
                  border: `0.5px solid ${isHover ? GOLD_BORDER : BORDER_LIGHT}`,
                  transition: 'border-color 0.25s, box-shadow 0.25s',
                  boxShadow: isHover
                    ? '0 6px 28px rgba(196,160,90,0.07)'
                    : '0 1px 8px rgba(30,27,20,0.04)',
                  opacity: user.isActive ? 1 : 0.6,
                  overflow: 'hidden',
                }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: 18, padding: '18px 22px', flexWrap: 'wrap',
                }}>
                  {/* Avatar */}
                  <div
                    onClick={() => { setSelectedUser(user); setIsDetailsOpen(true); }}
                    style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: av.bg, color: av.text,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Georgia, serif', fontStyle: 'italic',
                      fontSize: '1.1rem', fontWeight: 400,
                      cursor: 'pointer', transition: 'opacity 0.2s',
                      border: `0.5px solid rgba(196,160,90,0.2)`,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    title="View details"
                  >
                    {(user.name || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div
                    style={{ flex: '1 1 180px', minWidth: 0, cursor: 'pointer' }}
                    onClick={() => { setSelectedUser(user); setIsDetailsOpen(true); }}
                  >
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: TEXT_DARK,
                      marginBottom: 3, display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      {user.name}
                      {!user.isActive && (
                        <span style={{
                          fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em',
                          padding: '2px 7px', border: '0.5px solid rgba(248,113,113,0.3)',
                          backgroundColor: 'rgba(248,113,113,0.07)', color: '#d97070',
                        }}>Inactive</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: TEXT_MUTED, marginBottom: 2 }}>
                      {user.email}
                      {user.phone && <><span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>{user.phone}</>}
                    </p>
                    <p style={{ fontSize: 10, color: 'rgba(61,53,38,0.3)', letterSpacing: '0.04em' }}>
                      Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      <span style={{ margin: '0 5px', opacity: 0.4 }}>·</span>
                      {userBookings.length} booking{userBookings.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Role badge */}
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', flexShrink: 0,
                    border: `0.5px solid ${rs.border}`,
                    backgroundColor: rs.bg, color: rs.color,
                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em',
                    fontFamily: 'inherit',
                  }}>
                    {user.role === 'admin' && <Crown style={{ width: 10, height: 10 }} />}
                    {user.role === 'staff' && <Shield style={{ width: 10, height: 10 }} />}
                    {rs.label}
                  </div>

                  {/* Role selector */}
                  <div style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <Select value={user.role} onValueChange={v => handleRoleChange(user.id, v as UserRole)}>
                      <SelectTrigger style={{
                        height: 34, width: 110,
                        backgroundColor: 'transparent',
                        border: `0.5px solid ${BORDER_LIGHT}`,
                        borderRadius: 0, fontSize: 11,
                        color: TEXT_WARM, fontFamily: 'inherit',
                        padding: '0 10px',
                      }} className="focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: PANEL_BG, border: `0.5px solid ${BORDER_LIGHT}`, borderRadius: 0 }}>
                        <SelectItem value="user"  style={{ fontSize: 12, color: TEXT_WARM }}>Client</SelectItem>
                        <SelectItem value="staff" style={{ fontSize: 12, color: TEXT_WARM }}>Staff</SelectItem>
                        <SelectItem value="admin" style={{ fontSize: 12, color: TEXT_WARM }}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {/* Activate / Deactivate */}
                    <button
                      onClick={e => { e.stopPropagation(); toggleUserActive(user.id); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 13px', fontSize: 9,
                        textTransform: 'uppercase', letterSpacing: '0.16em',
                        border: user.isActive
                          ? '0.5px solid rgba(248,113,113,0.28)'
                          : '0.5px solid rgba(74,156,106,0.30)',
                        backgroundColor: user.isActive
                          ? 'rgba(248,113,113,0.05)'
                          : 'rgba(74,156,106,0.07)',
                        color: user.isActive ? '#d97070' : '#4a9c6a',
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = user.isActive
                          ? 'rgba(248,113,113,0.12)' : 'rgba(74,156,106,0.14)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = user.isActive
                          ? 'rgba(248,113,113,0.05)' : 'rgba(74,156,106,0.07)';
                      }}
                    >
                      {user.isActive
                        ? <><ShieldOff style={{ width: 11, height: 11 }} /> Deactivate</>
                        : <><Shield style={{ width: 11, height: 11 }} /> Activate</>}
                    </button>

                    {/* Edit */}
                    <button
                      onClick={e => { e.stopPropagation(); openEdit(user); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 13px', fontSize: 9,
                        textTransform: 'uppercase', letterSpacing: '0.16em',
                        border: `0.5px solid ${BORDER_LIGHT}`,
                        backgroundColor: 'transparent', color: TEXT_MUTED,
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = GOLD_BORDER;
                        e.currentTarget.style.color = GOLD;
                        e.currentTarget.style.backgroundColor = GOLD_PALE;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = BORDER_LIGHT;
                        e.currentTarget.style.color = TEXT_MUTED;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Pencil style={{ width: 11, height: 11 }} /> Edit
                    </button>

                    {/* Delete */}
                    <button
                      onClick={e => { e.stopPropagation(); setDeletingUser(user); setIsDeleteOpen(true); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36,
                        border: '0.5px solid rgba(248,113,113,0.22)',
                        backgroundColor: 'rgba(248,113,113,0.04)',
                        color: '#d97070', cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.12)';
                        e.currentTarget.style.borderColor = 'rgba(248,113,113,0.45)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(248,113,113,0.22)';
                      }}
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          ── DIALOGS ──────────────────────────────────────
          ════════════════════════════════════════════════ */}

      {/* Shared dialog shell style */}
      {(() => {
        const dialogShell: React.CSSProperties = {
          backgroundColor: DARK_BG,
          border: `0.5px solid rgba(196,160,90,0.22)`,
          borderRadius: 0,
          padding: 0,
          maxWidth: 480,
          color: TEXT_LIGHT,
          fontFamily: "'Jost', 'DM Sans', sans-serif",
        };

        const DialogHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
          <div style={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            padding: '22px 30px', borderBottom: `0.5px solid ${BORDER_DARK}`,
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD }}>
                  {eyebrow}
                </span>
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.15rem', fontWeight: 300, fontStyle: 'italic', color: TEXT_LIGHT }}>
                {title}
              </h2>
            </div>
          </div>
        );

        const SaveBtn = ({ label, onClick, type = 'button', disabled = false }: any) => (
          <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              backgroundColor: disabled ? 'rgba(196,160,90,0.4)' : GOLD,
              padding: '13px 24px', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.24em',
              fontWeight: 700, color: '#0c0b09', border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer', width: '100%',
              transition: 'background-color 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = GOLD_LIGHT; }}
            onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = GOLD; }}
          >
            {disabled && <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />}
            {label}
            {!disabled && <ArrowRight style={{ width: 13, height: 13 }} />}
          </button>
        );

        const CancelBtn = ({ onClick }: { onClick: () => void }) => (
          <button
            onClick={onClick}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '13px 24px', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.24em',
              fontWeight: 500, color: TEXT_LIGHT_MUTED,
              border: `0.5px solid ${BORDER_DARK}`,
              backgroundColor: 'transparent', cursor: 'pointer',
              width: '100%', fontFamily: 'inherit', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_BORDER; e.currentTarget.style.color = TEXT_LIGHT; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_DARK; e.currentTarget.style.color = TEXT_LIGHT_MUTED; }}
          >
            Cancel
          </button>
        );

        const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
          <div>
            <label style={labelDark}>{label}</label>
            {children}
          </div>
        );

        return (
          <>
            {/* ── Add User Dialog ─────────────────────────── */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogContent style={dialogShell}>
                <DialogHeader eyebrow="New Account" title="Create a New User" />
                <form
                  onSubmit={handleAddUser}
                  style={{ padding: '22px 30px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '72vh', overflowY: 'auto' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <FormField label="Full Name *">
                      <Input value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))}
                        placeholder="Alexandra Beaumont" required style={sharedInput}
                        className="focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgba(184,173,150,0.25)]" />
                    </FormField>
                    <FormField label="Phone">
                      <Input value={newUser.phone} onChange={e => setNewUser(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 (000) 000-0000" type="tel" style={sharedInput}
                        className="focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgba(184,173,150,0.25)]" />
                    </FormField>
                  </div>
                  <FormField label="Email Address *">
                    <Input value={newUser.email} onChange={e => setNewUser(p => ({ ...p, email: e.target.value }))}
                      placeholder="a.beaumont@email.com" type="email" required style={sharedInput}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgba(184,173,150,0.25)]" />
                  </FormField>
                  <FormField label="Password *">
                    <Input value={newUser.password} onChange={e => setNewUser(p => ({ ...p, password: e.target.value }))}
                      placeholder="Min 8 chars, upper, lower, number" type="password" required style={sharedInput}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgba(184,173,150,0.25)]" />
                  </FormField>
                  <FormField label="Role *">
                    <Select value={newUser.role} onValueChange={v => setNewUser(p => ({ ...p, role: v as UserRole }))}>
                      <SelectTrigger style={{ ...sharedInput, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }}
                        className="focus:ring-0 focus:ring-offset-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent style={{ backgroundColor: DARK_MID, border: `0.5px solid rgba(196,160,90,0.2)`, borderRadius: 0 }}>
                        <SelectItem value="user"  style={{ fontSize: 13, color: TEXT_LIGHT }}>Client</SelectItem>
                        <SelectItem value="staff" style={{ fontSize: 13, color: TEXT_LIGHT }}>Staff</SelectItem>
                        <SelectItem value="admin" style={{ fontSize: 13, color: TEXT_LIGHT }}>Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                  <div style={{ height: '0.5px', backgroundColor: BORDER_DARK }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <CancelBtn onClick={() => setIsAddOpen(false)} />
                    <SaveBtn label={isCreating ? 'Creating…' : 'Create User'} type="submit" disabled={isCreating} />
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* ── Edit User Dialog ────────────────────────── */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
              <DialogContent style={dialogShell}>
                <DialogHeader eyebrow="Edit Account" title={`Editing: ${editingUser?.name || ''}`} />
                <form
                  onSubmit={handleEditUser}
                  style={{ padding: '22px 30px', display: 'flex', flexDirection: 'column', gap: 16 }}
                >
                  <FormField label="Full Name">
                    <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      required style={sharedInput}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </FormField>
                  <FormField label="Email Address">
                    <Input value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}
                      type="email" required style={sharedInput}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0" />
                  </FormField>
                  <FormField label="Phone">
                    <Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))}
                      style={sharedInput}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgba(184,173,150,0.25)]" />
                  </FormField>
                  <div style={{ height: '0.5px', backgroundColor: BORDER_DARK }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                    <CancelBtn onClick={() => setIsEditOpen(false)} />
                    <SaveBtn label="Save Changes" type="submit" />
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ──────────────── */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
              <DialogContent style={{ ...dialogShell, maxWidth: 420 }}>
                <DialogHeader eyebrow="Danger Zone" title="Delete User Account" />
                <div style={{ padding: '22px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* User preview */}
                  {deletingUser && (() => {
                    const av = getAvatar(deletingUser.name || 'U');
                    return (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px',
                        border: `0.5px solid rgba(248,113,113,0.2)`,
                        backgroundColor: 'rgba(248,113,113,0.04)',
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          backgroundColor: av.bg, color: av.text,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1rem',
                        }}>
                          {(deletingUser.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, color: TEXT_LIGHT, marginBottom: 2 }}>{deletingUser.name}</div>
                          <div style={{ fontSize: 11, color: TEXT_LIGHT_MUTED }}>{deletingUser.email}</div>
                        </div>
                      </div>
                    );
                  })()}
                  <p style={{ fontSize: 12, color: TEXT_LIGHT_MUTED, lineHeight: 1.7 }}>
                    This action is <span style={{ color: '#d97070' }}>permanent and irreversible</span>.
                    All data associated with this account will be removed.
                  </p>
                  <div style={{ height: '0.5px', backgroundColor: BORDER_DARK }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <CancelBtn onClick={() => setIsDeleteOpen(false)} />
                    <button
                      onClick={handleDeleteUser}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        backgroundColor: 'rgba(217,112,112,0.15)',
                        border: '0.5px solid rgba(217,112,112,0.4)',
                        padding: '13px', fontSize: 10,
                        textTransform: 'uppercase', letterSpacing: '0.22em',
                        fontWeight: 700, color: '#d97070',
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(217,112,112,0.25)'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(217,112,112,0.15)'; }}
                    >
                      <Trash2 style={{ width: 12, height: 12 }} /> Delete
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* ── User Details Dialog ─────────────────────── */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
              <DialogContent style={{ ...dialogShell, maxWidth: 440 }}>
                <DialogHeader eyebrow="Account Profile" title="User Details" />
                {selectedUser && (() => {
                  const av  = getAvatar(selectedUser.name || 'U');
                  const rs  = ROLE_STYLES[selectedUser.role] ?? ROLE_STYLES.user;
                  const ubs = bookings.filter(b => b.userId === selectedUser.id);
                  return (
                    <div style={{ padding: '22px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Avatar + name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%',
                          backgroundColor: av.bg, color: av.text,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.5rem',
                          border: `0.5px solid rgba(196,160,90,0.3)`,
                        }}>
                          {(selectedUser.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_LIGHT, marginBottom: 4 }}>
                            {selectedUser.name}
                          </div>
                          <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em',
                            padding: '3px 10px',
                            border: `0.5px solid ${rs.border}`,
                            backgroundColor: rs.bg, color: rs.color,
                          }}>
                            {rs.label}
                          </div>
                        </div>
                      </div>

                      {/* Details grid */}
                      <div style={{
                        border: `0.5px solid ${BORDER_DARK}`,
                        backgroundColor: 'rgba(196,160,90,0.03)',
                      }}>
                        {[
                          { label: 'Email',     value: selectedUser.email },
                          { label: 'Phone',     value: selectedUser.phone || '—' },
                          { label: 'Role',      value: rs.label },
                          { label: 'Status',    value: selectedUser.isActive ? 'Active' : 'Inactive' },
                          { label: 'Bookings',  value: `${ubs.length} booking${ubs.length !== 1 ? 's' : ''}` },
                          { label: 'Joined',    value: new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) },
                        ].map((row, i, arr) => (
                          <div
                            key={row.label}
                            style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '10px 16px',
                              borderBottom: i < arr.length - 1 ? `0.5px solid ${BORDER_DARK}` : 'none',
                            }}
                          >
                            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: TEXT_LIGHT_MUTED }}>
                              {row.label}
                            </span>
                            <span style={{
                              fontSize: 12, color: row.label === 'Status'
                                ? selectedUser.isActive ? '#4a9c6a' : '#d97070'
                                : TEXT_LIGHT,
                            }}>
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div style={{ height: '0.5px', backgroundColor: BORDER_DARK }} />
                      <button
                        onClick={() => setIsDetailsOpen(false)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          backgroundColor: GOLD, padding: '13px',
                          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em',
                          fontWeight: 700, color: '#0c0b09', border: 'none',
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = GOLD)}
                      >
                        Close
                      </button>
                    </div>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </>
        );
      })()}
    </div>
  );
};

export default AdminUsers;