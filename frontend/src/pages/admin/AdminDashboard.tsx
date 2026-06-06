import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { BedDouble, CalendarCheck, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';

// ── Design tokens ──────────────────────────────────────────
const GOLD         = '#c4a05a';
const GOLD_DIM     = 'rgba(196,160,90,0.12)';
const SURFACE      = '#ffffff';
const PAGE_BG      = '#f7f3ee';
const BORDER       = 'rgba(196,160,90,0.15)';
const DARK_SECTION = '#2c2418';
const TEXT         = '#1a1612';
const MUTED        = '#8a7d6e';
const MUTED_LIGHT  = 'rgba(247,243,238,0.45)';

const statConfig = [
  { icon: BedDouble,     label: 'Total Rooms',    gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.2)' },
  { icon: CalendarCheck, label: 'Total Bookings', gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.2)' },
  { icon: DollarSign,    label: 'Revenue',        gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.2)' },
  { icon: Users,         label: 'Users',          gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', glow: 'rgba(139,92,246,0.2)' },
  { icon: TrendingUp,    label: 'Occupancy',      gradient: 'linear-gradient(135deg,#ec4899,#db2777)', glow: 'rgba(236,72,153,0.2)' },
  { icon: AlertCircle,   label: 'Unpaid',         gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)', glow: 'rgba(14,165,233,0.2)' },
];

// ── Responsive hook ────────────────────────────────────────
const useBreakpoint = () => {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
    width,
  };
};

// ── Reusable Panel ─────────────────────────────────────────
const Panel = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <div style={{
    background: SURFACE,
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: '22px 24px',
    boxShadow: '0 2px 12px rgba(26,22,18,0.06)',
    display: 'flex',
    flexDirection: 'column',
    ...style,
  }}>
    {children}
  </div>
);

// ── Eyebrow ────────────────────────────────────────────────
const Eyebrow = ({ label }: { label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
    <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
    <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, fontWeight: 700 }}>
      {label}
    </span>
  </div>
);

// ── Status Pill ────────────────────────────────────────────
const Pill = ({ label, variant }: { label: string; variant: 'gold' | 'green' | 'amber' | 'red' | 'muted' }) => {
  const map = {
    gold:  { bg: 'rgba(196,160,90,0.12)', color: '#b8860b',  border: 'rgba(196,160,90,0.3)' },
    green: { bg: 'rgba(16,185,129,0.1)',  color: '#059669',  border: 'rgba(16,185,129,0.25)' },
    amber: { bg: 'rgba(245,158,11,0.1)',  color: '#b45309',  border: 'rgba(245,158,11,0.25)' },
    red:   { bg: 'rgba(239,68,68,0.1)',   color: '#dc2626',  border: 'rgba(239,68,68,0.25)' },
    muted: { bg: 'rgba(138,125,110,0.1)', color: MUTED,      border: 'rgba(138,125,110,0.2)' },
  };
  const s = map[variant];
  return (
    <span style={{
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
      padding: '3px 10px', borderRadius: 999,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap', fontFamily: 'Georgia, serif',
    }}>
      {label}
    </span>
  );
};

const statusVariant = (status: string): 'gold' | 'green' | 'amber' | 'red' | 'muted' => {
  if (status === 'confirmed')  return 'gold';
  if (status === 'checked_in') return 'green';
  if (status === 'pending')    return 'amber';
  if (status === 'cancelled')  return 'red';
  return 'muted';
};

const PIE_BOOKING_COLORS = ['#c4a05a', '#10b981', '#f59e0b', '#ef4444'];
const PIE_PAYMENT_COLORS = ['#10b981', '#ef4444', '#8a7d6e'];

const AdminDashboard = () => {
  const { rooms, bookings, payments, users } = useHotel();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const stats = [
    { value: rooms.length,    sub: `${rooms.filter(r => r.isActive).length} active` },
    { value: bookings.length, sub: `${bookings.filter(b => b.status === 'pending').length} pending` },
    { value: `$${payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0).toLocaleString()}`, sub: 'from paid bookings' },
    { value: users.length,    sub: `${users.filter(u => u.role?.toLowerCase() === 'admin').length} admin, ${users.filter(u => u.role?.toLowerCase() === 'staff').length} staff` },
    { value: `${Math.round((bookings.filter(b => b.status === 'checked_in').length / Math.max(rooms.filter(r => r.isActive).length, 1)) * 100)}%`, sub: 'current occupancy' },
    { value: payments.filter(p => p.status === 'pending').length, sub: 'awaiting payment' },
  ];

  const tierRevenue = rooms.reduce((acc, room) => {
    const roomBookings = bookings.filter(b => b.roomId === room.id);
    const revenue = roomBookings.reduce((s, b) => s + b.totalAmount, 0);
    const existing = acc.find(a => a.tier === room.tier);
    if (existing) { existing.revenue += revenue; existing.bookings += roomBookings.length; }
    else acc.push({ tier: room.tier, revenue, bookings: roomBookings.length });
    return acc;
  }, [] as { tier: string; revenue: number; bookings: number }[]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // On mobile show abbreviated months
    const labels = isMobile
      ? ['J','F','M','A','M','J','J','A','S','O','N','D']
      : months;
    const data = labels.map(month => ({ month, revenue: 0, bookings: 0 }));
    bookings.forEach(booking => {
      const idx = new Date(booking.createdAt).getMonth();
      data[idx].bookings += 1;
      const pmt = payments.find(p => p.bookingId === booking.id && p.status === 'completed');
      if (pmt) data[idx].revenue += pmt.amount;
    });
    return data;
  }, [bookings, payments, isMobile]);

  const statusData = [
    { name: 'Confirmed',  value: bookings.filter(b => b.status === 'confirmed').length,  fill: PIE_BOOKING_COLORS[0] },
    { name: 'Checked In', value: bookings.filter(b => b.status === 'checked_in').length, fill: PIE_BOOKING_COLORS[1] },
    { name: 'Pending',    value: bookings.filter(b => b.status === 'pending').length,    fill: PIE_BOOKING_COLORS[2] },
    { name: 'Cancelled',  value: bookings.filter(b => b.status === 'cancelled').length,  fill: PIE_BOOKING_COLORS[3] },
  ].filter(d => d.value > 0);

  const paymentStatusData = [
    { name: 'Paid',     value: payments.filter(p => p.status === 'completed').length, fill: PIE_PAYMENT_COLORS[0] },
    { name: 'Pending',  value: payments.filter(p => p.status === 'pending').length,   fill: PIE_PAYMENT_COLORS[1] },
    { name: 'Refunded', value: payments.filter(p => p.status === 'refunded').length,  fill: PIE_PAYMENT_COLORS[2] },
  ].filter(d => d.value > 0);

  const revenueConfig:     ChartConfig = { revenue:  { label: 'Revenue ($)', color: GOLD } };
  const tierCfg:           ChartConfig = { revenue:  { label: 'Revenue ($)', color: GOLD }, bookings: { label: 'Bookings', color: MUTED } };
  const bookingLineConfig: ChartConfig = { bookings: { label: 'Bookings', color: '#6366f1' } };

  const axisStyle = { fill: MUTED, fontSize: 10, fontFamily: 'Georgia, serif' };
  const gridStyle = { stroke: 'rgba(196,160,90,0.1)', strokeDasharray: '3 3' };

  // ── Responsive grid helpers ────────────────────────────
  // Stats: 2 cols mobile → 3 cols tablet → 6 cols desktop
  const statsGridCols = isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)';

  // Charts row 1: stacked mobile → 2 cols tablet+
  const charts1Cols = isMobile ? '1fr' : '1fr 1fr';

  // Charts row 2: stacked mobile → 2 cols tablet → 3 cols desktop
  const charts2Cols = isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr';

  // Bottom panels: stacked mobile → 2 cols tablet+
  const bottomCols = isMobile ? '1fr' : '1fr 1fr';

  // Chart height: shorter on mobile
  const chartH = isMobile ? 'h-[180px]' : 'h-[220px]';

  // Pie radii: smaller on mobile
  const pieOuter = isMobile ? 60 : 80;
  const pieInner = isMobile ? 24 : 35;

  return (
    <div
      className="animate-fade-in"
      style={{ color: TEXT, fontFamily: 'Georgia, serif', background: PAGE_BG }}
    >
      {/* ── Page Header ── */}
      <div style={{
        marginBottom: isMobile ? 16 : 28,
        padding: isMobile ? '18px 16px' : '24px 28px',
        background: DARK_SECTION,
        borderRadius: 12,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ display: 'block', height: 1, width: 18, background: GOLD }} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>
              Admin Panel
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: isMobile ? '1.4rem' : '1.9rem',
            fontWeight: 300, letterSpacing: '-0.02em', color: '#f7f3ee',
          }}>
            Dashboard{' '}
            <em style={{ fontStyle: 'italic', color: GOLD }}>Overview</em>
          </h1>
          <p style={{ fontSize: 12, color: MUTED_LIGHT, marginTop: 5 }}>Welcome to the admin panel</p>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{
        display: 'grid',
        gap: isMobile ? 10 : 14,
        gridTemplateColumns: statsGridCols,
        marginBottom: isMobile ? 14 : 22,
      }}>
        {stats.map((s, i) => {
          const cfg = statConfig[i];
          return (
            <div
              key={i}
              style={{
                background: SURFACE, borderRadius: 12,
                padding: isMobile ? '14px 12px' : '18px 16px',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${cfg.glow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.gradient, borderRadius: '12px 12px 0 0' }} />
              <div style={{
                width: isMobile ? 28 : 34, height: isMobile ? 28 : 34,
                borderRadius: 9, marginBottom: isMobile ? 10 : 14, marginTop: 4,
                background: cfg.gradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 3px 10px ${cfg.glow}`,
              }}>
                <cfg.icon size={isMobile ? 12 : 15} color="#fff" />
              </div>
              <div style={{
                fontFamily: 'Georgia, serif',
                fontSize: isMobile ? '1.2rem' : '1.6rem',
                fontStyle: 'italic', fontWeight: 300, color: TEXT, lineHeight: 1, marginBottom: 4,
                // Allow value to truncate on very small screens
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {s.value}
              </div>
              <div style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', color: GOLD, fontWeight: 700, marginBottom: 2 }}>
                {cfg.label}
              </div>
              <div style={{ fontSize: 9, color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.sub}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row 1: Revenue & Booking trend ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: charts1Cols, marginBottom: 16 }}>
        <Panel>
          <Eyebrow label="Monthly Revenue" />
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: TEXT, marginBottom: 16 }}>
            Revenue <span style={{ color: GOLD }}>Trend</span>
          </h3>
          <ChartContainer config={revenueConfig} className={`${chartH} w-full`}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: GOLD_DIM }} />
              <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Panel>

        <Panel>
          <Eyebrow label="Booking Trend" />
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: TEXT, marginBottom: 16 }}>
            Bookings <span style={{ color: '#6366f1' }}>Over Time</span>
          </h3>
          <ChartContainer config={bookingLineConfig} className={`${chartH} w-full`}>
            <LineChart data={monthlyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ stroke: '#6366f1', strokeWidth: 1 }} />
              <Line
                type="monotone" dataKey="bookings" stroke="#6366f1" strokeWidth={2}
                dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ fill: '#6366f1', r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ChartContainer>
        </Panel>
      </div>

      {/* ── Charts Row 2: Tier / Status / Payments ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: charts2Cols, marginBottom: 16, alignItems: 'stretch' }}>
        <Panel>
          <Eyebrow label="Room Tier" />
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: TEXT, marginBottom: 16 }}>
            Revenue by <span style={{ color: GOLD }}>Tier</span>
          </h3>
          <ChartContainer config={tierCfg} className={`${chartH} w-full`}>
            <BarChart data={tierRevenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="tier" tick={{ ...axisStyle, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: GOLD_DIM }} />
              <Bar dataKey="revenue" fill={GOLD} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          {/* Spacer to match pie chart legend height */}
          <div style={{ minHeight: 28, marginTop: 8 }} />
        </Panel>

        <Panel>
          <Eyebrow label="Bookings" />
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: TEXT, marginBottom: 16 }}>
            Status <span style={{ color: GOLD }}>Breakdown</span>
          </h3>
          <ChartContainer config={{ status: { label: 'Status' } }} className={`${chartH} w-full`}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie
                data={statusData} dataKey="value" nameKey="name"
                cx="50%" cy="50%"
                outerRadius={pieOuter} innerRadius={pieInner}
                label={({ value }) => `${value}`} labelLine={false}
              >
                {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', marginTop: 8 }}>
            {statusData.map((d, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.fill, display: 'inline-block', flexShrink: 0 }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Panel>

        {/* Payment Status panel - aligned with other charts */}
        <Panel>
          <Eyebrow label="Payments" />
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: TEXT, marginBottom: 16 }}>
            Payment <span style={{ color: '#10b981' }}>Status</span>
          </h3>
          <ChartContainer config={{ payment: { label: 'Payments' } }} className={`${chartH} w-full`}>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
              <Pie
                data={paymentStatusData} dataKey="value" nameKey="name"
                cx="50%" cy="50%"
                outerRadius={pieOuter} innerRadius={pieInner}
                label={({ value }) => `${value}`} labelLine={false}
              >
                {paymentStatusData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="transparent" />)}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 12px', marginTop: 8 }}>
            {paymentStatusData.map((d, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: d.fill, display: 'inline-block', flexShrink: 0 }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </Panel>
      </div>

      {/* ── Recent Bookings + Room Status ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: bottomCols }}>
        <Panel>
          <Eyebrow label="Activity" />
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: TEXT, marginBottom: 16 }}>
            Recent <span style={{ color: GOLD }}>Bookings</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bookings.slice(0, 5).map(b => {
              const u = users.find(u => u.id === b.userId);
              const r = rooms.find(r => r.id === b.roomId);
              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8,
                    background: '#faf8f4', borderRadius: 8, padding: '10px 14px',
                    border: `1px solid ${BORDER}`,
                    transition: 'background 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = 'rgba(196,160,90,0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#faf8f4'; e.currentTarget.style.borderColor = BORDER; }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u?.name}{' '}
                      <span style={{ color: MUTED, fontWeight: 400 }}>— {r?.name}</span>
                    </div>
                    <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.04em' }}>
                      {b.checkIn} → {b.checkOut}
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <Pill label={b.status.replace('_', ' ')} variant={statusVariant(b.status)} />
                  </div>
                </div>
              );
            })}
            {bookings.length === 0 && (
              <div style={{ background: '#faf8f4', borderRadius: 8, padding: '24px', textAlign: 'center', fontSize: 12, color: MUTED }}>
                No bookings yet
              </div>
            )}
          </div>
        </Panel>

        <Panel>
          <Eyebrow label="Inventory" />
          <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '1rem', fontWeight: 300, fontStyle: 'italic', color: TEXT, marginBottom: 16 }}>
            Room <span style={{ color: GOLD }}>Status</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rooms.slice(0, 5).map(r => (
              <div
                key={r.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 8,
                  background: '#faf8f4', borderRadius: 8, padding: '10px 14px',
                  border: `1px solid ${BORDER}`,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fff7ed'; e.currentTarget.style.borderColor = 'rgba(196,160,90,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#faf8f4'; e.currentTarget.style.borderColor = BORDER; }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: TEXT, fontWeight: 600, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 10, color: MUTED, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.tier} · Floor {r.floor} · ${r.pricePerNight}/night
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <Pill label={r.isActive ? 'Active' : 'Inactive'} variant={r.isActive ? 'green' : 'red'} />
                </div>
              </div>
            ))}
            {rooms.length === 0 && (
              <div style={{ background: '#faf8f4', borderRadius: 8, padding: '24px', textAlign: 'center', fontSize: 12, color: MUTED }}>
                No rooms yet
              </div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default AdminDashboard;