import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { logAuditAction } from './AdminSettings';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { RoomTier, Room } from '@/types/hotel';
import { Plus, Pencil, Trash2, Search, ArrowRight, BedDouble, Users, Layers, Star, Wifi, Tv, Coffee, Wind } from 'lucide-react';
import roomStandard from '@/assets/room-standard.jpg';
import roomLuxury from '@/assets/room-luxury.jpg';
import roomSuite from '@/assets/room-suite.jpg';
import roomPresidential from '@/assets/room-presidential.jpg';

const roomBasic = 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80';

const defaultImages: Record<RoomTier, string> = {
  Basic: roomBasic,
  Standard: roomStandard,
  Deluxe: roomLuxury,
  Suite: roomSuite,
  Presidential: roomPresidential,
};

// ── Design tokens — balanced warm palette ─────────────────
const GOLD    = '#c4a05a';
const BORDER  = 'rgba(196,160,90,0.15)';
const SURFACE = '#ffffff';
const TEXT    = '#1a1612';
const MUTED   = '#8a7d6e';
const CREAM   = '#faf8f4';
const DARK    = '#2c2418';

// ── Per-tier color system ──────────────────────────────────
const tierConfig: Record<RoomTier, {
  bg: string; text: string; border: string; dot: string;
  stars: number; barColor: string; accentText: string;
}> = {
  Basic:        { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', dot: '#3B82F6', stars: 1, barColor: 'linear-gradient(90deg,#3B82F6,#2563EB)',  accentText: '#1D4ED8' },
  Standard:     { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', dot: '#10B981', stars: 2, barColor: 'linear-gradient(90deg,#10B981,#059669)',  accentText: '#15803D' },
  Deluxe:       { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', dot: '#F59E0B', stars: 3, barColor: 'linear-gradient(90deg,#F59E0B,#D97706)',  accentText: '#B45309' },
  Suite:        { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', dot: '#8B5CF6', stars: 4, barColor: 'linear-gradient(90deg,#8B5CF6,#7C3AED)',  accentText: '#6D28D9' },
  Presidential: { bg: '#FFF0F6', text: '#9D174D', border: '#FBCFE8', dot: '#EC4899', stars: 5, barColor: 'linear-gradient(90deg,#EC4899,#DB2777)',  accentText: '#BE185D' },
};

// ── Condition pill ─────────────────────────────────────────
const conditionStyle: Record<string, { bg: string; color: string; border: string; label: string }> = {
  clean:       { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', label: 'Clean'       },
  dirty:       { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)',  label: 'Dirty'       },
  maintenance: { bg: 'rgba(239,68,68,0.09)',  color: '#991b1b', border: 'rgba(239,68,68,0.25)',  label: 'Maintenance' },
};

// ── Amenity icons ──────────────────────────────────────────
const getAmenityIcon = (a: string) => {
  const k = a.toLowerCase();
  if (k.includes('wi-fi') || k.includes('wifi')) return <Wifi size={11} />;
  if (k.includes('tv'))                          return <Tv size={11} />;
  if (k.includes('mini bar') || k.includes('bar')) return <Coffee size={11} />;
  if (k.includes('air'))                         return <Wind size={11} />;
  return null;
};

// ── Star rating ────────────────────────────────────────────
const TierStars = ({ count, color }: { count: number; color: string }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={10} style={{ color: i < count ? color : '#e5e7eb', fill: i < count ? color : 'transparent' }} />
    ))}
  </div>
);

// ── Shared input style ─────────────────────────────────────
const inputStyle: React.CSSProperties = {
  height: 42, borderRadius: 8,
  border: `1px solid ${BORDER}`, background: CREAM,
  fontFamily: 'Georgia, serif', fontSize: 13, color: TEXT,
  outline: 'none', transition: 'border-color 0.2s',
};

const AdminRooms = () => {
  const { rooms, addRoom, updateRoom, deleteRoom, toggleRoomActive } = useHotel();
  const { toast } = useToast();
  const [search, setSearch]       = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const emptyForm = {
    name: '', tier: 'Basic' as RoomTier, floor: 1, capacity: 2,
    pricePerNight: 89, description: '',
    amenities: 'Wi-Fi, Air Conditioning, TV', isActive: true, image: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ── Stats ──────────────────────────────────────────────
  const activeCount      = rooms.filter(r => r.isActive).length;
  const inactiveCount    = rooms.filter(r => !r.isActive).length;
  const cleanCount       = rooms.filter(r => r.condition === 'clean' || !r.condition).length;
  const dirtyCount       = rooms.filter(r => r.condition === 'dirty').length;
  const maintenanceCount = rooms.filter(r => r.condition === 'maintenance').length;

  const filtered = rooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.tier.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || r.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const openCreate = () => { setEditingRoom(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name, tier: room.tier, floor: room.floor,
      capacity: room.capacity, pricePerNight: room.pricePerNight,
      description: room.description, amenities: room.amenities.join(', '),
      isActive: room.isActive, image: room.images?.[0] || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const amenities = form.amenities.split(',').map(a => a.trim()).filter(Boolean);
    let imageUrl: string;
    if (editingRoom) {
      const oldDefaultImage = defaultImages[editingRoom.tier];
      const currentImage = form.image?.trim();
      imageUrl = (!currentImage || currentImage === oldDefaultImage) ? defaultImages[form.tier] : currentImage;
    } else {
      imageUrl = form.image?.trim() || defaultImages[form.tier];
    }
    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, { ...form, amenities, images: [imageUrl] });
        logAuditAction('Updated Room', form.name, 'success', `Room ${form.name} was updated`);
        toast({ title: 'Room updated!' });
      } else {
        await addRoom({ ...form, amenities, images: [imageUrl], condition: 'clean' });
        logAuditAction('Created Room', form.name, 'success', `New room ${form.name} was created`);
        toast({ title: 'Room created!' });
      }
      setDialogOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save room', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const room = rooms.find(r => r.id === id);
      await deleteRoom(id);
      logAuditAction('Deleted Room', room?.name || id, 'warning', `Room ${room?.name || id} was permanently deleted`);
      toast({ title: 'Room deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete room', variant: 'destructive' });
    }
  };

  const handleToggleRoomActive = async (id: string, isActive: boolean, name: string) => {
    try {
      await toggleRoomActive(id);
      logAuditAction(
        isActive ? 'Deactivated Room' : 'Activated Room', name,
        isActive ? 'warning' : 'success',
        `Room ${name} was ${isActive ? 'deactivated' : 'activated'}`
      );
    } catch {
      toast({ title: 'Error', description: 'Failed to update room status', variant: 'destructive' });
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
        <div style={{ position: 'absolute', top: -35, right: -35, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.22) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: '40%', width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ display: 'block', height: 1, width: 16, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Inventory</span>
            </div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.85rem', fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1 }}>
              Room <em style={{ fontStyle: 'italic', color: GOLD }}>Management</em>
            </h1>
            <p style={{ fontSize: 12, color: 'rgba(247,243,238,0.45)', marginTop: 4 }}>
              {rooms.length} rooms · {activeCount} active
            </p>

            {/* Summary badges */}
            <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: `${rooms.length} Total`,          bg: 'rgba(196,160,90,0.15)',   color: GOLD,     border: 'rgba(196,160,90,0.3)'  },
                { label: `${activeCount} Active`,          bg: 'rgba(16,185,129,0.12)',   color: '#059669', border: 'rgba(16,185,129,0.3)'  },
                { label: `${inactiveCount} Inactive`,      bg: 'rgba(239,68,68,0.1)',     color: '#dc2626', border: 'rgba(239,68,68,0.25)'  },
                { label: `${cleanCount} Clean`,            bg: 'rgba(16,185,129,0.1)',    color: '#059669', border: 'rgba(16,185,129,0.25)' },
                { label: `${dirtyCount} Dirty`,            bg: 'rgba(245,158,11,0.12)',   color: '#b45309', border: 'rgba(245,158,11,0.3)'  },
                { label: `${maintenanceCount} Maint.`,     bg: 'rgba(139,92,246,0.12)',   color: '#6d28d9', border: 'rgba(139,92,246,0.25)' },
              ].map(p => (
                <span key={p.label} style={{
                  fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  padding: '3px 10px', borderRadius: 999,
                  background: p.bg, color: p.color, border: `1px solid ${p.border}`,
                }}>{p.label}</span>
              ))}
            </div>
          </div>

          <button
            onClick={openCreate}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
              padding: '12px 22px', borderRadius: 10,
              fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700,
              color: '#1a1612', border: 'none', cursor: 'pointer',
              boxShadow: '0 3px 14px rgba(196,160,90,0.35)', transition: 'all 0.22s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(196,160,90,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 14px rgba(196,160,90,0.35)'; }}
          >
            <Plus size={14} /> Add Room
          </button>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div style={{
        display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center',
        padding: '12px 16px', borderRadius: 12,
        background: SURFACE, border: `1px solid ${BORDER}`,
        boxShadow: '0 1px 6px rgba(26,22,18,0.05)',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: MUTED }} />
          <input
            placeholder="Search rooms…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 34, paddingRight: 12, width: '100%' }}
            onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
            onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
          />
        </div>

        {/* Tier pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['all', 'Basic', 'Standard', 'Deluxe', 'Suite', 'Presidential'].map(t => {
            const active = tierFilter === t;
            const cfg    = t !== 'all' ? tierConfig[t as RoomTier] : null;
            return (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                style={{
                  padding: '6px 14px', borderRadius: 999,
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600,
                  fontFamily: 'Georgia, serif', cursor: 'pointer', transition: 'all 0.18s',
                  background: active ? (cfg ? cfg.bg : DARK) : 'transparent',
                  color: active ? (cfg ? cfg.text : '#f7f3ee') : MUTED,
                  border: active ? `1px solid ${cfg ? cfg.border : 'rgba(44,36,24,0.4)'}` : `1px solid ${BORDER}`,
                  boxShadow: active ? '0 2px 6px rgba(26,22,18,0.12)' : 'none',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.35)'; e.currentTarget.style.color = GOLD; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; } }}
              >
                {t === 'all' ? 'All' : t}
              </button>
            );
          })}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: MUTED, flexShrink: 0 }}>
          {filtered.length} room{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Room Grid ── */}
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {filtered.map(room => {
          const tcfg = tierConfig[room.tier] ?? tierConfig.Basic;
          const ccfg = conditionStyle[room.condition || 'clean'];

          return (
            <div
              key={room.id}
              style={{
                background: SURFACE, borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${BORDER}`,
                boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                transition: 'all 0.28s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(26,22,18,0.12)'; e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; e.currentTarget.style.borderColor = BORDER; }}
            >
              {/* Tier accent bar */}
              <div style={{ height: 4, background: tcfg.barColor, borderRadius: '14px 14px 0 0' }} />

              {/* Room image */}
              <div style={{ position: 'relative', height: 185, overflow: 'hidden' }}>
                <img
                  src={room.images[0]}
                  alt={room.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,22,18,0.8) 0%, transparent 55%)' }} />

                {/* Tier badge — top left */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700,
                  padding: '3px 9px', borderRadius: 999,
                  background: tcfg.bg, color: tcfg.text, border: `1px solid ${tcfg.border}`,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: tcfg.dot }} />
                  {room.tier}
                </div>

                {/* Status badge — top right */}
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span style={{
                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
                    padding: '3px 9px', borderRadius: 999,
                    background: room.isActive ? 'rgba(16,185,129,0.9)' : 'rgba(239,68,68,0.85)',
                    color: '#fff',
                  }}>
                    {room.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Condition badge — if not clean */}
                {room.condition && room.condition !== 'clean' && ccfg && (
                  <div style={{ position: 'absolute', top: 40, right: 10 }}>
                    <span style={{
                      fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700,
                      padding: '3px 9px', borderRadius: 999,
                      background: ccfg.bg, color: ccfg.color, border: `1px solid ${ccfg.border}`,
                    }}>
                      {ccfg.label}
                    </span>
                  </div>
                )}

                {/* Price — bottom right */}
                <div style={{ position: 'absolute', bottom: 12, right: 14, textAlign: 'right' }}>
                  <p style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 300, color: '#f7f3ee', lineHeight: 1 }}>
                    ${room.pricePerNight}
                  </p>
                  <p style={{ fontSize: 9, color: 'rgba(247,243,238,0.6)' }}>/night</p>
                </div>
              </div>

              {/* Card body */}
              <div style={{ padding: '14px 16px 16px' }}>
                {/* Name + stars */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: TEXT, letterSpacing: '0.01em' }}>{room.name}</h3>
                  <TierStars count={tcfg.stars} color={tcfg.dot} />
                </div>

                {/* Description */}
                <p style={{
                  fontSize: 12, color: MUTED, lineHeight: 1.65, marginBottom: 12,
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {room.description || 'No description provided.'}
                </p>

                {/* Meta chips */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  {[
                    { icon: Layers, label: `Floor ${room.floor}` },
                    { icon: Users,  label: `${room.capacity} guests` },
                    { icon: BedDouble, label: `${room.amenities.length} amenities` },
                  ].map(m => (
                    <span key={m.label} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, color: MUTED,
                      padding: '3px 9px', borderRadius: 7,
                      background: CREAM, border: `1px solid ${BORDER}`,
                    }}>
                      <m.icon size={10} color={GOLD} />
                      {m.label}
                    </span>
                  ))}
                </div>

                {/* Amenity chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                  {room.amenities.slice(0, 3).map(a => (
                    <span key={a} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 9, padding: '3px 9px', borderRadius: 999, fontWeight: 600,
                      background: tcfg.bg, color: tcfg.text, border: `1px solid ${tcfg.border}`,
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                      {getAmenityIcon(a)}{a}
                    </span>
                  ))}
                  {room.amenities.length > 3 && (
                    <span style={{
                      fontSize: 9, padding: '3px 9px', borderRadius: 999,
                      background: 'rgba(196,160,90,0.1)', color: GOLD,
                      border: `1px solid rgba(196,160,90,0.25)`, fontWeight: 600,
                    }}>
                      +{room.amenities.length - 3}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: BORDER, marginBottom: 12 }} />

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button
                    onClick={() => openEdit(room)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '8px 14px', borderRadius: 8,
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.11em', fontWeight: 600,
                      border: `1px solid ${BORDER}`, background: CREAM, color: MUTED,
                      cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Georgia, serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(196,160,90,0.08)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = MUTED; e.currentTarget.style.background = CREAM; }}
                  >
                    <Pencil size={11} /> Edit
                  </button>

                  <button
                    onClick={() => handleToggleRoomActive(room.id, room.isActive, room.name)}
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8,
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.11em', fontWeight: 600,
                      border: room.isActive ? '1px solid rgba(239,68,68,0.28)' : '1px solid rgba(16,185,129,0.28)',
                      background: room.isActive ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
                      color: room.isActive ? '#dc2626' : '#059669',
                      cursor: 'pointer', transition: 'opacity 0.2s', fontFamily: 'Georgia, serif',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  >
                    {room.isActive ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleDelete(room.id)}
                    style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      border: '1px solid rgba(239,68,68,0.25)',
                      background: 'rgba(239,68,68,0.08)', color: '#dc2626',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.16)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{
            gridColumn: '1 / -1', padding: '60px 24px', textAlign: 'center',
            background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`,
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <BedDouble size={22} color="rgba(196,160,90,0.4)" />
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 4 }}>No rooms found</p>
            <p style={{ fontSize: 11, color: MUTED, marginBottom: 14 }}>Try adjusting your search or filters</p>
            <button
              onClick={() => { setSearch(''); setTierFilter('all'); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: GOLD, textDecoration: 'underline', fontFamily: 'Georgia, serif' }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── DIALOG ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={{
          background: '#fff', borderRadius: 16, border: 'none',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          maxWidth: 520, padding: 0,
          fontFamily: 'Georgia, serif',
        }}>
          <DialogTitle className="sr-only">{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>

          {/* Dialog header */}
          <div style={{ background: DARK, padding: '20px 24px', borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, fontWeight: 700 }}>
                {editingRoom ? 'Edit Room' : 'New Room'}
              </span>
            </div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontWeight: 300, color: '#f7f3ee', fontStyle: 'italic', margin: 0 }}>
              {editingRoom ? `Editing: ${editingRoom.name}` : 'Create a New Room'}
            </h2>
          </div>

          {/* Form */}
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '68vh', overflowY: 'auto' }}>

            {/* Room Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Room Name</Label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Ocean View Suite 301"
                style={{ ...inputStyle, paddingLeft: 12, paddingRight: 12, width: '100%' }}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
            </div>

            {/* Tier + Floor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Tier</Label>
                <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v as RoomTier }))}>
                  <SelectTrigger style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px' }} className="focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{ background: '#fff', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
                    {(['Basic', 'Standard', 'Deluxe', 'Suite', 'Presidential'] as RoomTier[]).map(t => (
                      <SelectItem key={t} value={t} style={{ fontSize: 13, color: TEXT, fontFamily: 'Georgia, serif' }}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Floor</Label>
                <input type="number" min={1} value={form.floor}
                  onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) }))}
                  style={{ ...inputStyle, paddingLeft: 12, paddingRight: 12, width: '100%' }}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
              </div>
            </div>

            {/* Capacity + Price */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Capacity</Label>
                <input type="number" min={1} value={form.capacity}
                  onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))}
                  style={{ ...inputStyle, paddingLeft: 12, paddingRight: 12, width: '100%' }}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Price / Night ($)</Label>
                <input type="number" min={1} value={form.pricePerNight}
                  onChange={e => setForm(f => ({ ...f, pricePerNight: parseInt(e.target.value) }))}
                  style={{ ...inputStyle, paddingLeft: 12, paddingRight: 12, width: '100%' }}
                  onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                  onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
                />
              </div>
            </div>

            {/* Description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Description</Label>
              <Textarea value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the room experience…"
                rows={3}
                style={{ ...inputStyle, height: 'auto', resize: 'none', padding: '10px 12px', lineHeight: 1.7 }}
                className="focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Amenities */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>Amenities</Label>
              <input value={form.amenities}
                onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))}
                placeholder="Wi-Fi, TV, Mini Bar, Air Conditioning…"
                style={{ ...inputStyle, paddingLeft: 12, paddingRight: 12, width: '100%' }}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              <p style={{ fontSize: 10, color: 'rgba(138,125,110,0.6)' }}>Separate with commas</p>
            </div>

            {/* Image URL */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <Label style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: MUTED, fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                Image URL <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
              </Label>
              <input value={form.image}
                onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                placeholder="https://example.com/room.jpg"
                style={{ ...inputStyle, paddingLeft: 12, paddingRight: 12, width: '100%' }}
                onFocus={e => (e.currentTarget.style.borderColor = GOLD)}
                onBlur={e => (e.currentTarget.style.borderColor = BORDER)}
              />
              {!form.image && (
                <p style={{ fontSize: 10, color: 'rgba(138,125,110,0.6)' }}>
                  Defaults to <span style={{ color: GOLD, fontWeight: 600 }}>{form.tier}</span> tier image
                </p>
              )}
            </div>

            {/* Active toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: form.isActive ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              border: `1px solid ${form.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              transition: 'all 0.2s',
            }}>
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: form.isActive ? '#059669' : '#dc2626', marginBottom: 2 }}>
                  {form.isActive ? 'Room Active' : 'Room Inactive'}
                </p>
                <p style={{ fontSize: 10, color: MUTED }}>
                  {form.isActive ? 'Guests can browse and book this room.' : 'Room will not appear in listings.'}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: BORDER }} />

            {/* Save */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDialogOpen(false)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 9,
                  background: CREAM, border: `1px solid ${BORDER}`,
                  fontSize: 11, fontWeight: 600, color: MUTED, cursor: 'pointer',
                  fontFamily: 'Georgia, serif', transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = GOLD)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
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
                {editingRoom ? 'Update Room' : 'Create Room'}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRooms;