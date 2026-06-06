import { useState, useCallback } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { logAuditAction } from '@/pages/admin/AdminSettings';
import {
  Search, MessageSquarePlus, Eye, ArrowRight, X,
  Calendar, Users, CreditCard, BedDouble,
  FileText, CalendarCheck, Clock, DollarSign,
} from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────
const GOLD        = '#c4a05a';
const GOLD_LIGHT  = '#d4b06a';
const GOLD_PALE   = 'rgba(196,160,90,0.10)';
const GOLD_BORDER = 'rgba(196,160,90,0.22)';

const PAGE_BG     = '#f0ebe0';
const PANEL_BG    = '#faf7f1';
const DARK_BG     = '#1e1b14';
const DARK_MID    = '#272319';

const TEXT_DARK   = '#1e1b14';
const TEXT_WARM   = '#3d3526';
const TEXT_MUTED  = 'rgba(61,53,38,0.48)';
const TEXT_LIGHT  = '#f0ead6';
const TEXT_LIGHT_MUTED = 'rgba(184,173,150,0.55)';

const BORDER_LIGHT = 'rgba(61,53,38,0.10)';
const BORDER_DARK  = 'rgba(240,234,214,0.08)';
const DIVIDER      = 'rgba(196,160,90,0.15)';

const GUEST_NOTES_KEY = 'guest-notes-storage';

// ── Status + Payment styles ────────────────────────────────────
const STATUS_STYLES: Record<string, { color: string; bg: string; border: string; dot: string }> = {
  pending:     { color: '#c4913a', bg: 'rgba(196,145,58,0.09)',  border: 'rgba(196,145,58,0.32)',  dot: '#c4913a' },
  confirmed:   { color: GOLD,      bg: GOLD_PALE,                border: GOLD_BORDER,              dot: GOLD      },
  checked_in:  { color: '#4a9c6a', bg: 'rgba(74,156,106,0.09)', border: 'rgba(74,156,106,0.30)',  dot: '#4a9c6a' },
  checked_out: { color: TEXT_MUTED, bg: 'rgba(61,53,38,0.06)',  border: 'rgba(61,53,38,0.18)',    dot: TEXT_MUTED},
  cancelled:   { color: '#d97070', bg: 'rgba(217,112,112,0.08)', border: 'rgba(217,112,112,0.28)', dot: '#d97070' },
};

const PAYMENT_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  completed: { color: '#4a9c6a', bg: 'rgba(74,156,106,0.09)',  border: 'rgba(74,156,106,0.30)'  },
  pending:   { color: '#d97070', bg: 'rgba(217,112,112,0.08)', border: 'rgba(217,112,112,0.28)' },
  refunded:  { color: TEXT_MUTED, bg: 'rgba(61,53,38,0.06)',   border: 'rgba(61,53,38,0.18)'    },
};

// ── Helpers ────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const nightsBetween = (ci: string, co: string) =>
  Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));

// ── StatusPill ─────────────────────────────────────────────────
const StatusPill = ({
  label,
  styles,
}: {
  label: string;
  styles: { color: string; bg: string; border: string; dot?: string };
}) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em',
    padding: '4px 10px',
    border: `0.5px solid ${styles.border}`,
    backgroundColor: styles.bg, color: styles.color,
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  }}>
    {styles.dot && (
      <span style={{
        width: 5, height: 5, borderRadius: '50%',
        backgroundColor: styles.dot, display: 'block', flexShrink: 0,
      }} />
    )}
    {label.replace('_', ' ')}
  </span>
);

// ── Avatar ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#c4a05a', text: '#0c0b09' },
  { bg: '#4a7c6a', text: '#f0ead6' },
  { bg: '#7a5c3a', text: '#f0ead6' },
  { bg: '#5a6a8a', text: '#f0ead6' },
];
const getAvatar = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

// ── Component ──────────────────────────────────────────────────
const StaffReservations = () => {
  const { bookings, rooms, payments, users } = useHotel();
  const { user }  = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [noteDialog,   setNoteDialog]   = useState<string | null>(null);
  const [noteText,     setNoteText]     = useState('');
  const [detailDialog, setDetailDialog] = useState<string | null>(null);
  const [hoveredId,    setHoveredId]    = useState<string | null>(null);

  const [guestNotes, setGuestNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(GUEST_NOTES_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  // ── Stats ──────────────────────────────────────────────────
  const totalCount    = bookings.length;
  const pendingCount  = bookings.filter(b => b.status === 'pending').length;
  const checkedInCount= bookings.filter(b => b.status === 'checked_in').length;
  const revenue       = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  // ── Save note ───────────────────────────────────────────────
  const saveGuestNote = useCallback((bookingId: string, note: string) => {
    const updated = { ...guestNotes, [bookingId]: note };
    setGuestNotes(updated);
    localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(updated));
  }, [guestNotes]);

  const handleSaveNote = () => {
    if (!noteDialog) return;
    const booking = bookings.find(b => b.id === noteDialog);
    const guest   = users.find(u => u.id === booking?.userId);
    const room    = rooms.find(r => r.id === booking?.roomId);

    saveGuestNote(noteDialog, noteText.trim());

    logAuditAction(
      'Staff: Updated Guest Note',
      `${room?.name || 'Room'} - ${guest?.name || 'Guest'}`,
      'success',
      `Staff ${user?.name} ${noteText.trim() ? 'updated' : 'cleared'} note for booking ${noteDialog.slice(0, 8)}`,
    );

    toast({
      title: noteText.trim() ? 'Guest notes saved' : 'Guest notes cleared',
      description: noteText.trim()
        ? 'Notes saved to this reservation'
        : 'Notes have been removed',
    });

    createNotification({
      userId: null,
      title: 'Guest Note Added',
      message: `${user?.name || 'Staff'} added a note to ${guest?.name || 'Guest'}'s booking`,
      type: 'guest_note',
      relatedId: noteDialog,
      read: false,
    });

    setNoteDialog(null);
    setNoteText('');
  };

  // ── Filter ─────────────────────────────────────────────────
  const filtered = bookings.filter(b => {
    const guest = users.find(u => u.id === b.userId);
    const room  = rooms.find(r => r.id === b.roomId);
    const matchSearch =
      (guest?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (room?.name  || '').toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Detail data
  const detailBooking = detailDialog ? bookings.find(b => b.id === detailDialog) : null;
  const detailGuest   = detailBooking ? users.find(u => u.id === detailBooking.userId)    : null;
  const detailRoom    = detailBooking ? rooms.find(r => r.id === detailBooking.roomId)    : null;
  const detailPayment = detailBooking ? payments.find(p => p.bookingId === detailBooking.id) : null;

  // Shared dialog shell
  const dialogShell: React.CSSProperties = {
    backgroundColor: DARK_BG,
    border: `0.5px solid rgba(196,160,90,0.22)`,
    borderRadius: 0,
    padding: 0,
    maxWidth: 500,
    color: TEXT_LIGHT,
    fontFamily: "'Jost', 'DM Sans', sans-serif",
  };

  const DialogHeader = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      padding: '20px 28px', borderBottom: `0.5px solid ${BORDER_DARK}`,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
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

  // ── Render ─────────────────────────────────────────────────
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
              Staff Portal
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.02em',
            color: TEXT_DARK, lineHeight: 1.1, marginBottom: 6,
          }}>
            Guest{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>Reservations</span>
          </h1>
          <p style={{ fontSize: 12, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            View all reservations · Add guest notes
          </p>
        </div>
      </div>

      {/* ── Stats Strip ──────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1, marginBottom: 32,
        border: `0.5px solid ${BORDER_LIGHT}`,
        backgroundColor: BORDER_LIGHT, overflow: 'hidden',
      }}>
        {[
          { icon: <CalendarCheck style={{ width: 14, height: 14, color: GOLD }} />,        label: 'Total',      value: totalCount,     unit: 'bookings' },
          { icon: <Clock         style={{ width: 14, height: 14, color: '#c4913a' }} />,   label: 'Pending',    value: pendingCount,   unit: 'awaiting' },
          { icon: <BedDouble     style={{ width: 14, height: 14, color: '#4a9c6a' }} />,   label: 'Checked In', value: checkedInCount, unit: 'active'   },
          { icon: <DollarSign    style={{ width: 14, height: 14, color: GOLD }} />,        label: 'Revenue',    value: `$${revenue.toLocaleString()}`, unit: 'collected' },
        ].map(s => (
          <div key={s.label} style={{ backgroundColor: PANEL_BG, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              {s.icon}
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: TEXT_MUTED }}>
                {s.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '1.6rem', fontWeight: 300, color: TEXT_DARK, lineHeight: 1,
              }}>
                {s.value}
              </span>
              <span style={{ fontSize: 10, color: TEXT_MUTED }}>{s.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <Search style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', width: 13, height: 13, color: TEXT_MUTED,
          }} />
          <input
            placeholder="Search guest, room, or ref…"
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

        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { value: 'all',         label: 'All'         },
            { value: 'pending',     label: 'Pending'     },
            { value: 'confirmed',   label: 'Confirmed'   },
            { value: 'checked_in',  label: 'Checked In'  },
            { value: 'checked_out', label: 'Checked Out' },
            { value: 'cancelled',   label: 'Cancelled'   },
          ].map(opt => {
            const isActive = statusFilter === opt.value;
            const st = opt.value !== 'all' ? STATUS_STYLES[opt.value] : null;
            const col = st?.color || GOLD;
            const bdr = st?.border || GOLD_BORDER;
            const bg  = st?.bg || GOLD_PALE;
            return (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                style={{
                  padding: '6px 14px', fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.18em',
                  border: isActive ? `0.5px solid ${bdr}` : `0.5px solid ${BORDER_LIGHT}`,
                  backgroundColor: isActive ? bg : 'transparent',
                  color: isActive ? col : TEXT_MUTED,
                  cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = bdr;
                    e.currentTarget.style.color = col;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = BORDER_LIGHT;
                    e.currentTarget.style.color = TEXT_MUTED;
                  }
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Reservation List ─────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{
            padding: '64px 24px', textAlign: 'center',
            border: `0.5px solid ${BORDER_LIGHT}`, backgroundColor: PANEL_BG,
          }}>
            <CalendarCheck style={{ width: 24, height: 24, color: GOLD, margin: '0 auto 12px', opacity: 0.35 }} />
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.28em', color: TEXT_MUTED }}>
              No reservations found
            </p>
          </div>
        )}

        {filtered.map(booking => {
          // Use joined user data from booking if available, otherwise look up in users array
          const bookingUser = (booking as any).users;
          const guest = bookingUser?.name ? bookingUser : users.find(u => u.id === booking.userId);
          const room    = rooms.find(r => r.id === booking.roomId);
          const payment = payments.find(p => p.bookingId === booking.id);
          const ss      = STATUS_STYLES[booking.status]           ?? STATUS_STYLES.pending;
          const ps      = PAYMENT_STYLES[payment?.status || 'pending'] ?? PAYMENT_STYLES.pending;
          const isHover = hoveredId === booking.id;
          const av      = getAvatar(guest?.name || 'G');
          const nights  = nightsBetween(booking.checkIn, booking.checkOut);
          const hasNote = !!guestNotes[booking.id];

          return (
            <div
              key={booking.id}
              onMouseEnter={() => setHoveredId(booking.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                backgroundColor: PANEL_BG,
                border: `0.5px solid ${isHover ? GOLD_BORDER : BORDER_LIGHT}`,
                overflow: 'hidden',
                transition: 'border-color 0.25s, box-shadow 0.25s',
                boxShadow: isHover
                  ? '0 6px 28px rgba(196,160,90,0.07)'
                  : '0 1px 8px rgba(30,27,20,0.04)',
              }}
            >
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 18, padding: '16px 22px', flexWrap: 'wrap',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: av.bg, color: av.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: '1.05rem', fontWeight: 400,
                  border: `0.5px solid rgba(196,160,90,0.22)`,
                }}>
                  {(guest?.name || 'G').charAt(0).toUpperCase()}
                </div>

                {/* Guest + booking info */}
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK }}>
                      {guest?.name || 'Unknown Guest'}
                    </span>
                    <StatusPill label={booking.status} styles={ss} />
                    <StatusPill label={payment?.status || 'pending'} styles={{ ...ps, dot: ps.color }} />
                    {hasNote && (
                      <span style={{
                        fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em',
                        padding: '2px 7px',
                        border: `0.5px solid ${GOLD_BORDER}`,
                        backgroundColor: GOLD_PALE, color: GOLD,
                      }}>
                        Note
                      </span>
                    )}
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontSize: 12, color: TEXT_WARM, marginBottom: 3, flexWrap: 'wrap',
                  }}>
                    <BedDouble style={{ width: 11, height: 11, color: GOLD }} />
                    <span>{room?.name || '—'}</span>
                    {room?.tier && (
                      <span style={{ fontSize: 10, color: TEXT_MUTED }}>· {room.tier}</span>
                    )}
                    <span style={{ color: TEXT_MUTED }}>·</span>
                    <Calendar style={{ width: 11, height: 11, color: TEXT_MUTED }} />
                    <span style={{ color: TEXT_MUTED, fontSize: 11 }}>
                      {fmtDate(booking.checkIn)} → {fmtDate(booking.checkOut)}
                      <span style={{ marginLeft: 4 }}>· {nights}n</span>
                    </span>
                    <span style={{ color: TEXT_MUTED }}>·</span>
                    <Users style={{ width: 11, height: 11, color: TEXT_MUTED }} />
                    <span style={{ color: TEXT_MUTED, fontSize: 11 }}>{booking.guests}</span>
                  </div>

                  {/* Note preview */}
                  {hasNote && (
                    <p style={{
                      fontSize: 11, color: GOLD, fontStyle: 'italic',
                      marginTop: 2, letterSpacing: '0.02em',
                    }}>
                      "{guestNotes[booking.id]}"
                    </p>
                  )}

                  {/* Ref */}
                  <p style={{
                    fontSize: 10, color: 'rgba(61,53,38,0.28)',
                    letterSpacing: '0.03em', fontFamily: 'monospace', marginTop: 3,
                  }}>
                    Ref: {booking.id.slice(0, 28)}…
                  </p>
                </div>

                {/* Amount + actions */}
                <div style={{
                  flexShrink: 0, display: 'flex',
                  flexDirection: 'column', alignItems: 'flex-end', gap: 10,
                }}>
                  {/* Amount */}
                  {payment?.amount !== undefined && (
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontFamily: 'Georgia, serif', fontStyle: 'italic',
                        fontSize: '1.3rem', fontWeight: 300, color: TEXT_DARK,
                      }}>
                        ${payment.amount.toLocaleString()}
                      </span>
                      <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.18em', color: TEXT_MUTED }}>
                        {payment.method || 'cash'}
                      </div>
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    {/* View */}
                    <button
                      onClick={() => setDetailDialog(booking.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', fontSize: 9,
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
                      <Eye style={{ width: 11, height: 11 }} /> View
                    </button>

                    {/* Notes */}
                    <button
                      onClick={() => { setNoteDialog(booking.id); setNoteText(guestNotes[booking.id] || ''); }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', fontSize: 9,
                        textTransform: 'uppercase', letterSpacing: '0.16em',
                        border: hasNote ? `0.5px solid ${GOLD_BORDER}` : `0.5px solid ${BORDER_LIGHT}`,
                        backgroundColor: hasNote ? GOLD_PALE : 'transparent',
                        color: hasNote ? GOLD : TEXT_MUTED,
                        cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = GOLD_BORDER;
                        e.currentTarget.style.color = GOLD;
                        e.currentTarget.style.backgroundColor = GOLD_PALE;
                      }}
                      onMouseLeave={e => {
                        if (!hasNote) {
                          e.currentTarget.style.borderColor = BORDER_LIGHT;
                          e.currentTarget.style.color = TEXT_MUTED;
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <MessageSquarePlus style={{ width: 11, height: 11 }} />
                      {hasNote ? 'Edit Note' : 'Add Note'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ════════════════════════════════════════════
          GUEST NOTES DIALOG
          ════════════════════════════════════════ */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent style={{ ...dialogShell, maxWidth: 460 }}>
          <DialogTitle className="sr-only">Add Guest Note</DialogTitle>
          <DialogHeader eyebrow="Staff Note" title="Add Guest Note" />
          {noteDialog && (() => {
            const booking = bookings.find(b => b.id === noteDialog);
            const guest   = users.find(u => u.id === booking?.userId);
            const room    = rooms.find(r => r.id === booking?.roomId);
            return (
              <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Context mini card */}
                <div style={{
                  padding: '12px 16px',
                  border: `0.5px solid ${BORDER_DARK}`,
                  backgroundColor: 'rgba(196,160,90,0.04)',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    backgroundColor: getAvatar(guest?.name || 'G').bg,
                    color: getAvatar(guest?.name || 'G').text,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '0.9rem',
                    flexShrink: 0,
                  }}>
                    {(guest?.name || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: TEXT_LIGHT, fontWeight: 500 }}>{guest?.name}</div>
                    <div style={{ fontSize: 10, color: TEXT_LIGHT_MUTED }}>{room?.name}</div>
                  </div>
                </div>

                {/* Textarea */}
                <div>
                  <label style={{
                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em',
                    color: TEXT_LIGHT_MUTED, display: 'block', marginBottom: 8,
                  }}>
                    Note
                  </label>
                  <Textarea
                    placeholder="Late checkout, special requests, allergies, VIP preferences…"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={4}
                    style={{
                      backgroundColor: 'rgba(196,160,90,0.04)',
                      border: `0.5px solid ${BORDER_DARK}`,
                      borderRadius: 0, color: TEXT_LIGHT,
                      fontSize: 13, lineHeight: 1.7,
                      resize: 'none', fontFamily: 'inherit', outline: 'none',
                      width: '100%', padding: '10px 12px',
                    }}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[rgba(184,173,150,0.25)]"
                  />
                  <div style={{ fontSize: 10, color: TEXT_LIGHT_MUTED, marginTop: 4, textAlign: 'right' }}>
                    {noteText.length} chars
                  </div>
                </div>

                <div style={{ height: '0.5px', backgroundColor: BORDER_DARK }} />

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10 }}>
                  <button
                    onClick={() => setNoteDialog(null)}
                    style={{
                      padding: '12px', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: '0.2em',
                      border: `0.5px solid ${BORDER_DARK}`,
                      backgroundColor: 'transparent', color: TEXT_LIGHT_MUTED,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_BORDER; e.currentTarget.style.color = TEXT_LIGHT; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_DARK; e.currentTarget.style.color = TEXT_LIGHT_MUTED; }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '12px', fontSize: 10,
                      textTransform: 'uppercase', letterSpacing: '0.22em',
                      fontWeight: 700, backgroundColor: GOLD,
                      border: 'none', color: '#0c0b09',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = GOLD)}
                  >
                    Save Note <ArrowRight style={{ width: 12, height: 12 }} />
                  </button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════
          DETAIL DIALOG
          ════════════════════════════════════════ */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent style={{ ...dialogShell, maxWidth: 500 }}>
          <DialogTitle className="sr-only">Booking Detail</DialogTitle>
          <DialogHeader eyebrow="Reservation" title="Booking Detail" />
          {detailBooking && (
            <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Room image header */}
              {detailRoom?.images?.[0] && (
                <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
                  <img
                    src={detailRoom.images[0]} alt={detailRoom.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(18,15,8,0.85) 0%, transparent 55%)' }} />
                  <div style={{ position: 'absolute', bottom: 12, left: 16 }}>
                    <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em', color: GOLD, marginBottom: 2 }}>
                      {detailRoom.tier}
                    </div>
                    <div style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.1rem', color: TEXT_LIGHT }}>
                      {detailRoom.name}
                    </div>
                  </div>
                </div>
              )}

              {/* Guest + status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {detailGuest && (() => {
                    const av = getAvatar(detailGuest.name || 'G');
                    return (
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%',
                        backgroundColor: av.bg, color: av.text,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1rem',
                        flexShrink: 0,
                      }}>
                        {(detailGuest.name || 'G').charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                  <div>
                    <div style={{ fontSize: 13, color: TEXT_LIGHT, fontWeight: 500 }}>{detailGuest?.name}</div>
                    <div style={{ fontSize: 11, color: TEXT_LIGHT_MUTED }}>{detailGuest?.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <StatusPill label={detailBooking.status}                    styles={STATUS_STYLES[detailBooking.status] ?? STATUS_STYLES.pending} />
                  <StatusPill label={detailPayment?.status || 'pending'}       styles={{ ...(PAYMENT_STYLES[detailPayment?.status || 'pending'] ?? PAYMENT_STYLES.pending), dot: (PAYMENT_STYLES[detailPayment?.status || 'pending'] ?? PAYMENT_STYLES.pending).color }} />
                </div>
              </div>

              {/* Info grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {[
                  { icon: <Calendar   style={{ width: 12, height: 12, color: GOLD }} />, label: 'Check-in',  value: fmtDate(detailBooking.checkIn)  },
                  { icon: <Calendar   style={{ width: 12, height: 12, color: GOLD }} />, label: 'Check-out', value: fmtDate(detailBooking.checkOut) },
                  { icon: <Users      style={{ width: 12, height: 12, color: GOLD }} />, label: 'Guests',    value: `${detailBooking.guests} guest${detailBooking.guests !== 1 ? 's' : ''}` },
                  { icon: <CreditCard style={{ width: 12, height: 12, color: GOLD }} />, label: 'Amount',    value: detailPayment ? `$${detailPayment.amount} · ${detailPayment.method}` : '—' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '11px 13px',
                    border: `0.5px solid ${BORDER_DARK}`,
                    backgroundColor: 'rgba(196,160,90,0.04)',
                    display: 'flex', alignItems: 'flex-start', gap: 9,
                  }}>
                    <div style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</div>
                    <div>
                      <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em', color: TEXT_LIGHT_MUTED, marginBottom: 3 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: TEXT_LIGHT, fontWeight: 500 }}>
                        {item.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guest notes */}
              {guestNotes[detailBooking.id] && (
                <div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: GOLD, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FileText style={{ width: 10, height: 10 }} /> Staff Note
                  </div>
                  <p style={{
                    fontSize: 12, color: TEXT_LIGHT_MUTED, lineHeight: 1.75,
                    fontFamily: 'Georgia, serif', fontStyle: 'italic',
                    padding: '11px 13px',
                    border: `0.5px solid ${BORDER_DARK}`,
                    backgroundColor: 'rgba(196,160,90,0.03)',
                  }}>
                    {guestNotes[detailBooking.id]}
                  </p>
                </div>
              )}

              {/* Ref */}
              <div style={{ fontSize: 9, color: 'rgba(184,173,150,0.28)', fontFamily: 'monospace', letterSpacing: '0.03em' }}>
                Ref: {detailBooking.id}
              </div>

              <div style={{ height: '0.5px', backgroundColor: BORDER_DARK }} />

              {/* Close */}
              <button
                onClick={() => setDetailDialog(null)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  backgroundColor: GOLD, padding: '13px',
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em',
                  fontWeight: 700, color: '#0c0b09', border: 'none',
                  cursor: 'pointer', width: '100%', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = GOLD)}
              >
                Close
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffReservations;