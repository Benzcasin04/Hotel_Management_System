import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/types/hotel';
import {
  Building2, Menu, X, User, LogOut,
  LayoutDashboard, CalendarCheck, Bell, Check, Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Design tokens ──────────────────────────────────────────────
const C = {
  warmWhite:   '#faf8f3',
  surface:     '#ffffff',
  surfaceWarm: '#fdf9f4',
  gold:        '#b8924a',
  goldLight:   '#d4aa6a',
  charcoal:    '#2a2520',
  brownMid:    '#5a4a38',
  textBody:    '#3d3028',
  textMuted:   '#7a6a58',
  border:      'rgba(90,74,56,0.12)',
  borderGold:  'rgba(184,146,74,0.30)',
};

// ── Hook: track whether we're on desktop (≥768px) ──────────────
const useIsDesktop = () => {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
};

// ── Shared style objects ───────────────────────────────────────
const navBase: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 50,
  backgroundColor: 'rgba(250,248,243,0.97)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: `0.5px solid ${C.border}`,
  boxShadow: '0 1px 24px rgba(42,37,32,0.06)',
};

const navLinkBase: React.CSSProperties = {
  fontFamily: 'sans-serif',
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '6px 14px',
  borderRadius: 2,
  transition: 'color 0.2s, background 0.2s',
  color: C.textMuted,
  whiteSpace: 'nowrap',
};

const navLinkActive: React.CSSProperties = {
  ...navLinkBase,
  color: C.gold,
  background: 'rgba(184,146,74,0.08)',
  borderBottom: `1.5px solid ${C.gold}`,
};

const iconBtn: React.CSSProperties = {
  position: 'relative',
  background: 'none',
  border: `0.5px solid ${C.border}`,
  borderRadius: 2,
  width: 36,
  height: 36,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  color: C.textMuted,
  transition: 'border-color 0.2s, color 0.2s, background 0.2s',
};

const userPill: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'none',
  border: `0.5px solid ${C.border}`,
  borderRadius: 2,
  padding: '6px 12px',
  cursor: 'pointer',
  fontFamily: 'sans-serif',
  fontSize: 13,
  color: C.textBody,
  transition: 'border-color 0.2s, background 0.2s',
  maxWidth: 220,
  overflow: 'hidden',
};

const roleBadge: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: C.gold,
  background: 'rgba(184,146,74,0.1)',
  border: `0.5px solid ${C.borderGold}`,
  padding: '2px 7px',
  borderRadius: 2,
  flexShrink: 0,
};

const loginBtn: React.CSSProperties = {
  fontFamily: 'sans-serif',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '8px 18px',
  border: `0.5px solid ${C.border}`,
  borderRadius: 2,
  color: C.textMuted,
  background: 'transparent',
  transition: 'border-color 0.2s, color 0.2s',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const signupBtn: React.CSSProperties = {
  fontFamily: 'sans-serif',
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  padding: '8px 18px',
  border: `0.5px solid ${C.gold}`,
  borderRadius: 2,
  color: C.charcoal,
  background: C.gold,
  transition: 'background 0.2s, border-color 0.2s',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

// ── Reusable notification panel ────────────────────────────────
interface NotificationPanelProps {
  notifications: Notification[];
  unreadCount: number;
  showAll: boolean;
  onToggleShowAll: () => void;
  onNotificationClick: (n: Notification) => void;
  onMarkAllRead: () => void;
  onDeleteAll: () => void;
  onMarkRead: (id: string) => void;
  onDelete: (id: string) => void;
}

const NotificationPanel = ({
  notifications, unreadCount, showAll,
  onToggleShowAll, onNotificationClick,
  onMarkAllRead, onDeleteAll, onMarkRead, onDelete,
}: NotificationPanelProps) => (
  <DropdownMenuContent
    align="end"
    style={{
      width: 320,
      background: C.surface,
      border: `0.5px solid ${C.border}`,
      borderRadius: 2,
      boxShadow: '0 8px 32px rgba(42,37,32,0.12)',
      padding: 0,
      overflow: 'hidden',
    }}
  >
    {/* Header */}
    <div style={{
      padding: '12px 16px',
      borderBottom: `0.5px solid ${C.border}`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: C.surfaceWarm, flexWrap: 'wrap', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'block', height: '0.5px', width: 14, background: C.gold }} />
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: C.gold, margin: 0 }}>
          Notifications
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {unreadCount > 0 && (
          <button onClick={e => { e.stopPropagation(); onMarkAllRead(); }}
            style={{ fontSize: 10, color: C.brownMid, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check style={{ width: 10, height: 10 }} /> Mark all read
          </button>
        )}
        {notifications.length > 0 && (
          <button onClick={e => { e.stopPropagation(); onDeleteAll(); }}
            style={{ fontSize: 10, color: '#c0392b', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Trash2 style={{ width: 10, height: 10 }} /> Delete all
          </button>
        )}
      </div>
    </div>

    {/* Items */}
    <div style={{ maxHeight: showAll ? 384 : 256, overflowY: showAll ? 'auto' : 'hidden' }}>
      {notifications.length === 0 ? (
        <div style={{ padding: '24px 16px', textAlign: 'center', fontSize: 12, color: C.textMuted }}>
          No notifications yet
        </div>
      ) : (
        (showAll ? notifications : notifications.slice(0, 3)).map(notification => (
          <DropdownMenuItem
            key={notification.id}
            onClick={() => onNotificationClick(notification)}
            style={{
              cursor: 'pointer', padding: '10px 16px',
              borderBottom: `0.5px solid ${C.border}`,
              background: !notification.read ? 'rgba(184,146,74,0.05)' : 'transparent',
              borderLeft: !notification.read ? `2px solid ${C.gold}` : '2px solid transparent',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                <p style={{ fontSize: 12, fontWeight: notification.read ? 400 : 600, color: C.textBody, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {notification.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  {!notification.read && (
                    <button onClick={e => { e.stopPropagation(); onMarkRead(notification.id); }}
                      title="Mark as read"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.gold, padding: 3 }}>
                      <Check style={{ width: 11, height: 11 }} />
                    </button>
                  )}
                  <button onClick={e => { e.stopPropagation(); onDelete(notification.id); }}
                    title="Delete"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', padding: 3 }}>
                    <Trash2 style={{ width: 11, height: 11 }} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>{notification.message}</p>
              <p style={{ fontSize: 10, color: 'rgba(90,74,56,0.45)', margin: 0 }}>
                {new Date(notification.createdAt).toLocaleDateString()}
              </p>
            </div>
          </DropdownMenuItem>
        ))
      )}
    </div>

    {notifications.length > 3 && (
      <div style={{ padding: '10px 16px', borderTop: `0.5px solid ${C.border}`, background: C.surfaceWarm }}>
        <button onClick={onToggleShowAll}
          style={{ fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'center' }}>
          {showAll ? 'Show less' : `View all (${notifications.length})`}
        </button>
      </div>
    )}
  </DropdownMenuContent>
);

// ── Reusable user dropdown menu ────────────────────────────────
interface UserMenuProps {
  dashboardLink: string;
  onLogout: () => void;
}

const UserMenu = ({ dashboardLink, onLogout }: UserMenuProps) => (
  <DropdownMenuContent
    align="end"
    style={{
      width: 192,
      background: C.surface,
      border: `0.5px solid ${C.border}`,
      borderRadius: 2,
      boxShadow: '0 8px 32px rgba(42,37,32,0.12)',
      padding: '4px 0',
      overflow: 'hidden',
    }}
  >
    <div style={{ height: 2, background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, transparent)` }} />
    <DropdownMenuItem asChild>
      <Link to={dashboardLink} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.textBody, padding: '9px 14px', textDecoration: 'none' }}>
        <LayoutDashboard style={{ width: 14, height: 14, color: C.gold }} /> Dashboard
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.textBody, padding: '9px 14px', textDecoration: 'none' }}>
        <CalendarCheck style={{ width: 14, height: 14, color: C.gold }} /> My Reservations
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link to="/settings" style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.textBody, padding: '9px 14px', textDecoration: 'none' }}>
        <User style={{ width: 14, height: 14, color: C.gold }} /> Settings
      </Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator style={{ backgroundColor: C.border, margin: '4px 0' }} />
    <DropdownMenuItem onClick={onLogout}
      style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#c0392b', padding: '9px 14px', cursor: 'pointer' }}>
      <LogOut style={{ width: 14, height: 14 }} /> Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
);

// ── UnreadBadge helper ─────────────────────────────────────────
const UnreadBadge = ({ count }: { count: number }) =>
  count > 0 ? (
    <span style={{
      position: 'absolute', top: -4, right: -4,
      minWidth: 18, height: 18, borderRadius: '50%',
      background: '#c0392b', border: '1.5px solid #faf8f3',
      color: '#fff', fontSize: 10, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px',
    }}>
      {count > 99 ? '99+' : count}
    </span>
  ) : null;

// ─────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const {
    notifications, unreadCount,
    markAsRead, markAllAsRead,
    deleteNotification, deleteAllNotifications,
  } = useNotifications();
  const navigate  = useNavigate();
  const location  = useLocation();

  // ← KEY FIX: JS-driven breakpoint, not Tailwind responsive classes
  const isDesktop = useIsDesktop();

  const [mobileOpen, setMobileOpen]                     = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [bellHover, setBellHover]                       = useState(false);
  const [userHover, setUserHover]                       = useState(false);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    if (isDesktop) setMobileOpen(false);
  }, [isDesktop]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    const isAdminOrStaff = (user?.role as string) === 'admin' || (user?.role as string) === 'staff';
    switch (notification.type) {
      case 'booking':
      case 'payment':         navigate(isAdminOrStaff ? '/admin/bookings' : '/dashboard'); break;
      case 'guest_note':      navigate(isAdminOrStaff ? '/admin/bookings' : '/dashboard'); break;
      case 'contact_message': navigate('/admin/messages'); break;
      case 'system':          navigate(isAdminOrStaff ? '/admin' : '/dashboard'); break;
      default:                navigate(isAdminOrStaff ? '/admin' : '/dashboard');
    }
  };

  const publicLinks = [
    { to: '/',        label: 'Home'    },
    { to: '/rooms',   label: 'Rooms'   },
    { to: '/about',   label: 'About'   },
    { to: '/contact', label: 'Contact' },
  ];

  const isActive       = (path: string) => location.pathname === path;
  const getDashboardLink = () => {
    if (!user) return '/dashboard';
    if ((user.role as string) === 'admin') return '/admin';
    if ((user.role as string) === 'staff') return '/staff';
    return '/dashboard';
  };

  const notifPanelProps = {
    notifications, unreadCount,
    showAll: showAllNotifications,
    onToggleShowAll: () => setShowAllNotifications(v => !v),
    onNotificationClick: handleNotificationClick,
    onMarkAllRead: markAllAsRead,
    onDeleteAll: deleteAllNotifications,
    onMarkRead: markAsRead,
    onDelete: deleteNotification,
  };

  return (
    <nav style={navBase}>
      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', height: 64,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isDesktop ? '0 24px' : '0 14px',
      }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <Building2 style={{ width: 28, height: 28, color: C.gold }} />
          <span style={{ fontFamily: 'Georgia, Times New Roman, serif', fontSize: 20, fontWeight: 600, color: C.charcoal, letterSpacing: '0.02em' }}>
            Luxe<span style={{ fontStyle: 'italic', color: C.gold }}>Stay</span>
          </span>
        </Link>

        {/* ── DESKTOP: Nav links + right actions ── */}
        {isDesktop && (
          <>
            {/* Nav links */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {publicLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={isActive(link.to) ? navLinkActive : navLinkBase}
                  onMouseEnter={e => {
                    if (!isActive(link.to)) {
                      (e.currentTarget as HTMLElement).style.color = C.gold;
                      (e.currentTarget as HTMLElement).style.background = 'rgba(184,146,74,0.06)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive(link.to)) {
                      (e.currentTarget as HTMLElement).style.color = C.textMuted;
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isAuthenticated && user ? (
                <>
                  {/* Bell */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button style={{ ...iconBtn, borderColor: bellHover ? C.borderGold : C.border, color: bellHover ? C.gold : C.textMuted, background: bellHover ? 'rgba(184,146,74,0.06)' : 'transparent' }}
                        onMouseEnter={() => setBellHover(true)} onMouseLeave={() => setBellHover(false)}>
                        <Bell style={{ width: 16, height: 16 }} />
                        <UnreadBadge count={unreadCount} />
                      </button>
                    </DropdownMenuTrigger>
                    <NotificationPanel {...notifPanelProps} />
                  </DropdownMenu>

                  {/* User pill */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button style={{ ...userPill, borderColor: userHover ? C.borderGold : C.border, background: userHover ? 'rgba(184,146,74,0.06)' : 'transparent' }}
                        onMouseEnter={() => setUserHover(true)} onMouseLeave={() => setUserHover(false)}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: 'rgba(184,146,74,0.12)', border: `0.5px solid ${C.borderGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User style={{ width: 13, height: 13, color: C.gold }} />
                        </div>
                        <span style={{ fontSize: 13, color: C.textBody, fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </span>
                        <span style={roleBadge}>{user.role}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <UserMenu dashboardLink={getDashboardLink()} onLogout={logout} />
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <Link to="/login" style={loginBtn}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = C.borderGold; (e.currentTarget as HTMLElement).style.color = C.gold; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.textMuted; }}>
                    Log In
                  </Link>
                  <Link to="/signup" style={signupBtn}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = C.goldLight; (e.currentTarget as HTMLElement).style.borderColor = C.goldLight; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = C.gold; (e.currentTarget as HTMLElement).style.borderColor = C.gold; }}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </>
        )}

        {/* ── MOBILE: Bell + User icon + Hamburger ── */}
        {!isDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isAuthenticated && user && (
              <>
                {/* Bell */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button style={{ ...iconBtn }}>
                      <Bell style={{ width: 16, height: 16 }} />
                      <UnreadBadge count={unreadCount} />
                    </button>
                  </DropdownMenuTrigger>
                  <NotificationPanel {...notifPanelProps} />
                </DropdownMenu>

                {/* User icon */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button style={{ ...iconBtn }}>
                      <User style={{ width: 16, height: 16 }} />
                    </button>
                  </DropdownMenuTrigger>
                  <UserMenu dashboardLink={getDashboardLink()} onLogout={logout} />
                </DropdownMenu>
              </>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(v => !v)}
              style={{ ...iconBtn }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X style={{ width: 18, height: 18 }} /> : <Menu style={{ width: 18, height: 18 }} />}
            </button>
          </div>
        )}
      </div>

      {/* ── MOBILE DRAWER ───────────────────────────────────── */}
      {!isDesktop && mobileOpen && (
        <div style={{ borderTop: `0.5px solid ${C.border}`, background: C.warmWhite, padding: '12px 20px 20px' }}>
          <div style={{ height: '0.5px', background: `linear-gradient(90deg, ${C.gold}, transparent)`, marginBottom: 12 }} />

          {/* Nav links */}
          {publicLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              style={{
                display: 'block', fontSize: 11, fontWeight: 500,
                letterSpacing: '0.14em', textTransform: 'uppercase', textDecoration: 'none',
                padding: '11px 0', borderBottom: `0.5px solid ${C.border}`,
                color: isActive(link.to) ? C.gold : C.textMuted, textAlign: 'center',
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Auth / user actions */}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {isAuthenticated && user ? (
              <>
                {/* User identity row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '8px 0', fontSize: 12, color: C.textMuted }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(184,146,74,0.12)', border: `0.5px solid ${C.borderGold}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User style={{ width: 11, height: 11, color: C.gold }} />
                  </div>
                  <span style={{ color: C.textBody }}>{user.name}</span>
                  <span style={roleBadge}>{user.role}</span>
                </div>
                <Link to={getDashboardLink()} onClick={() => setMobileOpen(false)} style={{ ...loginBtn, display: 'block', textAlign: 'center' }}>Dashboard</Link>
                <Link to="/dashboard"         onClick={() => setMobileOpen(false)} style={{ ...loginBtn, display: 'block', textAlign: 'center' }}>My Reservations</Link>
                <Link to="/settings"          onClick={() => setMobileOpen(false)} style={{ ...loginBtn, display: 'block', textAlign: 'center' }}>Settings</Link>
                <button onClick={() => { logout(); setMobileOpen(false); }}
                  style={{ ...loginBtn, color: '#c0392b', borderColor: 'rgba(192,57,43,0.3)', width: '100%' }}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login"  onClick={() => setMobileOpen(false)} style={{ ...loginBtn, display: 'block', textAlign: 'center' }}>Log In</Link>
                <Link to="/signup" onClick={() => setMobileOpen(false)} style={{ ...signupBtn, display: 'block', textAlign: 'center' }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;