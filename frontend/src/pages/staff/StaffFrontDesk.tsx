import { useState, useEffect } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { logAuditAction } from '@/pages/admin/AdminSettings';
import { Search, LogIn, LogOut, Users, Calendar, BedDouble, ChevronRight } from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────
const GOLD    = '#c4a05a';
const BORDER  = 'rgba(196,160,90,0.15)';
const SURFACE = '#ffffff';
const TEXT    = '#1a1612';
const MUTED   = '#8a7d6e';
const CREAM   = '#faf8f4';
const DARK    = '#2c2418';

// ── Responsive hook ────────────────────────────────────────
const useBreakpoint = () => {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return { isMobile: width < 640, isTablet: width >= 640 && width < 1024, width };
};

// ── Booking status config ──────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  pending:    { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  confirmed:  { bg: 'rgba(196,160,90,0.12)', color: '#92660a', border: 'rgba(196,160,90,0.3)',  dot: '#c4a05a' },
  checked_in: { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
};

// ── Status Pill ────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
      padding: '4px 11px', borderRadius: 999,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', fontFamily: 'Georgia, serif',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status.replace('_', ' ')}
    </span>
  );
};

const StaffFrontDesk = () => {
  const { bookings, rooms, users, updateBookingStatus, updateBookingForStaff } = useHotel();
  const { user }              = useAuth();
  const { toast }             = useToast();
  const { createNotification } = useNotifications();
  const { isMobile, isTablet } = useBreakpoint();

  const [search, setSearch]           = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'arrivals' | 'departures'>('all');

  const relevant   = bookings.filter(b =>
    b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'pending'
  );
  const arrivals   = relevant.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const departures = relevant.filter(b => b.status === 'checked_in');

  const base = activeFilter === 'arrivals'   ? arrivals
             : activeFilter === 'departures' ? departures
             : relevant;

  const filtered = base.filter(b => {
    const guest = users.find(u => u.id === b.userId);
    const room  = rooms.find(r => r.id === b.roomId);
    return (
      (guest?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (room?.name  || '').toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleCheckIn = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const guest   = users.find(u => u.id === booking?.userId);
    const room    = rooms.find(r => r.id === booking?.roomId);
    updateBookingForStaff(bookingId, 'checked_in');
    logAuditAction('Staff: Guest Check-in', `${room?.name || 'Room'} - ${guest?.name || 'Guest'}`, 'success', `Staff ${user?.name} checked in guest ${guest?.name || 'Guest'}`);
    toast({ title: 'Guest checked in successfully' });
    if (booking?.userId) {
      createNotification({ userId: booking.userId, title: 'Checked In Successfully', message: `You have successfully checked in to ${room?.name || 'Room'}. Enjoy your stay!`, type: 'booking', relatedId: bookingId, read: false });
    }
    createNotification({ userId: null, title: 'Guest Checked In', message: `${guest?.name || 'Guest'} checked in to ${room?.name || 'Room'} (Staff: ${user?.name})`, type: 'booking', relatedId: bookingId, read: false });
  };

  const handleCheckOut = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const guest   = users.find(u => u.id === booking?.userId);
    const room    = rooms.find(r => r.id === booking?.roomId);
    updateBookingForStaff(bookingId, 'checked_out');
    logAuditAction('Staff: Guest Check-out', `${room?.name || 'Room'} - ${guest?.name || 'Guest'}`, 'warning', `Staff ${user?.name} checked out guest ${guest?.name || 'Guest'}, room marked dirty`);
    toast({ title: 'Guest checked out — room marked dirty' });
    if (booking?.userId) {
      createNotification({ userId: booking.userId, title: 'Checked Out Successfully', message: `You have successfully checked out from ${room?.name || 'Room'}. Thank you for staying with us!`, type: 'booking', relatedId: bookingId, read: false });
    }
    createNotification({ userId: null, title: 'Guest Checked Out', message: `${guest?.name || 'Guest'} checked out from ${room?.name || 'Room'} (Staff: ${user?.name})`, type: 'booking', relatedId: bookingId, read: false });
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT }}>

      {/* ── Page Header ── */}
      <div style={{
        background: DARK, borderRadius: 14,
        padding: isMobile ? '18px 16px' : '24px 28px',
        marginBottom: isMobile ? 16 : 22,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 5px 24px rgba(0,0,0,0.14)',
      }}>
        <div style={{ position: 'absolute', top: -35, right: -35, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '35%', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          gap: 14,
        }}>
          {/* Title */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Staff Portal</span>
            </div>
            <h1 style={{
              fontFamily: 'Georgia, serif',
              fontSize: isMobile ? '1.4rem' : '1.85rem',
              fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1,
            }}>
              Front <em style={{ fontStyle: 'italic', color: GOLD }}>Desk</em>
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.48)', marginTop: 4 }}>
              Check guests in and out
            </p>
          </div>

          {/* Summary chips — stretch full width on mobile */}
          <div style={{
            display: 'flex', gap: 10,
            width: isMobile ? '100%' : 'auto',
          }}>
            {[
              { label: 'Arrivals', count: arrivals.length,   bg: 'rgba(196,160,90,0.15)',  color: GOLD,      border: 'rgba(196,160,90,0.3)'  },
              { label: 'In-House', count: departures.length, bg: 'rgba(16,185,129,0.12)',  color: '#065f46', border: 'rgba(16,185,129,0.25)' },
            ].map(chip => (
              <div key={chip.label} style={{
                flex: isMobile ? 1 : undefined,
                padding: isMobile ? '10px 12px' : '10px 16px',
                borderRadius: 10, textAlign: 'center',
                background: chip.bg, border: `1px solid ${chip.border}`,
              }}>
                <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: chip.color, fontWeight: 700, marginBottom: 3 }}>
                  {chip.label}
                </p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: isMobile ? '1.3rem' : '1.6rem', fontStyle: 'italic', fontWeight: 300, color: chip.color, lineHeight: 1 }}>
                  {chip.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter Tabs + Search ── */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? 10 : 12,
        marginBottom: isMobile ? 14 : 18,
      }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all',        label: `All (${relevant.length})` },
            { key: 'arrivals',   label: `Arrivals (${arrivals.length})` },
            { key: 'departures', label: `Departures (${departures.length})` },
          ].map(tab => {
            const active = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key as any)}
                style={{
                  padding: isMobile ? '6px 12px' : '7px 16px',
                  borderRadius: 999,
                  fontSize: isMobile ? 10 : 11, fontWeight: 600, fontFamily: 'Georgia, serif',
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: active ? DARK : SURFACE,
                  color: active ? '#f7f3ee' : MUTED,
                  border: active ? '1px solid rgba(196,160,90,0.3)' : `1px solid ${BORDER}`,
                  boxShadow: active ? '0 3px 10px rgba(26,22,18,0.18)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: isMobile ? '100%' : 340 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
          <input
            placeholder="Search guest, room, or ref…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', height: 40, paddingLeft: 36, paddingRight: 14,
              border: `1px solid ${BORDER}`, borderRadius: 10,
              background: SURFACE, fontSize: 13, color: TEXT,
              fontFamily: 'Georgia, serif', outline: 'none', transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        {/* Result count */}
        <span style={{ fontSize: 11, color: MUTED, flexShrink: 0 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Booking Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(booking => {
          const guest       = users.find(u => u.id === booking.userId);
          const room        = rooms.find(r => r.id === booking.roomId);
          const scfg        = statusConfig[booking.status] ?? statusConfig.pending;
          const isArrival   = booking.status === 'confirmed' || booking.status === 'pending';
          const isDeparture = booking.status === 'checked_in';

          return (
            <div
              key={booking.id}
              style={{
                background: SURFACE, borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                // Stack vertically on mobile
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,22,18,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
            >
              {/* Accent bar — left on desktop, top on mobile */}
              <div style={isMobile
                ? { height: 4, flexShrink: 0, background: scfg.dot, borderRadius: '14px 14px 0 0' }
                : { width: 4, flexShrink: 0, background: scfg.dot, borderRadius: '14px 0 0 14px' }
              } />

              {/* Room image — hidden on mobile */}
              {!isMobile && room && (
                <div style={{ width: 100, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                  />
                </div>
              )}

              {/* Guest / booking info */}
              <div style={{
                flex: 1, minWidth: 0,
                padding: isMobile ? '12px 14px 8px' : '14px 18px',
                display: 'flex', flexDirection: 'column',
                justifyContent: 'center', gap: 5,
              }}>
                {/* Guest name + pill */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: '#1a1612',
                    boxShadow: '0 1px 5px rgba(196,160,90,0.3)',
                  }}>
                    {guest?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: TEXT }}>
                    {guest?.name || 'Unknown Guest'}
                  </span>
                  <StatusPill status={booking.status} />
                </div>

                {/* Room + floor */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontSize: 12, color: MUTED }}>
                  <BedDouble size={11} />
                  <span style={{ fontWeight: 500, color: '#6b5d48', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 160 : 'none' }}>
                    {room?.name || '—'}
                  </span>
                  {room?.floor && <><span>·</span><span>Floor {room.floor}</span></>}
                </div>

                {/* Dates + guests */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, fontSize: 11, color: MUTED }}>
                  <Calendar size={10} />
                  <span>{booking.checkIn} → {booking.checkOut}</span>
                  <span>·</span>
                  <Users size={10} />
                  <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
                </div>

                {/* Booking ref — hide on mobile */}
                {!isMobile && (
                  <div style={{ fontSize: 10, color: 'rgba(138,125,110,0.55)', fontFamily: 'monospace' }}>
                    Ref: {booking.id.slice(0, 20)}…
                  </div>
                )}
              </div>

              {/* Action panel */}
              <div style={{
                padding: isMobile ? '10px 14px 12px' : '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                // On mobile: top border, full-width row; on desktop: left border
                borderTop: isMobile ? `1px solid ${BORDER}` : 'none',
                borderLeft: isMobile ? 'none' : `1px solid ${BORDER}`,
                flexShrink: 0,
                justifyContent: isMobile ? 'flex-end' : 'flex-start',
              }}>
                {isArrival && (
                  <button
                    onClick={() => handleCheckIn(booking.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: isMobile ? '9px 16px' : '9px 18px',
                      borderRadius: 9,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none', fontSize: 11, fontWeight: 700, color: '#fff',
                      cursor: 'pointer', fontFamily: 'Georgia, serif',
                      boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                      transition: 'opacity 0.2s, transform 0.2s',
                      whiteSpace: 'nowrap',
                      flex: isMobile ? 1 : undefined,
                      justifyContent: isMobile ? 'center' : undefined,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <LogIn size={13} />
                    Check In
                  </button>
                )}

                {isDeparture && (
                  <button
                    onClick={() => handleCheckOut(booking.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 7,
                      padding: isMobile ? '9px 16px' : '9px 18px',
                      borderRadius: 9,
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.35)',
                      fontSize: 11, fontWeight: 700, color: '#b45309',
                      cursor: 'pointer', fontFamily: 'Georgia, serif',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      flex: isMobile ? 1 : undefined,
                      justifyContent: isMobile ? 'center' : undefined,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.18)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; }}
                  >
                    <LogOut size={13} />
                    Check Out
                  </button>
                )}

                {!isMobile && <ChevronRight size={14} color={MUTED} style={{ flexShrink: 0 }} />}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14,
              background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <BedDouble size={22} color="rgba(196,160,90,0.45)" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No active bookings found</p>
            <p style={{ fontSize: 12, color: MUTED }}>Try adjusting your search or filter</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffFrontDesk;