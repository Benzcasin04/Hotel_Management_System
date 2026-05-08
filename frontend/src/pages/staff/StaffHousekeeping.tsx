import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { RoomCondition } from '@/types/hotel';
import { logAuditAction } from '@/pages/admin/AdminSettings';
import { Sparkles, AlertTriangle, Wrench, BedDouble, Building2, Users } from 'lucide-react';

// ── Design tokens — balanced warm palette ─────────────────
const GOLD    = '#c4a05a';
const BORDER  = 'rgba(196,160,90,0.15)';
const SURFACE = '#ffffff';
const TEXT    = '#1a1612';
const MUTED   = '#8a7d6e';
const CREAM   = '#faf8f4';
const DARK    = '#2c2418';

// ── Condition config ───────────────────────────────────────
const conditionConfig: Record<RoomCondition, {
  bg: string; color: string; border: string; dot: string;
  activeBg: string; gradient: string; glow: string; label: string;
  icon: React.ReactNode;
}> = {
  clean: {
    bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', dot: '#10b981',
    activeBg: 'rgba(16,185,129,0.14)', gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.25)',
    label: 'Clean',       icon: <Sparkles size={12} />,
  },
  dirty: {
    bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b',
    activeBg: 'rgba(245,158,11,0.14)', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.25)',
    label: 'Dirty',       icon: <AlertTriangle size={12} />,
  },
  maintenance: {
    bg: 'rgba(239,68,68,0.09)', color: '#991b1b', border: 'rgba(239,68,68,0.25)',  dot: '#ef4444',
    activeBg: 'rgba(239,68,68,0.12)', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.22)',
    label: 'Maintenance', icon: <Wrench size={12} />,
  },
};

// ── Tier badge styles ──────────────────────────────────────
const tierConfig: Record<string, { bg: string; color: string; border: string; barColor: string }> = {
  Basic:        { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', barColor: '#3B82F6' },
  Standard:     { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', barColor: '#10B981' },
  Deluxe:       { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', barColor: '#F59E0B' },
  Suite:        { bg: '#F5F3FF', color: '#5B21B6', border: '#DDD6FE', barColor: '#8B5CF6' },
  Presidential: { bg: '#FFF0F6', color: '#9D174D', border: '#FBCFE8', barColor: '#EC4899' },
};

const StaffHousekeeping = () => {
  const { rooms, updateRoomCondition } = useHotel();
  const { user }  = useAuth();
  const { toast } = useToast();
  const { createNotification } = useNotifications();
  const [filter, setFilter]         = useState<string>('all');
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const counts = {
    clean:       rooms.filter(r => r.condition === 'clean').length,
    dirty:       rooms.filter(r => r.condition === 'dirty').length,
    maintenance: rooms.filter(r => r.condition === 'maintenance').length,
  };

  const filtered = rooms.filter(r => filter === 'all' || r.condition === filter);

  const handleConditionChange = async (roomId: string, condition: RoomCondition) => {
    const room = rooms.find(r => r.id === roomId);
    setUpdatingId(roomId);
    try {
      await updateRoomCondition(roomId, condition);
      logAuditAction(
        `Staff: Room ${condition.charAt(0).toUpperCase() + condition.slice(1)}`,
        room?.name || roomId,
        condition === 'clean' ? 'success' : condition === 'dirty' ? 'warning' : 'error',
        `Staff ${user?.name} marked ${room?.name} as ${condition}`,
      );
      toast({ title: `Room marked as ${condition}` });
      createNotification({
        userId: null,
        title: `Room ${conditionConfig[condition].label}`,
        message: `${room?.name || 'Room'} marked as ${condition} by ${user?.name || 'Staff'}`,
        type: 'system',
        relatedId: `ADMIN_ONLY:${roomId}`,
        read: false,
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT }}>

      {/* ── Page Header ── */}
      <div style={{
        background: DARK, borderRadius: 14, padding: '24px 28px',
        marginBottom: 22, position: 'relative', overflow: 'hidden',
        boxShadow: '0 5px 24px rgba(0,0,0,0.14)',
      }}>
        <div style={{ position: 'absolute', top: -35, right: -35, width: 130, height: 130, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '35%', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Staff Portal</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.85rem', fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1 }}>
              House<em style={{ fontStyle: 'italic', color: GOLD }}>keeping</em>
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.45)', marginTop: 4 }}>
              Room status board — update room conditions
            </p>
          </div>

          {/* Header stat chips */}
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { key: 'clean',       val: counts.clean,       color: '#065f46', border: 'rgba(16,185,129,0.3)',  bg: 'rgba(16,185,129,0.12)',  label: 'Clean'       },
              { key: 'dirty',       val: counts.dirty,       color: '#b45309', border: 'rgba(245,158,11,0.3)',  bg: 'rgba(245,158,11,0.12)',  label: 'Dirty'       },
              { key: 'maintenance', val: counts.maintenance, color: '#991b1b', border: 'rgba(239,68,68,0.25)',  bg: 'rgba(239,68,68,0.1)',    label: 'Maintenance' },
            ].map(chip => (
              <div
                key={chip.key}
                onClick={() => setFilter(filter === chip.key ? 'all' : chip.key)}
                style={{
                  padding: '9px 14px', borderRadius: 10, textAlign: 'center', cursor: 'pointer',
                  background: filter === chip.key ? chip.bg : 'rgba(247,243,238,0.06)',
                  border: `1px solid ${filter === chip.key ? chip.border : 'rgba(247,243,238,0.12)'}`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (filter !== chip.key) e.currentTarget.style.background = 'rgba(247,243,238,0.1)'; }}
                onMouseLeave={e => { if (filter !== chip.key) e.currentTarget.style.background = 'rgba(247,243,238,0.06)'; }}
              >
                <p style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em', color: filter === chip.key ? chip.color : 'rgba(247,243,238,0.5)', fontWeight: 700, marginBottom: 3 }}>{chip.label}</p>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontStyle: 'italic', fontWeight: 300, color: filter === chip.key ? chip.color : GOLD, lineHeight: 1 }}>{chip.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Clickable Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { key: 'clean',       label: 'Clean Rooms',    icon: Sparkles,      gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.2)'  },
          { key: 'dirty',       label: 'Needs Cleaning', icon: AlertTriangle, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.2)'  },
          { key: 'maintenance', label: 'Maintenance',    icon: Wrench,        gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.2)'   },
        ].map(stat => {
          const cfg    = conditionConfig[stat.key as RoomCondition];
          const isActive = filter === stat.key;
          return (
            <div
              key={stat.key}
              onClick={() => setFilter(filter === stat.key ? 'all' : stat.key)}
              style={{
                background: SURFACE, borderRadius: 12, padding: '16px 18px',
                border: isActive ? `1px solid ${cfg.border}` : `1px solid ${BORDER}`,
                boxShadow: isActive ? `0 4px 16px ${stat.glow}` : '0 2px 10px rgba(26,22,18,0.05)',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'all 0.22s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 18px ${stat.glow}`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isActive ? `0 4px 16px ${stat.glow}` : '0 2px 10px rgba(26,22,18,0.05)'; }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: stat.gradient, borderRadius: '12px 12px 0 0' }} />
              <div style={{ width: 32, height: 32, borderRadius: 9, background: stat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, marginTop: 4, boxShadow: `0 2px 8px ${stat.glow}` }}>
                <stat.icon size={15} color="#fff" />
              </div>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontStyle: 'italic', fontWeight: 300, color: TEXT, lineHeight: 1, marginBottom: 3 }}>
                {counts[stat.key as keyof typeof counts]}
              </div>
              <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, fontWeight: 700 }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Filter Pills ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: MUTED, marginRight: 2 }}>Filter:</span>
        {[
          { value: 'all',         label: `All (${rooms.length})` },
          { value: 'clean',       label: `Clean (${counts.clean})` },
          { value: 'dirty',       label: `Dirty (${counts.dirty})` },
          { value: 'maintenance', label: `Maintenance (${counts.maintenance})` },
        ].map(opt => {
          const active = filter === opt.value;
          const cfg    = opt.value !== 'all' ? conditionConfig[opt.value as RoomCondition] : null;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              style={{
                padding: '6px 14px', borderRadius: 999,
                fontSize: 11, fontWeight: 600, fontFamily: 'Georgia, serif',
                cursor: 'pointer', transition: 'all 0.2s',
                background: active ? (cfg ? cfg.activeBg : DARK) : SURFACE,
                color: active ? (cfg ? cfg.color : '#f7f3ee') : MUTED,
                border: active ? `1px solid ${cfg ? cfg.border : 'rgba(44,36,24,0.4)'}` : `1px solid ${BORDER}`,
                boxShadow: active ? (cfg ? `0 2px 8px ${cfg.glow}` : '0 3px 10px rgba(26,22,18,0.18)') : 'none',
              }}
            >
              {opt.label}
            </button>
          );
        })}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: MUTED }}>
          {filtered.length} room{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Room Grid ── */}
      {filtered.length === 0 ? (
        <div style={{
          padding: '60px 24px', textAlign: 'center',
          background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`,
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BedDouble size={22} color="rgba(196,160,90,0.45)" />
          </div>
          <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No rooms found</p>
          <p style={{ fontSize: 11, color: MUTED }}>Try a different filter</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {filtered.map(room => {
            const ccfg    = conditionConfig[room.condition] ?? conditionConfig.clean;
            const tcfg    = tierConfig[room.tier] ?? tierConfig.Standard;
            const isHover = hoveredId === room.id;
            const isUpd   = updatingId === room.id;

            return (
              <div
                key={room.id}
                onMouseEnter={() => setHoveredId(room.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  background: SURFACE, borderRadius: 14, overflow: 'hidden',
                  border: isHover ? `1px solid rgba(196,160,90,0.4)` : `1px solid ${BORDER}`,
                  boxShadow: isHover ? '0 8px 28px rgba(26,22,18,0.11)' : '0 2px 10px rgba(26,22,18,0.05)',
                  transition: 'all 0.28s',
                  opacity: isUpd ? 0.7 : 1,
                  transform: isHover ? 'translateY(-3px)' : 'translateY(0)',
                }}
              >
                {/* Tier accent bar */}
                <div style={{ height: 4, background: tcfg.barColor, borderRadius: '14px 14px 0 0' }} />

                {/* Room image */}
                <div style={{ position: 'relative', height: 150, overflow: 'hidden' }}>
                  {room.images?.[0] ? (
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      style={{
                        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                        transform: isHover ? 'scale(1.05)' : 'scale(1)',
                        transition: 'transform 0.6s ease',
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'rgba(196,160,90,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BedDouble size={28} color="rgba(196,160,90,0.35)" />
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,22,18,0.75) 0%, transparent 55%)' }} />

                  {/* Tier badge — top left */}
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700,
                    padding: '3px 9px', borderRadius: 999,
                    background: tcfg.bg, color: tcfg.color, border: `1px solid ${tcfg.border}`,
                  }}>
                    {room.tier}
                  </div>

                  {/* Condition badge — top right */}
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
                    padding: '3px 9px', borderRadius: 999,
                    background: ccfg.bg, color: ccfg.color, border: `1px solid ${ccfg.border}`,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: ccfg.dot }} />
                    {ccfg.label}
                  </div>

                  {/* Room name + price — bottom */}
                  <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <p style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.05rem', fontWeight: 300, color: '#f7f3ee', lineHeight: 1 }}>
                      {room.name}
                    </p>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.05rem', fontStyle: 'italic', fontWeight: 300, color: '#f7f3ee', lineHeight: 1 }}>${room.pricePerNight}</p>
                      <p style={{ fontSize: 8, color: 'rgba(247,243,238,0.58)' }}>/night</p>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div style={{ padding: '14px 16px 16px' }}>
                  {/* Meta chips */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${BORDER}`, flexWrap: 'wrap' }}>
                    {[
                      { icon: Building2, label: `Floor ${room.floor}` },
                      { icon: Users,     label: `${room.capacity} guests` },
                      { icon: BedDouble, label: room.isActive ? 'Active' : 'Inactive' },
                    ].map(m => (
                      <span key={m.label} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontSize: 10, color: MUTED,
                        padding: '3px 8px', borderRadius: 6, background: CREAM, border: `1px solid ${BORDER}`,
                      }}>
                        <m.icon size={10} color={GOLD} />
                        {m.label}
                      </span>
                    ))}
                  </div>

                  {/* Condition buttons */}
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, marginBottom: 8, fontWeight: 700 }}>
                    Set Condition
                  </p>
                  <div style={{ display: 'flex', gap: 7 }}>
                    {(['clean', 'dirty', 'maintenance'] as RoomCondition[]).map(cond => {
                      const c         = conditionConfig[cond];
                      const isCurrent = room.condition === cond;
                      return (
                        <button
                          key={cond}
                          onClick={() => !isCurrent && !isUpd && handleConditionChange(room.id, cond)}
                          disabled={isCurrent || isUpd}
                          style={{
                            flex: 1,
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '8px 0', fontSize: 9,
                            textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: isCurrent ? 700 : 500,
                            borderRadius: 8,
                            border: isCurrent ? `1px solid ${c.border}` : `1px solid ${BORDER}`,
                            background: isCurrent ? c.activeBg : CREAM,
                            color: isCurrent ? c.color : MUTED,
                            cursor: isCurrent || isUpd ? 'not-allowed' : 'pointer',
                            transition: 'all 0.18s',
                            fontFamily: 'Georgia, serif',
                            boxShadow: isCurrent ? `0 2px 6px ${c.glow}` : 'none',
                          }}
                          onMouseEnter={e => {
                            if (!isCurrent && !isUpd) {
                              e.currentTarget.style.borderColor = c.border;
                              e.currentTarget.style.color = c.color;
                              e.currentTarget.style.background = c.bg;
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isCurrent) {
                              e.currentTarget.style.borderColor = BORDER;
                              e.currentTarget.style.color = MUTED;
                              e.currentTarget.style.background = CREAM;
                            }
                          }}
                        >
                          {cond === 'clean'       && <Sparkles size={11} />}
                          {cond === 'dirty'       && <AlertTriangle size={11} />}
                          {cond === 'maintenance' && <Wrench size={11} />}
                          {c.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Updating indicator */}
                  {isUpd && (
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: GOLD }}>
                      <div style={{ width: 12, height: 12, border: `1.5px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      Updating…
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default StaffHousekeeping;