import { useState, useEffect } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { logAuditAction } from './AdminSettings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Booking, BookingStatus } from '@/types/hotel';
import { Search, Trash2, Users, Calendar, CreditCard, FileText, BedDouble, ChevronRight } from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────
const GOLD     = '#c4a05a';
const BORDER   = 'rgba(196,160,90,0.15)';
const SURFACE  = '#ffffff';
const PAGE_BG  = '#f7f3ee';
const DARK_HDR = '#2c2418';
const TEXT     = '#1a1612';
const MUTED    = '#8a7d6e';

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

// ── Status config ──────────────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  pending:     { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  confirmed:   { bg: 'rgba(196,160,90,0.12)', color: '#92660a', border: 'rgba(196,160,90,0.3)',  dot: '#c4a05a' },
  checked_in:  { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  checked_out: { bg: 'rgba(138,125,110,0.1)', color: MUTED,     border: 'rgba(138,125,110,0.2)', dot: '#a8a29e' },
  cancelled:   { bg: 'rgba(239,68,68,0.1)',   color: '#991b1b', border: 'rgba(239,68,68,0.25)',  dot: '#ef4444' },
};

const paymentConfig: Record<string, { bg: string; color: string; border: string }> = {
  unpaid:   { bg: 'rgba(239,68,68,0.1)',   color: '#991b1b', border: 'rgba(239,68,68,0.25)'  },
  paid:     { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)' },
  refunded: { bg: 'rgba(138,125,110,0.1)', color: MUTED,     border: 'rgba(138,125,110,0.2)' },
};

const STATUS_TABS = [
  { value: 'all',         label: 'All' },
  { value: 'pending',     label: 'Pending' },
  { value: 'confirmed',   label: 'Confirmed' },
  { value: 'checked_in',  label: 'Checked In' },
  { value: 'checked_out', label: 'Checked Out' },
  { value: 'cancelled',   label: 'Cancelled' },
];

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
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status.replace('_', ' ')}
    </span>
  );
};

// ── Payment Pill ───────────────────────────────────────────
const PaymentPill = ({ status }: { status: string }) => {
  const cfg = paymentConfig[status] ?? paymentConfig.unpaid;
  return (
    <span style={{
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', fontFamily: 'Georgia, serif',
    }}>
      {status}
    </span>
  );
};

// ── Info Tile ──────────────────────────────────────────────
const InfoTile = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 10,
    background: '#faf8f4', border: `1px solid ${BORDER}`,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
      background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon size={16} color="#1a1612" />
    </div>
    <div style={{ minWidth: 0 }}>
      <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: GOLD, marginTop: 1 }}>{sub}</p>}
    </div>
  </div>
);

const AdminBookings = () => {
  const { bookings, rooms, users, updateBookingStatus, updateBookingForStaff, cancelBooking, deleteBookingPermanently, getRoomById } = useHotel();
  const { createNotification } = useNotifications();
  const { toast } = useToast();
  const { isMobile, isTablet } = useBreakpoint();

  const [search, setSearch]                       = useState('');
  const [statusFilter, setStatusFilter]           = useState<string>('all');
  const [selectedBooking, setSelectedBooking]     = useState<Booking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen]   = useState(false);
  const [bookingToDelete, setBookingToDelete]     = useState<Booking | null>(null);

  const filtered = bookings.filter(b => {
    const user = users.find(u => u.id === b.userId);
    const room = rooms.find(r => r.id === b.roomId);
    const matchSearch =
      (user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (room?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = STATUS_TABS.reduce((acc, t) => {
    acc[t.value] = t.value === 'all' ? bookings.length : bookings.filter(b => b.status === t.value).length;
    return acc;
  }, {} as Record<string, number>);

  const handleStatusChange = async (bookingId: string, status: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (status === 'cancelled') await cancelBooking(bookingId);
      else await updateBookingForStaff(bookingId, status as BookingStatus);
      const room = rooms.find(r => r.id === booking?.roomId);
      const user = users.find(u => u.id === booking?.userId);
      logAuditAction(
        status === 'cancelled' ? 'Cancelled Booking' : `Updated Booking to ${status}`,
        `${room?.name || 'Room'} - ${user?.name || 'Guest'}`,
        status === 'cancelled' ? 'warning' : 'success',
        `Booking ${bookingId.slice(0, 8)} status changed to ${status}`
      );
      if (booking?.userId) {
        const statusMessages: Record<string, { title: string; message: string }> = {
          confirmed:   { title: 'Booking Confirmed',  message: `Your booking for ${room?.name || 'Room'} has been confirmed.` },
          checked_in:  { title: 'Checked In',         message: `You have successfully checked in to ${room?.name || 'Room'}.` },
          checked_out: { title: 'Checked Out',        message: `You have successfully checked out from ${room?.name || 'Room'}.` },
          cancelled:   { title: 'Booking Cancelled',  message: `Your booking for ${room?.name || 'Room'} has been cancelled.` },
        };
        const notif = statusMessages[status] || { title: 'Booking Updated', message: `Your booking for ${room?.name || 'Room'} status has been updated to ${status}.` };
        await createNotification({ userId: booking.userId, title: notif.title, message: notif.message, type: 'booking', relatedId: bookingId, read: false });
      }
      toast({ title: `Booking status updated to ${status}` });
    } catch {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const openDetails = (booking: Booking) => { setSelectedBooking(booking); setDetailsDialogOpen(true); };
  const openDeleteDialog = (e: React.MouseEvent, booking: Booking) => { e.stopPropagation(); setBookingToDelete(booking); setDeleteDialogOpen(true); };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      await deleteBookingPermanently(bookingToDelete.id);
      const room = rooms.find(r => r.id === bookingToDelete.roomId);
      const user = users.find(u => u.id === bookingToDelete.userId);
      logAuditAction('Deleted Booking', `${room?.name || 'Room'} - ${user?.name || 'Guest'}`, 'warning', `Booking ${bookingToDelete.id.slice(0, 8)} permanently deleted`);
      toast({ title: 'Booking permanently deleted' });
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    } catch {
      toast({ title: 'Failed to delete booking', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT }}>

      {/* ── Page Header ── */}
      <div style={{
        background: DARK_HDR, borderRadius: 12,
        padding: isMobile ? '16px' : '22px 26px',
        marginBottom: isMobile ? 16 : 24,
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ display: 'block', height: 1, width: 18, background: GOLD }} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Admin Panel</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: isMobile ? '1.4rem' : '1.9rem', fontWeight: 300, letterSpacing: '-0.02em', color: '#f7f3ee' }}>
            Booking <em style={{ fontStyle: 'italic', color: GOLD }}>Management</em>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.45)', marginTop: 4 }}>
            {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* ── Status Tabs ── */}
      <div style={{
        display: 'flex', gap: 6, flexWrap: 'wrap',
        marginBottom: isMobile ? 12 : 16,
      }}>
        {STATUS_TABS.map(tab => {
          const active = statusFilter === tab.value;
          const cfg = tab.value !== 'all' ? statusConfig[tab.value] : null;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: isMobile ? '5px 10px' : '6px 14px',
                borderRadius: 999,
                fontSize: isMobile ? 10 : 11, fontWeight: 600, fontFamily: 'Georgia, serif',
                cursor: 'pointer', transition: 'all 0.2s',
                background: active
                  ? (cfg ? cfg.bg : 'linear-gradient(135deg,#c4a05a,#d4b06a)')
                  : SURFACE,
                color: active ? (cfg ? cfg.color : '#1a1612') : MUTED,
                boxShadow: active ? `0 2px 8px ${cfg ? cfg.border : 'rgba(196,160,90,0.3)'}` : 'none',
                border: active
                  ? `1px solid ${cfg ? cfg.border : 'rgba(196,160,90,0.4)'}`
                  : `1px solid ${BORDER}`,
              }}
            >
              {cfg && active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />}
              {tab.label}
              <span style={{
                fontSize: 9, padding: '1px 6px', borderRadius: 999,
                background: active ? 'rgba(255,255,255,0.25)' : 'rgba(196,160,90,0.1)',
                color: active ? (cfg ? cfg.color : '#1a1612') : MUTED,
              }}>
                {counts[tab.value]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div style={{
        background: SURFACE, borderRadius: 10,
        padding: isMobile ? '10px 12px' : '12px 16px',
        border: `1px solid ${BORDER}`,
        marginBottom: isMobile ? 14 : 20,
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 1px 6px rgba(26,22,18,0.05)',
      }}>
        <Search size={15} color={MUTED} style={{ flexShrink: 0 }} />
        <input
          placeholder={isMobile ? 'Search bookings…' : 'Search by guest name, room, or booking reference…'}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, border: 'none', outline: 'none', fontSize: 13,
            color: TEXT, background: 'transparent', fontFamily: 'Georgia, serif',
            minWidth: 0,
          }}
        />
        {search && (
          <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            ×
          </button>
        )}
        <span style={{ fontSize: 10, color: MUTED, paddingLeft: 8, borderLeft: `1px solid ${BORDER}`, flexShrink: 0 }}>
          {filtered.length}
        </span>
      </div>

      {/* ── Bookings List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(booking => {
          const user = users.find(u => u.id === booking.userId);
          const room = rooms.find(r => r.id === booking.roomId);
          const scfg = statusConfig[booking.status] ?? statusConfig.pending;

          return (
            <div
              key={booking.id}
              onClick={() => openDetails(booking)}
              style={{
                background: SURFACE, borderRadius: 12, overflow: 'hidden',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                cursor: 'pointer', transition: 'all 0.25s',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26,22,18,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
            >
              {/* Mobile: top accent bar / Desktop: left accent bar */}
              <div style={isMobile
                ? { height: 4, flexShrink: 0, background: scfg.dot, borderRadius: '12px 12px 0 0' }
                : { width: 4, flexShrink: 0, background: scfg.dot, borderRadius: '12px 0 0 12px' }
              } />

              {/* Room image — hidden on mobile to save space */}
              {!isMobile && room && (
                <div style={{ position: 'relative', width: 100, flexShrink: 0, overflow: 'hidden' }}>
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(255,255,255,0.1))' }} />
                </div>
              )}

              {/* Main info */}
              <div style={{
                flex: 1, minWidth: 0,
                padding: isMobile ? '12px 14px 8px' : '14px 18px',
                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, color: TEXT }}>{user?.name}</span>
                  <StatusPill status={booking.status} />
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap',
                  gap: isMobile ? '4px 8px' : 6,
                  fontSize: isMobile ? 11 : 12, color: MUTED,
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BedDouble size={11} />
                    <span style={{ fontWeight: 500, color: '#6b5d48', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? 120 : 'none' }}>
                      {room?.name}
                    </span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={11} />
                    <span>{booking.checkIn} → {booking.checkOut}</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Users size={11} />
                    <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
                  </span>
                </div>
                {!isMobile && (
                  <div style={{ fontSize: 10, color: 'rgba(138,125,110,0.6)', fontFamily: 'monospace' }}>
                    Ref: {booking.id.slice(0, 18)}…
                  </div>
                )}
              </div>

              {/* Amount + controls */}
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  padding: isMobile ? '10px 14px 12px' : '14px 16px',
                  display: 'flex', alignItems: 'center',
                  gap: isMobile ? 8 : 10,
                  borderTop: isMobile ? `1px solid ${BORDER}` : 'none',
                  borderLeft: isMobile ? 'none' : `1px solid ${BORDER}`,
                  flexShrink: 0,
                  justifyContent: isMobile ? 'space-between' : 'flex-start',
                }}
              >
                <div style={{ textAlign: isMobile ? 'left' : 'right', marginRight: isMobile ? 0 : 4 }}>
                  <div style={{ fontFamily: 'Georgia, serif', fontSize: isMobile ? '1rem' : '1.2rem', fontStyle: 'italic', fontWeight: 300, color: TEXT }}>
                    ${booking.totalAmount}
                  </div>
                  <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>total</div>
                </div>

                {/* On mobile, show a narrower select */}
                <Select value={booking.status} onValueChange={v => handleStatusChange(booking.id, v)}>
                  <SelectTrigger style={{
                    width: isMobile ? 120 : 140, height: 36, borderRadius: 8,
                    border: `1px solid ${BORDER}`, background: '#faf8f4',
                    fontSize: isMobile ? 10 : 11, color: TEXT, fontFamily: 'Georgia, serif',
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="checked_in">Check In</SelectItem>
                    <SelectItem value="checked_out">Check Out</SelectItem>
                    <SelectItem value="cancelled">Cancel</SelectItem>
                  </SelectContent>
                </Select>

                <button
                  onClick={e => openDeleteDialog(e, booking)}
                  style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                >
                  <Trash2 size={13} color="#dc2626" />
                </button>

                {!isMobile && <ChevronRight size={14} color={MUTED} style={{ flexShrink: 0 }} />}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            padding: '60px 24px', textAlign: 'center',
            background: SURFACE, borderRadius: 12, border: `1px solid ${BORDER}`,
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Calendar size={22} color="rgba(196,160,90,0.5)" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No bookings found</p>
            <p style={{ fontSize: 12, color: MUTED }}>Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* ── BOOKING DETAILS DIALOG ── */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          style={{
            borderRadius: isMobile ? '16px 16px 0 0' : 16,
            border: 'none',
            boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
            padding: 0,
            fontFamily: 'Georgia, serif',
            // On mobile anchor to bottom of screen like a sheet
            ...(isMobile ? {
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              margin: 0,
              maxWidth: '100%',
              width: '100%',
              maxHeight: '92vh',
            } : {}),
          }}
        >
          {/* Dialog header */}
          <div style={{ background: DARK_HDR, padding: isMobile ? '16px' : '20px 24px', borderRadius: isMobile ? '16px 16px 0 0' : '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, fontWeight: 700 }}>Booking Details</span>
            </div>
            <DialogTitle style={{ fontFamily: 'Georgia, serif', fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: 300, color: '#f7f3ee' }}>
              Reservation <em style={{ color: GOLD, fontStyle: 'italic' }}>Overview</em>
            </DialogTitle>
          </div>

          {selectedBooking && (() => {
            const room = getRoomById(selectedBooking.roomId);
            const user = users.find(u => u.id === selectedBooking.userId);
            return (
              <div style={{ padding: isMobile ? '16px' : '24px', display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 20 }}>

                {/* Guest strip */}
                <div style={{
                  display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 10 : 14,
                  padding: '14px 16px', borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(196,160,90,0.08), rgba(196,160,90,0.03))',
                  border: `1px solid ${BORDER}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: isMobile ? '100%' : 'auto' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: '#1a1612', flexShrink: 0,
                    }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Guest'}</p>
                      <p style={{ fontSize: 12, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginLeft: isMobile ? 0 : 'auto' }}>
                    <StatusPill status={selectedBooking.status} />
                    <PaymentPill status={selectedBooking.paymentStatus} />
                  </div>
                </div>

                {/* Room info */}
                {room && (
                  <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #c4a05a, #d4b06a)' }} />
                    <img src={room.images[0]} alt={room.name} style={{ width: '100%', height: isMobile ? 140 : 180, objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: isMobile ? '12px' : '14px 16px', background: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                        <div style={{ minWidth: 0 }}>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{room.name}</h3>
                          <p style={{ fontSize: 11, color: MUTED }}>{room.tier} Room · Floor {room.floor}</p>
                        </div>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 300, color: GOLD, flexShrink: 0 }}>
                          ${room.pricePerNight}<span style={{ fontSize: 10, color: MUTED }}>/night</span>
                        </span>
                      </div>
                      {!isMobile && <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7, marginBottom: 10 }}>{room.description}</p>}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {room.amenities.map((a, i) => (
                          <span key={i} style={{
                            fontSize: 9, padding: '3px 9px', borderRadius: 999,
                            background: 'rgba(196,160,90,0.1)', color: '#92660a',
                            border: '1px solid rgba(196,160,90,0.25)', fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                          }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking info tiles — 1 col on mobile, 2 col on larger */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 8 : 10 }}>
                  <InfoTile icon={Calendar} label="Check-in" value={selectedBooking.checkIn} sub={selectedBooking.checkInTime} />
                  <InfoTile icon={Calendar} label="Check-out" value={selectedBooking.checkOut} sub={selectedBooking.checkOutTime} />
                  <InfoTile icon={Users} label="Guests" value={`${selectedBooking.guests} guest${selectedBooking.guests !== 1 ? 's' : ''}`} />
                  <InfoTile icon={CreditCard} label="Payment Method" value={selectedBooking.paymentMethod.replace('_', ' ')} />
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div style={{ padding: '14px 16px', borderRadius: 10, background: '#faf8f4', border: `1px solid ${BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <FileText size={13} color={GOLD} />
                      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: GOLD, fontWeight: 700 }}>Notes</span>
                    </div>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Reference + Total */}
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', flexShrink: 0 }}>Booking Reference</span>
                    <span style={{ fontSize: isMobile ? 9 : 11, fontFamily: 'monospace', color: TEXT, wordBreak: 'break-all', textAlign: 'right' }}>
                      {selectedBooking.id}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: isMobile ? '10px 14px' : '12px 16px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #2c2418, #1a1612)',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(247,243,238,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total Amount</span>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: isMobile ? '1.4rem' : '1.75rem', fontStyle: 'italic', fontWeight: 300, color: GOLD }}>
                      ${selectedBooking.totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ padding: isMobile ? '0 16px 20px' : '0 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setDetailsDialogOpen(false)}
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: '#faf8f4', border: `1px solid ${BORDER}`,
                fontSize: 12, fontWeight: 600, color: TEXT, cursor: 'pointer',
                fontFamily: 'Georgia, serif', transition: 'all 0.2s',
                width: isMobile ? '100%' : 'auto',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#faf8f4'; e.currentTarget.style.borderColor = BORDER; }}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent style={{
          maxWidth: isMobile ? '100%' : 420,
          width: isMobile ? '100%' : undefined,
          borderRadius: isMobile ? '16px 16px 0 0' : 14,
          border: 'none',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
          padding: 0,
          fontFamily: 'Georgia, serif',
          ...(isMobile ? {
            position: 'fixed', bottom: 0, left: 0, right: 0, margin: 0,
          } : {}),
        }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Trash2 size={15} color="#dc2626" />
            </div>
            <div>
              <DialogTitle style={{ fontSize: 15, fontWeight: 700, color: '#dc2626', fontFamily: 'Georgia, serif', margin: 0 }}>
                Delete Booking
              </DialogTitle>
              <p style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>This action cannot be undone</p>
            </div>
          </div>

          <div style={{ padding: '18px 22px' }}>
            <DialogDescription style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, marginBottom: 16 }}>
              Are you sure you want to permanently delete this booking? This will remove it from the database completely.
            </DialogDescription>

            {bookingToDelete && (
              <div style={{ background: '#faf8f4', borderRadius: 10, padding: '12px 14px', border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { label: 'Booking ID', value: bookingToDelete.id.slice(0, 18) + '…' },
                  { label: 'Guest', value: users.find(u => u.id === bookingToDelete.userId)?.name || '—' },
                  { label: 'Room', value: rooms.find(r => r.id === bookingToDelete.roomId)?.name || '—' },
                  { label: 'Amount', value: `$${bookingToDelete.totalAmount}` },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em', flexShrink: 0 }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ padding: '0 22px 20px', display: 'flex', gap: 10 }}>
            <button
              onClick={() => setDeleteDialogOpen(false)}
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: '#faf8f4', border: `1px solid ${BORDER}`,
                fontSize: 12, fontWeight: 600, color: TEXT, cursor: 'pointer',
                fontFamily: 'Georgia, serif',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteBooking}
              style={{
                flex: 1, padding: '10px', borderRadius: 8,
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                border: 'none', fontSize: 12, fontWeight: 700, color: '#fff',
                cursor: 'pointer', fontFamily: 'Georgia, serif',
                boxShadow: '0 2px 8px rgba(220,38,38,0.3)',
              }}
            >
              Delete Permanently
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;