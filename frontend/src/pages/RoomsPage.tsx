import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, BedDouble, ArrowRight, SlidersHorizontal, Star } from 'lucide-react';
import { RoomTier } from '@/types/hotel';

/* ── Breakpoint hook (same pattern as Navbar) ─────────────────── */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

/* ── Tier config ──────────────────────────────────────────────── */
const tierConfig: Record<RoomTier, {
  bg: string; text: string; border: string;
  accentBg: string; accentText: string; stars: number; label: string;
}> = {
  Basic:        { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE', accentBg: '#DBEAFE', accentText: '#1D4ED8', stars: 1, label: 'Basic' },
  Standard:     { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0', accentBg: '#DCFCE7', accentText: '#15803D', stars: 2, label: 'Standard' },
  Deluxe:       { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', accentBg: '#FEF3C7', accentText: '#B45309', stars: 3, label: 'Deluxe' },
  Suite:        { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE', accentBg: '#EDE9FE', accentText: '#6D28D9', stars: 4, label: 'Suite' },
  Presidential: { bg: '#FFF0F6', text: '#9D174D', border: '#FBCFE8', accentBg: '#FCE7F3', accentText: '#BE185D', stars: 5, label: 'Presidential' },
};

const tierBarColors: Record<RoomTier, string> = {
  Basic:        'linear-gradient(90deg, #3B82F6, #2563EB)',
  Standard:     'linear-gradient(90deg, #10B981, #059669)',
  Deluxe:       'linear-gradient(90deg, #F59E0B, #D97706)',
  Suite:        'linear-gradient(90deg, #8B5CF6, #7C3AED)',
  Presidential: 'linear-gradient(90deg, #EC4899, #DB2777)',
};

const TierStars = ({ count, color }: { count: number; color: string }) => (
  <div style={{ display: 'flex', gap: '2px' }}>
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} size={10}
        style={{ color: i < count ? color : '#d1d5db', fill: i < count ? color : 'transparent' }} />
    ))}
  </div>
);

/* ─────────────────────────────────────────────────────────────── */

const RoomsPage = () => {
  const { rooms } = useHotel();
  const { isAuthenticated } = useAuth();
  const isMobile = useIsMobile();

  const [search, setSearch]               = useState('');
  const [tierFilter, setTierFilter]       = useState<string>('all');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');
  const [hoveredCard, setHoveredCard]     = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen]     = useState(false); // mobile filter toggle

  const activeRooms = rooms.filter(r => r.isActive);
  const filtered = activeRooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchTier   = tierFilter === 'all' || r.tier === tierFilter;
    const matchCap    = capacityFilter === 'all' || r.capacity >= parseInt(capacityFilter);
    return matchSearch && matchTier && matchCap;
  });

  const hasActiveFilters = search || tierFilter !== 'all' || capacityFilter !== 'all';
  const clearFilters = () => { setSearch(''); setTierFilter('all'); setCapacityFilter('all'); };

  /* Responsive values */
  const heroPadding     = isMobile ? '64px 20px 56px' : '96px 48px 80px';
  const sectionPadding  = isMobile ? '0 16px'         : '0 40px';
  const gridPadding     = isMobile ? '32px 0 64px'    : '48px 0 80px';

  return (
    <div style={{ fontFamily: 'Georgia, serif', background: '#f7f3ee', color: '#1a1612', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #2c2418 0%, #1a1612 60%, #3a2e1e 100%)',
        padding: heroPadding,
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(196,160,90,0.04) 80px), repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(196,160,90,0.04) 80px)',
        }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

        {/* Corner brackets — hidden on mobile to avoid clipping */}
        {!isMobile && <>
          <div style={{ position: 'absolute', top: 24, left: 24, width: 36, height: 36, borderTop: '1.5px solid rgba(196,160,90,0.5)', borderLeft: '1.5px solid rgba(196,160,90,0.5)' }} />
          <div style={{ position: 'absolute', top: 24, right: 24, width: 36, height: 36, borderTop: '1.5px solid rgba(196,160,90,0.5)', borderRight: '1.5px solid rgba(196,160,90,0.5)' }} />
          <div style={{ position: 'absolute', bottom: 24, left: 24, width: 36, height: 36, borderBottom: '1.5px solid rgba(196,160,90,0.5)', borderLeft: '1.5px solid rgba(196,160,90,0.5)' }} />
          <div style={{ position: 'absolute', bottom: 24, right: 24, width: 36, height: 36, borderBottom: '1.5px solid rgba(196,160,90,0.5)', borderRight: '1.5px solid rgba(196,160,90,0.5)' }} />
        </>}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
            <span style={{ display: 'block', height: 1, width: 32, background: '#c4a05a' }} />
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.28em', color: '#c4a05a' }}>Accommodations</span>
            <span style={{ display: 'block', height: 1, width: 32, background: '#c4a05a' }} />
          </div>

          <h1 style={{
            fontFamily: 'Georgia, serif',
            fontSize: 'clamp(2.4rem, 6vw, 5rem)',
            fontWeight: 300,
            letterSpacing: '-0.025em',
            color: '#f7f3ee',
            lineHeight: 1.05,
          }}>
            Our <em style={{ fontStyle: 'italic', color: '#c4a05a' }}>Rooms</em>
          </h1>

          <p style={{ marginTop: 16, fontSize: 14, color: 'rgba(247,243,238,0.55)', letterSpacing: '0.03em' }}>
            Find the perfect room for your stay
          </p>

          {/* Stat pills — stack on mobile */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? 10 : 24,
            marginTop: 28,
            flexWrap: 'wrap',
            padding: isMobile ? '0 8px' : '0',
          }}>
            {[
              { val: activeRooms.length, label: 'Available Rooms' },
              { val: '5',               label: 'Room Tiers' },
              { val: '4.9★',            label: 'Guest Rating' },
            ].map(s => (
              <div key={s.label} style={{
                border: '1px solid rgba(196,160,90,0.25)',
                padding: isMobile ? '6px 14px' : '8px 20px',
                background: 'rgba(196,160,90,0.07)',
              }}>
                <span style={{ fontSize: isMobile ? 15 : 17, fontWeight: 300, color: '#c4a05a', fontStyle: 'italic' }}>{s.val}</span>
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(247,243,238,0.4)', marginLeft: 8 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, rgba(196,160,90,0.3), transparent)' }} />
      </section>


      {/* ── FILTER BAR ────────────────────────────────────────── */}
      <section style={{
        background: '#fff',
        borderBottom: '1px solid rgba(196,160,90,0.15)',
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 2px 16px rgba(26,22,18,0.08)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: sectionPadding }}>

          {isMobile ? (
            /* ── Mobile: collapsed filter bar ── */
            <>
              {/* Top row: search + toggle button */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '12px 0' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#a8976e' }} />
                  <input
                    placeholder="Search rooms…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{
                      width: '100%', paddingLeft: 32, paddingRight: 10, height: 38,
                      border: '1px solid rgba(196,160,90,0.25)', borderRadius: 0,
                      background: '#faf8f4', color: '#1a1612', fontSize: 13,
                      outline: 'none', fontFamily: 'Georgia, serif', boxSizing: 'border-box',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = '#c4a05a')}
                    onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(196,160,90,0.25)')}
                  />
                </div>
                <button
                  onClick={() => setFiltersOpen(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    height: 38, padding: '0 14px', flexShrink: 0,
                    border: `1px solid ${filtersOpen ? '#c4a05a' : 'rgba(196,160,90,0.25)'}`,
                    background: filtersOpen ? 'rgba(196,160,90,0.1)' : '#faf8f4',
                    color: '#c4a05a', cursor: 'pointer', fontSize: 11,
                    letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'Georgia, serif',
                  }}
                >
                  <SlidersHorizontal size={13} />
                  Filters
                  {hasActiveFilters && (
                    <span style={{
                      width: 16, height: 16, borderRadius: '50%',
                      background: '#c4a05a', color: '#1a1612',
                      fontSize: 9, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {[search, tierFilter !== 'all', capacityFilter !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                </button>
              </div>

              {/* Expandable filter drawer */}
              {filtersOpen && (
                <div style={{ paddingBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Select value={tierFilter} onValueChange={setTierFilter}>
                      <SelectTrigger style={{ flex: 1, height: 38, background: '#faf8f4', border: '1px solid rgba(196,160,90,0.25)', borderRadius: 0, color: '#1a1612', fontSize: 13, fontFamily: 'Georgia, serif' }}>
                        <SelectValue placeholder="Room Type" />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#fff', border: '1px solid rgba(196,160,90,0.2)', borderRadius: 0 }}>
                        {['all', 'Basic', 'Standard', 'Deluxe', 'Suite', 'Presidential'].map(v => (
                          <SelectItem key={v} value={v} style={{ fontSize: 13, color: '#1a1612', fontFamily: 'Georgia, serif' }}>
                            {v === 'all' ? 'All Types' : v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                      <SelectTrigger style={{ flex: 1, height: 38, background: '#faf8f4', border: '1px solid rgba(196,160,90,0.25)', borderRadius: 0, color: '#1a1612', fontSize: 13, fontFamily: 'Georgia, serif' }}>
                        <SelectValue placeholder="Guests" />
                      </SelectTrigger>
                      <SelectContent style={{ background: '#fff', border: '1px solid rgba(196,160,90,0.2)', borderRadius: 0 }}>
                        {[
                          { value: 'all', label: 'Any Capacity' },
                          { value: '1',   label: '1+ Guests' },
                          { value: '2',   label: '2+ Guests' },
                          { value: '4',   label: '4+ Guests' },
                          { value: '6',   label: '6+ Guests' },
                        ].map(opt => (
                          <SelectItem key={opt.value} value={opt.value} style={{ fontSize: 13, color: '#1a1612', fontFamily: 'Georgia, serif' }}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#8a7d6e', padding: '4px 10px', background: 'rgba(196,160,90,0.08)', border: '1px solid rgba(196,160,90,0.15)' }}>
                      {filtered.length} of {activeRooms.length} rooms
                    </span>
                    {hasActiveFilters && (
                      <button onClick={clearFilters}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c4a05a', textDecoration: 'underline', fontFamily: 'Georgia, serif' }}>
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* ── Desktop: full inline filter row ── */
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}>
                <SlidersHorizontal size={14} color="#c4a05a" />
                <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#c4a05a', fontWeight: 700 }}>
                  Filter
                </span>
              </div>

              {/* Search */}
              <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#a8976e' }} />
                <input
                  placeholder="Search rooms…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', paddingLeft: 36, paddingRight: 12, height: 40,
                    border: '1px solid rgba(196,160,90,0.25)', borderRadius: 0,
                    background: '#faf8f4', color: '#1a1612', fontSize: 13,
                    outline: 'none', fontFamily: 'Georgia, serif', transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = '#c4a05a')}
                  onBlur={e  => (e.currentTarget.style.borderColor = 'rgba(196,160,90,0.25)')}
                />
              </div>

              {/* Tier */}
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger style={{ width: 155, height: 40, background: '#faf8f4', border: '1px solid rgba(196,160,90,0.25)', borderRadius: 0, color: '#1a1612', fontSize: 13, fontFamily: 'Georgia, serif' }}>
                  <SelectValue placeholder="Room Type" />
                </SelectTrigger>
                <SelectContent style={{ background: '#fff', border: '1px solid rgba(196,160,90,0.2)', borderRadius: 0 }}>
                  {['all', 'Basic', 'Standard', 'Deluxe', 'Suite', 'Presidential'].map(v => (
                    <SelectItem key={v} value={v} style={{ fontSize: 13, color: '#1a1612', fontFamily: 'Georgia, serif' }}>
                      {v === 'all' ? 'All Types' : v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Capacity */}
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger style={{ width: 155, height: 40, background: '#faf8f4', border: '1px solid rgba(196,160,90,0.25)', borderRadius: 0, color: '#1a1612', fontSize: 13, fontFamily: 'Georgia, serif' }}>
                  <SelectValue placeholder="Guests" />
                </SelectTrigger>
                <SelectContent style={{ background: '#fff', border: '1px solid rgba(196,160,90,0.2)', borderRadius: 0 }}>
                  {[
                    { value: 'all', label: 'Any Capacity' },
                    { value: '1',   label: '1+ Guests' },
                    { value: '2',   label: '2+ Guests' },
                    { value: '4',   label: '4+ Guests' },
                    { value: '6',   label: '6+ Guests' },
                  ].map(opt => (
                    <SelectItem key={opt.value} value={opt.value} style={{ fontSize: 13, color: '#1a1612', fontFamily: 'Georgia, serif' }}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Count */}
              <span style={{ fontSize: 11, color: '#8a7d6e', letterSpacing: '0.05em', padding: '4px 12px', background: 'rgba(196,160,90,0.08)', border: '1px solid rgba(196,160,90,0.15)' }}>
                {filtered.length} of {activeRooms.length} rooms
              </span>

              {hasActiveFilters && (
                <button onClick={clearFilters}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#c4a05a', textDecoration: 'underline', fontFamily: 'Georgia, serif', padding: '4px 0' }}>
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
      </section>


      {/* ── ROOMS GRID ────────────────────────────────────────── */}
      <section style={{ padding: gridPadding, background: '#f7f3ee' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: sectionPadding }}>

          {filtered.length > 0 ? (
            <div style={{
              display: 'grid',
              gap: isMobile ? 16 : 22,
              // Single column on mobile, auto-fill on larger screens
              gridTemplateColumns: isMobile
                ? '1fr'
                : 'repeat(auto-fill, minmax(340px, 1fr))',
            }}>
              {filtered.map(room => {
                const cfg = tierConfig[room.tier] ?? tierConfig.Basic;
                const isHovered = hoveredCard === room.id;

                return (
                  <div
                    key={room.id}
                    onMouseEnter={() => setHoveredCard(room.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      position: 'relative',
                      background: '#fff',
                      border: `1px solid ${isHovered ? cfg.border : 'rgba(196,160,90,0.15)'}`,
                      overflow: 'hidden',
                      transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
                      // Disable lift on mobile (touch devices don't hover)
                      transform: (!isMobile && isHovered) ? 'translateY(-4px)' : 'translateY(0)',
                      boxShadow: (!isMobile && isHovered)
                        ? '0 16px 48px rgba(26,22,18,0.12)'
                        : '0 2px 10px rgba(26,22,18,0.05)',
                    }}
                  >
                    {/* Tier accent bar */}
                    <div style={{ height: 4, background: tierBarColors[room.tier] }} />

                    {/* Image */}
                    <div style={{ position: 'relative', height: isMobile ? 200 : 220, overflow: 'hidden' }}>
                      <img
                        src={room.images[0]}
                        alt={room.name}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                          transition: 'transform 0.7s ease',
                          transform: (!isMobile && isHovered) ? 'scale(1.06)' : 'scale(1)',
                        }}
                        loading="lazy"
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,22,18,0.72) 0%, transparent 55%)' }} />

                      {/* Tier badge */}
                      <div style={{ position: 'absolute', top: 12, left: 12 }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          borderRadius: 999, padding: '4px 12px', fontSize: 9,
                          textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700,
                          background: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}`,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.accentText }} />
                          {room.tier}
                        </span>
                      </div>

                      {/* Price */}
                      <div style={{ position: 'absolute', bottom: 12, right: 14, textAlign: 'right' }}>
                        <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', fontStyle: 'italic', color: '#f7f3ee', fontWeight: 300, lineHeight: 1 }}>
                          ${room.pricePerNight}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(247,243,238,0.6)', marginTop: 2 }}>/night</div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: '18px 18px 20px' }}>

                      {/* Name + stars */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <h3 style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, color: '#1a1612', fontFamily: 'Georgia, serif', margin: 0 }}>
                          {room.name}
                        </h3>
                        <TierStars count={cfg.stars} color={cfg.accentText} />
                      </div>

                      {/* Description */}
                      <p style={{
                        fontSize: 13, color: '#8a7d6e', lineHeight: 1.7, marginBottom: 14,
                        display: '-webkit-box', WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {room.description}
                      </p>

                      {/* Meta chips */}
                      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, background: '#f7f3ee', padding: '4px 10px', color: '#6b5d48', border: '1px solid rgba(196,160,90,0.15)' }}>
                          <Users size={11} /> {room.capacity} guests
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, background: '#f7f3ee', padding: '4px 10px', color: '#6b5d48', border: '1px solid rgba(196,160,90,0.15)' }}>
                          <BedDouble size={11} /> Floor {room.floor}
                        </span>
                      </div>

                      {/* Amenity chips */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                        {room.amenities.slice(0, 3).map(a => (
                          <span key={a} style={{
                            fontSize: 9, padding: '3px 9px', borderRadius: 999,
                            background: cfg.accentBg, color: cfg.accentText,
                            border: `1px solid ${cfg.border}`,
                            textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600,
                          }}>
                            {a}
                          </span>
                        ))}
                        {room.amenities.length > 3 && (
                          <span style={{
                            fontSize: 9, padding: '3px 9px', borderRadius: 999,
                            background: 'rgba(196,160,90,0.1)', color: '#c4a05a',
                            border: '1px solid rgba(196,160,90,0.25)',
                            textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600,
                          }}>
                            +{room.amenities.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div style={{ height: 1, background: 'rgba(196,160,90,0.12)', marginBottom: 16 }} />

                      {/* Book CTA */}
                      <Link
                        to={isAuthenticated ? `/book/${room.id}` : '/login'}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          background: (!isMobile && isHovered) ? '#1a1612' : '#c4a05a',
                          padding: '12px 20px',
                          fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em',
                          fontWeight: 700,
                          color: (!isMobile && isHovered) ? '#f7f3ee' : '#1a1612',
                          textDecoration: 'none', transition: 'background 0.25s, color 0.25s',
                          fontFamily: 'Georgia, serif',
                        }}
                      >
                        {isAuthenticated ? 'Book Now' : 'Login to Book'}
                        <ArrowRight size={12} />
                      </Link>
                    </div>

                    {/* Bottom gold reveal line — desktop only */}
                    {!isMobile && (
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, height: 2,
                        width: isHovered ? '100%' : '0%',
                        background: '#c4a05a',
                        transition: 'width 0.45s ease',
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── Empty state ── */
            <div style={{
              padding: isMobile ? '56px 20px' : '80px 24px',
              textAlign: 'center',
              border: '1px solid rgba(196,160,90,0.2)',
              background: '#fff',
            }}>
              <div style={{
                width: 64, height: 64, border: '1px solid rgba(196,160,90,0.3)',
                background: 'rgba(196,160,90,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
              }}>
                <BedDouble size={24} color="rgba(196,160,90,0.5)" />
              </div>
              <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#8a7d6e', marginBottom: 8 }}>
                No Rooms Found
              </p>
              <p style={{ fontSize: 13, color: '#a89880' }}>No rooms match your current filters</p>
              <button
                onClick={clearFilters}
                style={{
                  marginTop: 20, background: 'none',
                  border: '1px solid rgba(196,160,90,0.4)', cursor: 'pointer',
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em',
                  color: '#c4a05a', padding: '10px 28px', fontFamily: 'Georgia, serif',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,160,90,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </section>

      <style>{`
        ::placeholder { color: rgba(138,125,110,0.55) !important; }
      `}</style>
    </div>
  );
};

export default RoomsPage;