import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Notification } from '@/types/hotel';
import { Navigate } from 'react-router-dom';
import {
  Building2, LayoutDashboard, BedDouble, CalendarCheck,
  ClipboardList, LogOut, ChevronLeft, Menu, Bell, Check, Trash2, X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ── Design tokens ──────────────────────────────────────────
const GOLD        = '#c4a05a';
const SIDEBAR_BG  = '#2c2418';
const SIDEBAR_BR  = 'rgba(196,160,90,0.18)';
const CONTENT_BG  = '#f7f3ee';
const HEADER_BG   = '#ffffff';
const HEADER_BR   = 'rgba(196,160,90,0.2)';
const TEXT_LIGHT  = '#f7f3ee';
const TEXT_DARK   = '#1a1612';
const MUTED_LIGHT = 'rgba(247,243,238,0.45)';
const MUTED_DARK  = '#8a7d6e';
const ACTIVE_BG   = 'rgba(196,160,90,0.15)';
const HOVER_BG    = 'rgba(247,243,238,0.06)';

const SIDEBAR_W_EXPANDED  = 228;
const SIDEBAR_W_COLLAPSED = 64;

const linkConfig = [
  { to: '/staff',              label: 'Dashboard',    icon: LayoutDashboard, gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
  { to: '/staff/front-desk',   label: 'Front Desk',   icon: CalendarCheck,   gradient: 'linear-gradient(135deg,#10b981,#059669)' },
  { to: '/staff/housekeeping', label: 'Housekeeping', icon: BedDouble,       gradient: 'linear-gradient(135deg,#f59e0b,#d97706)' },
  { to: '/staff/reservations', label: 'Reservations', icon: ClipboardList,   gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
];

const StaffLayout = () => {
  const { user, logout, isLoading } = useAuth();
  const {
    notifications, unreadCount,
    markAsRead, markAllAsRead,
    deleteNotification, deleteAllNotifications,
  } = useNotifications();
  const navigate  = useNavigate();
  const location  = useLocation();

  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // Desktop: icon-only collapsed state
  const [collapsed, setCollapsed] = useState(false);

  // Mobile: drawer open/close
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Viewport tracking
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto-close drawer on route change (mobile)
  useEffect(() => {
    if (isMobile) setDrawerOpen(false);
  }, [location.pathname, isMobile]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    switch (notification.type) {
      case 'booking':
      case 'payment':         navigate('/staff/front-desk');   break;
      case 'guest_note':      navigate('/staff/reservations'); break;
      case 'contact_message': navigate('/admin/messages');     break;
      case 'system':          navigate('/staff');              break;
      default:                navigate('/staff');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: CONTENT_BG }}>
        <div style={{
          width: 36, height: 36,
          border: `2px solid ${GOLD}`,
          borderTopColor: 'transparent',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user || (user.role as string) !== 'staff') return <Navigate to="/login" replace />;

  const isActive = (path: string) => location.pathname === path;
  const currentPage = linkConfig.find(l => isActive(l.to))?.label || 'Staff Portal';

  // On mobile the sidebar is always fully expanded when the drawer is open
  const sidebarExpanded = isMobile ? true : !collapsed;
  const sidebarWidth    = isMobile
    ? SIDEBAR_W_EXPANDED
    : (collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED);

  // ── Sidebar inner content (reused for both desktop & mobile drawer) ──
  const SidebarContent = () => (
    <>
      {/* Top gold rule */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, flexShrink: 0 }} />

      {/* Logo row */}
      <div style={{
        height: 68, display: 'flex', alignItems: 'center', flexShrink: 0,
        justifyContent: sidebarExpanded ? 'space-between' : 'center',
        padding: sidebarExpanded ? '0 14px 0 18px' : '0 14px',
        borderBottom: `1px solid ${SIDEBAR_BR}`,
      }}>
        {sidebarExpanded && (
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(196,160,90,0.35)',
            }}>
              <Building2 size={15} color="#1a1612" />
            </div>
            <div>
              <span style={{
                fontFamily: 'Georgia, serif', fontSize: '1rem',
                fontWeight: 300, fontStyle: 'italic',
                color: TEXT_LIGHT, letterSpacing: '0.02em', display: 'block', lineHeight: 1.1,
              }}>
                LuxeStay
              </span>
              <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.22em', color: MUTED_LIGHT }}>
                Staff
              </span>
            </div>
          </Link>
        )}

        {!sidebarExpanded && (
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Building2 size={15} color="#1a1612" />
          </div>
        )}

        {/* Mobile: close (X); Desktop: chevron collapse */}
        {isMobile ? (
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: MUTED_LIGHT, display: 'flex', alignItems: 'center',
              padding: 6, borderRadius: 6,
            }}
          >
            <X size={15} />
          </button>
        ) : (
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: MUTED_LIGHT, display: 'flex', alignItems: 'center',
              padding: 6, borderRadius: 6, transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = HOVER_BG; }}
            onMouseLeave={e => { e.currentTarget.style.color = MUTED_LIGHT; e.currentTarget.style.background = 'none'; }}
          >
            {collapsed ? <Menu size={15} /> : <ChevronLeft size={15} />}
          </button>
        )}
      </div>

      {/* Nav label */}
      {sidebarExpanded && (
        <div style={{ padding: '18px 18px 8px', flexShrink: 0 }}>
          <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(196,160,90,0.4)' }}>
            Navigation
          </span>
        </div>
      )}

      {/* Nav links */}
      <nav style={{
        flex: 1, overflowY: 'auto',
        padding: sidebarExpanded ? '4px 10px' : '10px 8px',
        display: 'flex', flexDirection: 'column', gap: 3,
      }}>
        {linkConfig.map(link => {
          const active = isActive(link.to);
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{
                display: 'flex', alignItems: 'center',
                gap: sidebarExpanded ? 10 : 0,
                justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                padding: sidebarExpanded ? '9px 10px' : '10px',
                textDecoration: 'none', borderRadius: 8,
                background: active ? ACTIVE_BG : 'transparent',
                transition: 'all 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = HOVER_BG; }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
            >
              {active && (
                <div style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 2px 2px 0',
                  background: GOLD,
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? link.gradient : 'transparent',
                transition: 'background 0.2s',
                boxShadow: active ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              }}>
                <link.icon size={14} color={active ? '#fff' : MUTED_LIGHT} style={{ transition: 'color 0.2s' }} />
              </div>
              {sidebarExpanded && (
                <span style={{
                  fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.13em',
                  fontWeight: active ? 700 : 400,
                  color: active ? TEXT_LIGHT : MUTED_LIGHT,
                  transition: 'color 0.2s',
                  fontFamily: 'Georgia, serif',
                }}>
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info strip */}
      {sidebarExpanded && (
        <div style={{
          margin: '0 10px 10px', flexShrink: 0,
          padding: '10px 12px',
          background: 'rgba(196,160,90,0.08)',
          border: '1px solid rgba(196,160,90,0.15)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#1a1612', flexShrink: 0,
          }}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: 11, color: TEXT_LIGHT, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name}
            </p>
            <p style={{ fontSize: 9, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Staff</p>
          </div>
        </div>
      )}

      {/* Logout */}
      <div style={{ borderTop: `1px solid ${SIDEBAR_BR}`, padding: sidebarExpanded ? '10px' : '10px 8px', flexShrink: 0 }}>
        <button
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center',
            gap: sidebarExpanded ? 8 : 0,
            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            width: '100%', padding: sidebarExpanded ? '8px 10px' : '10px',
            background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: 8, transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LogOut size={14} color="rgba(248,113,113,0.7)" />
          </div>
          {sidebarExpanded && (
            <span style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.13em', color: 'rgba(248,113,113,0.7)', fontFamily: 'Georgia, serif' }}>
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Bottom gold rule */}
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}30, transparent)`, flexShrink: 0 }} />
    </>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: CONTENT_BG, fontFamily: 'Georgia, serif' }}>

      {/* ── MOBILE OVERLAY ── */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 49,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarWidth,
        background: SIDEBAR_BG,
        borderRight: `1px solid ${SIDEBAR_BR}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        transition: isMobile ? 'transform 0.28s ease' : 'width 0.25s ease',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
        ...(isMobile ? {
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          transform: drawerOpen ? 'translateX(0)' : `translateX(-${sidebarWidth}px)`,
        } : {
          position: 'relative',
        }),
      }}>
        <SidebarContent />
      </aside>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'auto', background: CONTENT_BG }}>

        {/* ── HEADER ── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 40,
          height: 68,
          display: 'flex', alignItems: 'center',
          padding: '0 16px',
          background: HEADER_BG,
          borderBottom: `1px solid ${HEADER_BR}`,
          boxShadow: '0 2px 12px rgba(26,22,18,0.06)',
          gap: 12,
        }}>

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              onClick={() => setDrawerOpen(true)}
              style={{
                background: 'rgba(196,160,90,0.08)',
                border: '1px solid rgba(196,160,90,0.2)',
                cursor: 'pointer', color: MUTED_DARK,
                display: 'flex', alignItems: 'center',
                padding: '7px 8px', borderRadius: 8, flexShrink: 0,
              }}
            >
              <Menu size={15} />
            </button>
          )}

          {/* Breadcrumb title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <span style={{ display: 'block', height: 1, width: 20, background: GOLD, flexShrink: 0 }} />
            <span style={{
              fontFamily: 'Georgia, serif', fontSize: '1rem',
              fontWeight: 300, fontStyle: 'italic', color: TEXT_DARK,
              whiteSpace: 'nowrap',
            }}>
              Staff <span style={{ color: GOLD }}>Portal</span>
            </span>
            {/* Hide sub-page breadcrumb on mobile to avoid overflow */}
            {!isMobile && currentPage && (
              <>
                <span style={{ color: 'rgba(196,160,90,0.4)', fontSize: 12, flexShrink: 0 }}>›</span>
                <span style={{
                  fontSize: 12, color: MUTED_DARK, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {currentPage}
                </span>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, flexShrink: 0 }}>

            {/* Notification bell */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    position: 'relative',
                    background: 'rgba(196,160,90,0.08)',
                    border: '1px solid rgba(196,160,90,0.2)',
                    cursor: 'pointer', color: MUTED_DARK,
                    display: 'flex', alignItems: 'center',
                    padding: '7px 8px', borderRadius: 8,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.2)'; e.currentTarget.style.color = MUTED_DARK; }}
                >
                  <Bell size={15} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -5, right: -5,
                      minWidth: 17, height: 17, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f87171, #ef4444)',
                      border: `2px solid ${HEADER_BG}`,
                      color: '#fff', fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px',
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                style={{
                  width: isMobile ? 'calc(100vw - 32px)' : 320,
                  maxWidth: 320,
                  background: '#fff',
                  border: `1px solid rgba(196,160,90,0.2)`,
                  borderRadius: 12,
                  boxShadow: '0 16px 48px rgba(26,22,18,0.14)',
                  padding: 0,
                  overflow: 'hidden',
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: `1px solid rgba(196,160,90,0.1)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(196,160,90,0.05)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'block', height: 1, width: 12, background: GOLD }} />
                    <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.25em', color: GOLD, fontWeight: 700 }}>
                      Notifications
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {unreadCount > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); markAllAsRead(); }}
                        style={{ background: 'rgba(196,160,90,0.1)', border: '1px solid rgba(196,160,90,0.25)', cursor: 'pointer', fontSize: 9, color: GOLD, display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99 }}
                      >
                        <Check size={9} /> Mark all read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteAllNotifications(); }}
                        style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', cursor: 'pointer', fontSize: 9, color: '#f87171', display: 'flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 99 }}
                      >
                        <Trash2 size={9} /> Delete all
                      </button>
                    )}
                  </div>
                </div>

                {/* Notification list */}
                <div style={{ maxHeight: showAllNotifications ? 384 : 256, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 24px', textAlign: 'center', fontSize: 13, color: MUTED_DARK }}>
                      No notifications yet
                    </div>
                  ) : (
                    (showAllNotifications ? notifications : notifications.slice(0, 4)).map(n => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '10px 14px',
                          borderBottom: `1px solid rgba(196,160,90,0.06)`,
                          background: !n.read ? 'rgba(196,160,90,0.04)' : 'transparent',
                          cursor: 'pointer', borderRadius: 0,
                        }}
                      >
                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', width: '100%' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: !n.read ? GOLD : 'transparent', flexShrink: 0, marginTop: 4 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ fontSize: 12, color: !n.read ? TEXT_DARK : MUTED_DARK, fontWeight: !n.read ? 600 : 400, lineHeight: 1.4 }}>
                                {n.title}
                              </span>
                              <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                                {!n.read && (
                                  <button onClick={e => { e.stopPropagation(); markAsRead(n.id); }}
                                    style={{ background: 'rgba(196,160,90,0.1)', border: 'none', cursor: 'pointer', color: GOLD, padding: '2px 4px', borderRadius: 4 }}>
                                    <Check size={9} />
                                  </button>
                                )}
                                <button onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                                  style={{ background: 'rgba(248,113,113,0.1)', border: 'none', cursor: 'pointer', color: '#f87171', padding: '2px 4px', borderRadius: 4 }}>
                                  <Trash2 size={9} />
                                </button>
                              </div>
                            </div>
                            <p style={{ fontSize: 11, color: MUTED_DARK, marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                            <p style={{ fontSize: 10, color: 'rgba(138,125,110,0.5)', marginTop: 3 }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>

                {/* Show more */}
                {notifications.length > 4 && (
                  <div style={{ padding: '10px 16px', borderTop: `1px solid rgba(196,160,90,0.1)`, textAlign: 'center' }}>
                    <button
                      onClick={() => setShowAllNotifications(!showAllNotifications)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.18em', fontFamily: 'Georgia, serif' }}
                    >
                      {showAllNotifications ? 'Show less' : `View all (${notifications.length})`}
                    </button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Divider — desktop only */}
            {!isMobile && (
              <div style={{ width: 1, height: 24, background: 'rgba(196,160,90,0.2)' }} />
            )}

            {/* User chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#1a1612',
                boxShadow: '0 2px 8px rgba(196,160,90,0.3)',
                border: '2px solid rgba(196,160,90,0.25)',
                flexShrink: 0,
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              {/* Hide name on mobile */}
              {!isMobile && (
                <div>
                  <p style={{ fontSize: 12, color: TEXT_DARK, fontWeight: 600, lineHeight: 1.2, fontFamily: 'Georgia, serif' }}>
                    {user.name}
                  </p>
                  <p style={{ fontSize: 9, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Staff</p>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <div style={{
          flex: 1,
          padding: isMobile ? '16px' : '28px',
          background: CONTENT_BG,
        }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StaffLayout;