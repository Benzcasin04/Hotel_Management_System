import { useAuth } from '@/contexts/AuthContext';
import { useHotel } from '@/contexts/HotelContext';
import { Link } from 'react-router-dom';
import {
  BedDouble, CalendarCheck, Clock, AlertTriangle, Wrench,
  ArrowRight, ChevronRight, Users, Calendar, Star,
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────
const GOLD    = '#c4a05a';
const BORDER  = 'rgba(196,160,90,0.15)';
const SURFACE = '#ffffff';
const TEXT    = '#1a1612';
const MUTED   = '#8a7d6e';
const CREAM   = '#faf8f4';
const DARK    = '#2c2418';

// ── Booking status config ──────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  pending:     { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  confirmed:   { bg: 'rgba(196,160,90,0.12)', color: '#92660a', border: 'rgba(196,160,90,0.3)',  dot: '#c4a05a' },
  checked_in:  { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  checked_out: { bg: 'rgba(138,125,110,0.1)', color: MUTED,     border: 'rgba(138,125,110,0.2)', dot: '#a8a29e' },
  cancelled:   { bg: 'rgba(239,68,68,0.1)',   color: '#991b1b', border: 'rgba(239,68,68,0.25)',  dot: '#ef4444' },
};

// ── Status Pill ────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', fontFamily: 'Georgia, serif',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {status.replace('_', ' ')}
    </span>
  );
};

// ── Stat card config ───────────────────────────────────────
const statMeta = [
  { key: 'arrivals',    label: "Today's Arrivals", icon: CalendarCheck, gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.2)'   },
  { key: 'pending',     label: 'Pending',           icon: Clock,         gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.2)'  },
  { key: 'dirty',       label: 'Dirty Rooms',       icon: AlertTriangle, gradient: 'linear-gradient(135deg,#ec4899,#db2777)', glow: 'rgba(236,72,153,0.2)'  },
  { key: 'maintenance', label: 'Maintenance',       icon: Wrench,        gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.2)'  },
];

// ── Quick action buttons ───────────────────────────────────
const quickActions = [
  { to: '/staff/front-desk',   label: 'Front Desk',   gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.25)'  },
  { to: '/staff/housekeeping', label: 'Housekeeping', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.2)'   },
  { to: '/staff/reservations', label: 'Reservations', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.2)'   },
];

const StaffDashboard = () => {
  const { user } = useAuth();
  const { bookings, rooms } = useHotel();

  const today = new Date().toISOString().split('T')[0];
  const todayBookings   = bookings.filter(b => b.checkIn === today);
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const dirtyRooms      = rooms.filter(r => r.condition === 'dirty');
  const maintenanceRooms = rooms.filter(r => r.condition === 'maintenance');
  const recentBookings  = bookings.slice(0, 5);

  const statValues = {
    arrivals:    todayBookings.length,
    pending:     pendingBookings.length,
    dirty:       dirtyRooms.length,
    maintenance: maintenanceRooms.length,
  };

  // Occupancy percentage
  const activeRooms    = rooms.filter(r => r.isActive).length;
  const checkedInCount = bookings.filter(b => b.status === 'checked_in').length;
  const occupancyPct   = activeRooms > 0 ? Math.round((checkedInCount / activeRooms) * 100) : 0;

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT }}>

      {/* ── Page Header ── */}
      <div style={{
        background: DARK, borderRadius: 14, padding: '24px 28px',
        marginBottom: 24, position: 'relative', overflow: 'hidden',
        boxShadow: '0 5px 24px rgba(0,0,0,0.14)',
      }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -35, right: -35, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '35%', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Avatar */}
            <div style={{
              width: 50, height: 50, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#1a1612',
              boxShadow: '0 3px 12px rgba(196,160,90,0.4)',
              border: '2px solid rgba(196,160,90,0.4)',
            }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Staff Portal</span>
              </div>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.85rem', fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1 }}>
                Staff <em style={{ fontStyle: 'italic', color: GOLD }}>Dashboard</em>
              </h1>
              <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.48)', marginTop: 3 }}>
                Welcome back, <span style={{ color: 'rgba(247,243,238,0.85)', fontWeight: 600 }}>{user?.name}</span>
              </p>
            </div>
          </div>

          {/* Occupancy badge */}
          <div style={{
            padding: '12px 20px', borderRadius: 10,
            background: 'rgba(196,160,90,0.12)',
            border: '1px solid rgba(196,160,90,0.25)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(196,160,90,0.7)', marginBottom: 4 }}>Occupancy</p>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 300, color: GOLD, lineHeight: 1 }}>
              {occupancyPct}%
            </p>
            <p style={{ fontSize: 9, color: 'rgba(247,243,238,0.35)', marginTop: 2 }}>
              {checkedInCount} / {activeRooms} rooms
            </p>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {statMeta.map(meta => (
          <div
            key={meta.key}
            style={{
              background: SURFACE, borderRadius: 12, padding: '16px 18px',
              border: `1px solid ${BORDER}`,
              boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
              position: 'relative', overflow: 'hidden',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 22px ${meta.glow}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
          >
            {/* Top accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: meta.gradient, borderRadius: '12px 12px 0 0' }} />
            {/* Icon */}
            <div style={{
              width: 34, height: 34, borderRadius: 9, background: meta.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 14, marginTop: 4,
              boxShadow: `0 3px 10px ${meta.glow}`,
            }}>
              <meta.icon size={16} color="#fff" />
            </div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 300, color: TEXT, lineHeight: 1, marginBottom: 4 }}>
              {statValues[meta.key as keyof typeof statValues]}
            </div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, fontWeight: 700 }}>
              {meta.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ display: 'block', height: 1, width: 18, background: GOLD }} />
          <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em', color: GOLD, fontWeight: 700 }}>Quick Actions</span>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {quickActions.map(action => (
            <Link
              key={action.to}
              to={action.to}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '11px 22px', borderRadius: 10,
                background: action.gradient,
                fontSize: 11, fontWeight: 700, color: '#fff',
                textDecoration: 'none', fontFamily: 'Georgia, serif',
                letterSpacing: '0.06em',
                boxShadow: `0 3px 12px ${action.glow}`,
                transition: 'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {action.label}
              <ArrowRight size={13} />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>

        {/* Recent Bookings */}
        <div style={{
          background: SURFACE, borderRadius: 12, padding: '22px 24px',
          border: `1px solid ${BORDER}`, boxShadow: '0 2px 12px rgba(26,22,18,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, color: TEXT }}>
                Recent <em style={{ color: GOLD, fontStyle: 'italic' }}>Bookings</em>
              </h2>
            </div>
            <span style={{ fontSize: 10, color: MUTED }}>{bookings.length} total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentBookings.length === 0 ? (
              <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <CalendarCheck size={20} color="rgba(196,160,90,0.4)" />
                </div>
                <p style={{ fontSize: 12, color: MUTED }}>No recent bookings</p>
              </div>
            ) : (
              recentBookings.map((booking, idx) => {
                const room  = rooms.find(r => r.id === booking.roomId);
                const scfg  = statusConfig[booking.status] ?? statusConfig.pending;
                return (
                  <div
                    key={booking.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px', borderRadius: 10,
                      background: CREAM, border: `1px solid ${BORDER}`,
                      transition: 'all 0.2s', gap: 12,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = 'rgba(196,160,90,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = BORDER; }}
                  >
                    {/* Status accent dot */}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: scfg.dot, flexShrink: 0 }} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {room?.name
                          ? <>{room.name} <span style={{ color: MUTED, fontWeight: 400 }}>— {booking.id.slice(0, 12)}…</span></>
                          : `Booking ${booking.id.slice(0, 16)}…`
                        }
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: MUTED }}>
                        <Calendar size={10} />
                        <span>{booking.checkIn} → {booking.checkOut}</span>
                        {booking.guests && (
                          <>
                            <span>·</span>
                            <Users size={10} />
                            <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <StatusPill status={booking.status} />
                    <ChevronRight size={13} color={MUTED} style={{ flexShrink: 0 }} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: Today's Activity + Room Status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Today's Arrivals */}
          <div style={{
            background: SURFACE, borderRadius: 12, padding: '20px 22px',
            border: `1px solid ${BORDER}`, boxShadow: '0 2px 12px rgba(26,22,18,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: 300, color: TEXT }}>
                Today's <em style={{ color: GOLD, fontStyle: 'italic' }}>Arrivals</em>
              </h3>
            </div>

            {todayBookings.length === 0 ? (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 24, fontStyle: 'italic', fontWeight: 300, color: GOLD }}>0</p>
                <p style={{ fontSize: 10, color: MUTED, marginTop: 4 }}>No check-ins today</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todayBookings.slice(0, 3).map(b => {
                  const room = rooms.find(r => r.id === b.roomId);
                  return (
                    <div key={b.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 10px', borderRadius: 8,
                      background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)',
                    }}>
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: TEXT }}>{room?.name || 'Room'}</p>
                        <p style={{ fontSize: 9, color: MUTED }}>Check-in: {b.checkIn}</p>
                      </div>
                      <StatusPill status={b.status} />
                    </div>
                  );
                })}
                {todayBookings.length > 3 && (
                  <p style={{ fontSize: 10, color: MUTED, textAlign: 'center', marginTop: 4 }}>+{todayBookings.length - 3} more</p>
                )}
              </div>
            )}
          </div>

          {/* Room Conditions */}
          <div style={{
            background: SURFACE, borderRadius: 12, padding: '20px 22px',
            border: `1px solid ${BORDER}`, boxShadow: '0 2px 12px rgba(26,22,18,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '0.9rem', fontWeight: 300, color: TEXT }}>
                Room <em style={{ color: GOLD, fontStyle: 'italic' }}>Conditions</em>
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Clean',       count: rooms.filter(r => r.condition === 'clean').length,       bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)',  color: '#059669', dot: '#10b981' },
                { label: 'Dirty',       count: rooms.filter(r => r.condition === 'dirty').length,       bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.2)',   color: '#dc2626', dot: '#ef4444' },
                { label: 'Maintenance', count: rooms.filter(r => r.condition === 'maintenance').length, bg: 'rgba(139,92,246,0.08)',  border: 'rgba(139,92,246,0.2)',  color: '#7c3aed', dot: '#8b5cf6' },
                { label: 'Occupied',    count: rooms.filter(r => !r.isActive).length,                  bg: 'rgba(196,160,90,0.08)',  border: 'rgba(196,160,90,0.2)',  color: '#92660a', dot: '#c4a05a' },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px', borderRadius: 9,
                  background: row.bg, border: `1px solid ${row.border}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.dot }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: TEXT }}>{row.label}</span>
                  </div>
                  <span style={{
                    fontFamily: 'Georgia, serif', fontSize: '1rem', fontStyle: 'italic',
                    fontWeight: 300, color: row.color,
                  }}>
                    {row.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Staff note */}
          <div style={{
            padding: '14px 16px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(196,160,90,0.1), rgba(196,160,90,0.05))',
            border: `1px solid rgba(196,160,90,0.22)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Star size={12} color={GOLD} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: GOLD, fontWeight: 700 }}>
                Today's Note
              </span>
            </div>
            <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.65 }}>
              Remember to verify all check-ins before 3 PM and update room conditions after housekeeping rounds.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;