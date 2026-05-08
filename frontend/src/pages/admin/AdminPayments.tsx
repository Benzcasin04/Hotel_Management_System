import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { logAuditAction } from './AdminSettings';
import { Payment, PaymentStatus } from '@/types/hotel';
import {
  DollarSign, Pencil, ArrowRight, Search,
  TrendingUp, Clock, RefreshCcw, CheckCircle2,
  ChevronDown, CreditCard, Banknote, X,
} from 'lucide-react';

// ── Design tokens — balanced warm palette ─────────────────
const GOLD    = '#c4a05a';
const BORDER  = 'rgba(196,160,90,0.15)';
const SURFACE = '#ffffff';
const TEXT    = '#1a1612';
const MUTED   = '#8a7d6e';
const CREAM   = '#faf8f4';
const DARK    = '#2c2418';

// ── Payment status config ──────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; border: string; dot: string; label: string }> = {
  unpaid:    { bg: 'rgba(239,68,68,0.1)',   color: '#991b1b', border: 'rgba(239,68,68,0.25)',  dot: '#ef4444', label: 'Unpaid'    },
  completed: { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', dot: '#10b981', label: 'Completed' },
  pending:   { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b', label: 'Pending'   },
  refunded:  { bg: 'rgba(138,125,110,0.1)', color: MUTED,     border: 'rgba(138,125,110,0.2)', dot: '#a8a29e', label: 'Refunded'  },
};

// ── Stat cards config ──────────────────────────────────────
const statMeta = [
  { key: 'revenue',   label: 'Total Revenue',  icon: TrendingUp,   gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.2)'  },
  { key: 'unpaid',    label: 'Unpaid',          icon: RefreshCcw,   gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.2)'   },
  { key: 'completed', label: 'Completed',       icon: CheckCircle2, gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.18)' },
  { key: 'pending',   label: 'Pending',         icon: Clock,        gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.2)'  },
  { key: 'refunded',  label: 'Refunded',        icon: RefreshCcw,   gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.2)'  },
];

// ── Method icon ────────────────────────────────────────────
const MethodIcon = ({ method }: { method: string }) => {
  const m = method?.toLowerCase();
  if (m?.includes('card') || m?.includes('credit')) return <CreditCard size={13} color={GOLD} />;
  if (m?.includes('cash'))                           return <Banknote size={13} color={GOLD} />;
  return <DollarSign size={13} color={GOLD} />;
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
      {cfg.label}
    </span>
  );
};

// ── Quick action button ────────────────────────────────────
const QuickBtn = ({
  label, icon: Icon, onClick,
  bg, color, border, hoverBg,
}: {
  label: string; icon: any; onClick: () => void;
  bg: string; color: string; border: string; hoverBg: string;
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '7px 14px', borderRadius: 8, fontSize: 10, fontWeight: 600,
      fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
      background: bg, color, border: `1px solid ${border}`,
      cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = hoverBg)}
    onMouseLeave={e => (e.currentTarget.style.background = bg)}
  >
    <Icon size={12} />
    {label}
  </button>
);

// ── Shared dialog input style ──────────────────────────────
const dialogInput: React.CSSProperties = {
  height: 42, borderRadius: 8,
  border: `1px solid ${BORDER}`, background: CREAM,
  fontFamily: 'Georgia, serif', fontSize: 13, color: TEXT,
  padding: '0 12px', outline: 'none', width: '100%',
  transition: 'border-color 0.2s',
};

const AdminPayments = () => {
  const { payments, bookings, rooms, users, updatePaymentStatus, adjustPaymentAmount, processRefund } = useHotel();
  const { createNotification } = useNotifications();
  const { toast } = useToast();

  const [dialogOpen,      setDialogOpen]      = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [adjustAmount,    setAdjustAmount]    = useState(0);
  const [adjustNote,      setAdjustNote]      = useState('');
  const [adjustStatus,    setAdjustStatus]    = useState<PaymentStatus>('completed');
  const [search,          setSearch]          = useState('');
  const [filterStatus,    setFilterStatus]    = useState<'All' | PaymentStatus>('All');
  const [expandedId,      setExpandedId]      = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────
  const totalRevenue   = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const unpaidCount    = payments.filter(p => p.status === 'unpaid').length;
  const completedCount = payments.filter(p => p.status === 'completed').length;
  const pendingCount   = payments.filter(p => p.status === 'pending').length;
  const refundedCount  = payments.filter(p => p.status === 'refunded').length;

  const statValues: Record<string, string | number> = {
    revenue:   `$${totalRevenue.toLocaleString()}`,
    unpaid:    unpaidCount,
    completed: completedCount,
    pending:   pendingCount,
    refunded:  refundedCount,
  };

  // ── Filtering ─────────────────────────────────────────
  const filtered = payments.filter(p => {
    const booking = bookings.find(b => b.id === p.bookingId);
    const user    = users.find(u => u.id === booking?.userId);
    const room    = rooms.find(r => r.id === booking?.roomId);
    const matchSearch = !search ||
      user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      room?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id.includes(search);
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Handlers ──────────────────────────────────────────
  const openAdjust = (payment: Payment) => {
    setSelectedPayment(payment);
    setAdjustAmount(payment.amount);
    setAdjustNote('');
    setAdjustStatus(payment.status);
    setDialogOpen(true);
  };

  const handleAdjust = async () => {
    if (!selectedPayment) return;
    try {
      await adjustPaymentAmount(selectedPayment.id, adjustAmount, adjustNote, 'admin');
      await updatePaymentStatus(selectedPayment.id, adjustStatus, adjustNote, 'admin');
      const booking = bookings.find(b => b.id === selectedPayment.bookingId);
      const room    = rooms.find(r => r.id === booking?.roomId);
      const user    = users.find(u => u.id === booking?.userId);
      logAuditAction('Adjusted Payment', `Payment #${selectedPayment.id.slice(0, 8)} - ${user?.name || 'Guest'}`, 'warning', `Amount adjusted to $${adjustAmount}, status changed to ${adjustStatus}`);
      if (booking?.userId) {
        await createNotification({ userId: booking.userId, title: 'Payment Adjusted', message: `Your payment for ${room?.name || 'Room'} has been adjusted to $${adjustAmount} with status: ${adjustStatus}. Note: ${adjustNote || 'No note provided'}`, type: 'payment', relatedId: selectedPayment.id, read: false });
      }
      toast({ title: 'Payment adjusted!' });
      setDialogOpen(false);
    } catch {
      toast({ title: 'Failed to adjust payment', variant: 'destructive' });
    }
  };

  const handleQuickStatus = async (paymentId: string, status: PaymentStatus) => {
    try {
      const payment = payments.find(p => p.id === paymentId);
      const booking = bookings.find(b => b.id === payment?.bookingId);
      const room    = rooms.find(r => r.id === booking?.roomId);
      const user    = users.find(u => u.id === booking?.userId);
      if (status === 'refunded') await processRefund(paymentId);
      else await updatePaymentStatus(paymentId, status, undefined, 'admin');
      logAuditAction(status === 'refunded' ? 'Processed Refund' : `Updated Payment to ${status}`, `Payment #${paymentId.slice(0, 8)} - ${user?.name || 'Guest'}`, status === 'refunded' ? 'warning' : 'success', `Payment status changed to ${status}`);
      if (booking?.userId) {
        const msgs: Record<string, { title: string; message: string }> = {
          completed: { title: 'Payment Confirmed', message: `Your payment of $${payment?.amount} for ${room?.name || 'Room'} has been confirmed.` },
          pending:   { title: 'Payment Pending',   message: `Your payment of $${payment?.amount} for ${room?.name || 'Room'} is now pending.` },
          refunded:  { title: 'Payment Refunded',  message: `Your payment of $${payment?.amount} for ${room?.name || 'Room'} has been refunded.` },
        };
        await createNotification({ userId: booking.userId, title: msgs[status]?.title || 'Payment Updated', message: msgs[status]?.message || `Payment status updated to ${status}.`, type: 'payment', relatedId: paymentId, read: false });
      }
      toast({ title: `Payment marked as ${status}` });
    } catch {
      toast({ title: 'Failed to update payment', variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT }}>

      {/* ── Page Header ── */}
      <div style={{
        background: DARK, borderRadius: 14, padding: 'clamp(18px,3vw,28px) clamp(20px,4vw,32px)',
        marginBottom: 22, position: 'relative', overflow: 'hidden',
        boxShadow: '0 5px 24px rgba(0,0,0,0.14)',
      }}>
        <div style={{ position: 'absolute', top: -35, right: -35, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Finance</span>
          </div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.5rem,3vw,1.9rem)', fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1 }}>
            Payment <em style={{ fontStyle: 'italic', color: GOLD }}>Management</em>
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.45)', marginTop: 4 }}>
            {payments.length} transaction{payments.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 12, marginBottom: 20,
      }}>
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
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 170, maxWidth: 340 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
          <input
            placeholder="Search guest, room, or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...dialogInput, paddingLeft: 34, height: 38 }}
            onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        {/* Status filter pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(['All', 'unpaid', 'completed', 'pending', 'refunded'] as const).map(s => {
            const cfg    = s !== 'All' ? statusConfig[s] : null;
            const active = filterStatus === s;
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
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
                {s === 'All' ? `All (${payments.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            );
          })}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: MUTED, flexShrink: 0 }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Payment List ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 && (
          <div style={{ padding: '60px 24px', textAlign: 'center', background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}` }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <DollarSign size={22} color="rgba(196,160,90,0.4)" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No transactions found</p>
            <p style={{ fontSize: 11, color: MUTED }}>Try adjusting your search or filter</p>
          </div>
        )}

        {filtered.map(payment => {
          const booking  = bookings.find(b => b.id === payment.bookingId);
          const user     = users.find(u => u.id === booking?.userId);
          const room     = rooms.find(r => r.id === booking?.roomId);
          const scfg     = statusConfig[payment.status] ?? statusConfig.pending;
          const isExpand = expandedId === payment.id;

          return (
            <div
              key={payment.id}
              style={{
                background: SURFACE, borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                transition: 'border-color 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; e.currentTarget.style.boxShadow = '0 5px 18px rgba(26,22,18,0.09)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
            >
              {/* Left status accent bar */}
              <div style={{ display: 'flex' }}>
                <div style={{ width: 4, flexShrink: 0, background: scfg.dot, borderRadius: '14px 0 0 0' }} />

                {/* Method icon area */}
                <div style={{
                  width: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(196,160,90,0.05)', borderRight: `1px solid ${BORDER}`,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #c4a05a, #d4b06a)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(196,160,90,0.3)' }}>
                    <MethodIcon method={payment.method} />
                  </div>
                </div>

                {/* Main info */}
                <div style={{ flex: 1, padding: '13px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: TEXT }}>{user?.name || 'Unknown'}</span>
                    <span style={{ fontSize: 12, color: MUTED }}>—</span>
                    <span style={{ fontSize: 12, color: '#6b5d48', fontWeight: 500 }}>{room?.name || '—'}</span>
                    <StatusPill status={payment.status} />
                  </div>
                  <div style={{ fontSize: 11, color: MUTED }}>
                    <span style={{ textTransform: 'capitalize' }}>{payment.method}</span>
                    <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 10 }}>#{payment.id.slice(0, 14)}…</span>
                    {payment.note && (
                      <>
                        <span style={{ margin: '0 6px', opacity: 0.4 }}>·</span>
                        <em style={{ color: GOLD, fontStyle: 'italic' }}>{payment.note}</em>
                      </>
                    )}
                  </div>
                </div>

                {/* Amount + expand */}
                <div style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `1px solid ${BORDER}`, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.35rem', fontStyle: 'italic', fontWeight: 300, color: TEXT, lineHeight: 1 }}>
                      ${payment.amount}
                    </div>
                    <div style={{ fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>amount</div>
                  </div>

                  <button
                    onClick={() => setExpandedId(isExpand ? null : payment.id)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 600,
                      fontFamily: 'Georgia, serif', cursor: 'pointer', transition: 'all 0.2s',
                      background: isExpand ? 'rgba(196,160,90,0.12)' : CREAM,
                      color: isExpand ? GOLD : MUTED,
                      border: `1px solid ${isExpand ? 'rgba(196,160,90,0.3)' : BORDER}`,
                      whiteSpace: 'nowrap', flexShrink: 0,
                    }}
                    onMouseEnter={e => { if (!isExpand) { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.3)'; e.currentTarget.style.color = GOLD; } }}
                    onMouseLeave={e => { if (!isExpand) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; } }}
                  >
                    Actions
                    <ChevronDown size={11} style={{ transform: isExpand ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                  </button>
                </div>
              </div>

              {/* ── Expanded actions row ── */}
              {isExpand && (
                <div style={{
                  borderTop: `1px solid rgba(196,160,90,0.12)`,
                  background: 'rgba(196,160,90,0.03)',
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8,
                }}>
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, marginRight: 4 }}>Quick actions:</span>

                  <QuickBtn
                    label="Mark Paid"    icon={CheckCircle2}
                    onClick={() => handleQuickStatus(payment.id, 'completed')}
                    bg="rgba(16,185,129,0.08)"  color="#059669" border="rgba(16,185,129,0.25)" hoverBg="rgba(16,185,129,0.15)"
                  />
                  <QuickBtn
                    label="Mark Unpaid"  icon={Clock}
                    onClick={() => handleQuickStatus(payment.id, 'pending')}
                    bg="rgba(245,158,11,0.08)"  color="#b45309" border="rgba(245,158,11,0.28)" hoverBg="rgba(245,158,11,0.15)"
                  />
                  <QuickBtn
                    label="Refund"       icon={RefreshCcw}
                    onClick={() => handleQuickStatus(payment.id, 'refunded')}
                    bg="rgba(138,125,110,0.08)" color={MUTED}   border="rgba(138,125,110,0.2)" hoverBg="rgba(138,125,110,0.15)"
                  />

                  <button
                    onClick={() => openAdjust(payment)}
                    style={{
                      marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '7px 16px', borderRadius: 8, fontSize: 10, fontWeight: 700,
                      fontFamily: 'Georgia, serif', cursor: 'pointer', transition: 'opacity 0.2s',
                      background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                      color: '#1a1612', border: 'none',
                      boxShadow: '0 2px 8px rgba(196,160,90,0.3)',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    <Pencil size={12} />
                    Adjust Payment
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Adjust Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={{
          background: '#fff', borderRadius: 16, border: 'none',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          maxWidth: 480, padding: 0,
          fontFamily: 'Georgia, serif',
        }}>
          {/* Dialog header */}
          <div style={{ background: DARK, padding: '20px 24px', borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, fontWeight: 700 }}>Edit Transaction</span>
                </div>
                <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.25rem', fontWeight: 300, color: '#f7f3ee', fontStyle: 'italic', margin: 0 }}>
                  {selectedPayment ? `Payment #${selectedPayment.id.slice(0, 14)}…` : 'Adjust Payment'}
                </h2>
              </div>
              <button
                onClick={() => setDialogOpen(false)}
                style={{ background: 'rgba(247,243,238,0.1)', border: '1px solid rgba(247,243,238,0.15)', borderRadius: 7, padding: 6, cursor: 'pointer', color: 'rgba(247,243,238,0.6)', display: 'flex', alignItems: 'center', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(247,243,238,0.1)'; e.currentTarget.style.color = 'rgba(247,243,238,0.6)'; }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Current payment summary */}
          {selectedPayment && (() => {
            const booking = bookings.find(b => b.id === selectedPayment.bookingId);
            const user    = users.find(u => u.id === booking?.userId);
            const room    = rooms.find(r => r.id === booking?.roomId);
            return (
              <div style={{
                margin: '18px 22px 0',
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(196,160,90,0.06)', border: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap',
              }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: TEXT, marginBottom: 2 }}>
                    {user?.name || 'Guest'} — {room?.name || 'Room'}
                  </p>
                  <p style={{ fontSize: 10, color: MUTED }}>
                    Current amount: <span style={{ color: GOLD, fontWeight: 700 }}>${selectedPayment.amount}</span>
                  </p>
                </div>
                <StatusPill status={selectedPayment.status} />
              </div>
            );
          })()}

          {/* Form */}
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Amount */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                New Amount ($)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: 'Georgia, serif', fontSize: 15, color: GOLD, fontStyle: 'italic' }}>$</span>
                <input
                  type="number" value={adjustAmount}
                  onChange={e => setAdjustAmount(parseFloat(e.target.value))}
                  style={{ ...dialogInput, paddingLeft: 28 }}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
              </div>
            </div>

            {/* Status */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                New Status
              </label>
              <Select value={adjustStatus} onValueChange={v => setAdjustStatus(v as PaymentStatus)}>
                <SelectTrigger style={{ ...dialogInput, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="focus:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                  {(['pending', 'completed', 'refunded'] as PaymentStatus[]).map(s => (
                    <SelectItem key={s} value={s} style={{ fontSize: 13, color: TEXT, fontFamily: 'Georgia, serif' }}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                Note <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(discount, surcharge, reason…)</span>
              </label>
              <Textarea
                value={adjustNote}
                onChange={e => setAdjustNote(e.target.value)}
                placeholder="Reason for adjustment…"
                rows={3}
                style={{ ...dialogInput, height: 'auto', resize: 'none', padding: '10px 12px', lineHeight: 1.7 }}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: BORDER }} />

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDialogOpen(false)}
                style={{ flex: 1, padding: '11px', borderRadius: 9, background: CREAM, border: `1px solid ${BORDER}`, fontSize: 11, fontWeight: 600, color: MUTED, cursor: 'pointer', fontFamily: 'Georgia, serif', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                Cancel
              </button>
              <button
                onClick={handleAdjust}
                style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '11px', borderRadius: 9,
                  background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                  border: 'none', fontSize: 11, fontWeight: 700, color: '#1a1612',
                  cursor: 'pointer', fontFamily: 'Georgia, serif',
                  boxShadow: '0 3px 12px rgba(196,160,90,0.32)', transition: 'opacity 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                Save Adjustment
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;