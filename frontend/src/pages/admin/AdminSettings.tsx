import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseStatus } from '@/hooks/useSupabaseStatus';
import { supabase } from '@/lib/supabase';
import {
  Building2, Database, Shield, Server,
  CheckCircle2, XCircle, Clock, User,
  Edit3, Save, ArrowRight, Wifi, CreditCard,
  Lock, RefreshCw, Trash2, Search, AlertTriangle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
interface AuditEntry {
  id: string;
  action: string;
  user_name: string;
  target: string;
  created_at: string;
  status: 'success' | 'warning' | 'error';
  details?: string;
}

interface HotelInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
}

// ── Constants ──────────────────────────────────────────────────
const AUDIT_LOG_KEY = 'audit-logs';

const defaultHotelInfo = {
  name:         'LuxeStay',
  address:      '123 Luxury Ave, Makati City, Manila',
  phone:        '+63 2 8888 0000',
  email:        'info@luxestay.com',
  checkInTime:  '2:00 PM',
  checkOutTime: '12:00 PM',
};

// ── Exported audit logger ──────────────────────────────────────
export const logAuditAction = (
  action: string,
  target: string,
  status: 'success' | 'warning' | 'error' = 'success',
  details?: string,
): AuditEntry => {
  const userStr = localStorage.getItem('cached-user');
  const user    = userStr ? JSON.parse(userStr) : null;
  const entry: AuditEntry = {
    id:         Date.now().toString(),
    action,
    user_name:  user?.name || user?.email || 'Unknown',
    target,
    created_at: new Date().toISOString(),
    status,
    details,
  };
  const existing = JSON.parse(localStorage.getItem(AUDIT_LOG_KEY) || '[]');
  localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify([entry, ...existing].slice(0, 100)));
  return entry;
};

// ── Design Tokens ──────────────────────────────────────────────
const GOLD         = '#c4a05a';
const GOLD_LIGHT   = '#d4b06a';
const GOLD_PALE    = 'rgba(196,160,90,0.10)';
const GOLD_BORDER  = 'rgba(196,160,90,0.22)';

const PAGE_BG      = '#f0ebe0';   // warm parchment
const PANEL_BG     = '#faf7f1';   // card surface
const DARK_BG      = '#1e1b14';   // dark panel (system status)
const DARK_MID     = '#272319';

const TEXT_DARK    = '#1e1b14';
const TEXT_WARM    = '#3d3526';
const TEXT_MUTED   = 'rgba(61,53,38,0.48)';
const TEXT_LIGHT   = '#f0ead6';
const TEXT_LIGHT_MUTED = 'rgba(184,173,150,0.55)';

const BORDER_LIGHT = 'rgba(61,53,38,0.10)';
const BORDER_DARK  = 'rgba(240,234,214,0.08)';
const DIVIDER      = 'rgba(196,160,90,0.15)';

// Audit status styles
const auditSt = (s: AuditEntry['status']) => ({
  success: { color: '#4a9c6a', bg: 'rgba(74,156,106,0.09)',   border: 'rgba(74,156,106,0.28)',   label: 'Success' },
  warning: { color: '#c4913a', bg: 'rgba(196,145,58,0.09)',   border: 'rgba(196,145,58,0.28)',   label: 'Warning' },
  error:   { color: '#d97070', bg: 'rgba(217,112,112,0.09)',  border: 'rgba(217,112,112,0.28)',  label: 'Error'   },
}[s]);

// Shared input (light panel)
const lightInput: React.CSSProperties = {
  backgroundColor: PAGE_BG,
  border:          `0.5px solid ${BORDER_LIGHT}`,
  borderRadius:    0,
  color:           TEXT_DARK,
  fontSize:        13,
  height:          42,
  outline:         'none',
  fontFamily:      'inherit',
};

const labelSt: React.CSSProperties = {
  fontSize:      9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.22em',
  color:         TEXT_MUTED,
  display:       'block',
  marginBottom:  6,
};

// ── Component ──────────────────────────────────────────────────
const AdminSettings = () => {
  const { toast }                              = useToast();
  const { connected: isSupabaseConnected }     = useSupabaseStatus();
  const [isEditingHotel, setIsEditingHotel]    = useState(false);
  const [auditTrail, setAuditTrail]            = useState<AuditEntry[]>([]);
  const [isLoadingAudit, setIsLoadingAudit]    = useState(false);
  const [auditFilter, setAuditFilter]          = useState<'All' | 'success' | 'warning' | 'error'>('All');
  const [auditSearch, setAuditSearch]          = useState('');
  const [hoveredAudit, setHoveredAudit]        = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [hotelInfo, setHotelInfo] = useState<HotelInfo>(defaultHotelInfo);
  const [isLoadingHotel, setIsLoadingHotel] = useState(false);

  // ── Audit helpers ────────────────────────────────────────────
  const fetchAuditLogs = () => {
    setIsLoadingAudit(true);
    try {
      const saved = localStorage.getItem(AUDIT_LOG_KEY);
      if (saved) setAuditTrail(JSON.parse(saved));
    } catch { /* silent */ } finally {
      setIsLoadingAudit(false);
    }
  };

  const deleteAllAuditLogs = () => {
    try {
      localStorage.removeItem(AUDIT_LOG_KEY);
      setAuditTrail([]);
      setShowDeleteConfirm(false);
      toast({ title: 'All audit logs deleted' });
    } catch {
      toast({ title: 'Failed to delete audit logs', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchHotelInfo();
    const interval = setInterval(fetchAuditLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Hotel info helpers ───────────────────────────────────────
  const fetchHotelInfo = async () => {
    setIsLoadingHotel(true);
    try {
      const { data, error } = await supabase
        .from('hotel_config')
        .select('*')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No row exists yet, use defaults
          setHotelInfo(defaultHotelInfo);
        } else {
          toast({ title: 'Failed to load hotel info', variant: 'destructive' });
        }
      } else if (data) {
        setHotelInfo({
          name: data.name || defaultHotelInfo.name,
          address: data.address || defaultHotelInfo.address,
          phone: data.phone || defaultHotelInfo.phone,
          email: data.email || defaultHotelInfo.email,
          checkInTime: data.check_in_time || defaultHotelInfo.checkInTime,
          checkOutTime: data.check_out_time || defaultHotelInfo.checkOutTime,
        });
      }
    } catch {
      toast({ title: 'Failed to load hotel info', variant: 'destructive' });
    } finally {
      setIsLoadingHotel(false);
    }
  };

  // ── Hotel save ───────────────────────────────────────────────
  const handleSaveHotelInfo = async () => {
    try {
      const { error } = await supabase
        .from('hotel_config')
        .upsert({
          id: 1, // Single row for singleton pattern
          name: hotelInfo.name,
          address: hotelInfo.address,
          phone: hotelInfo.phone,
          email: hotelInfo.email,
          check_in_time: hotelInfo.checkInTime,
          check_out_time: hotelInfo.checkOutTime,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });

      if (error) {
        toast({ title: 'Failed to save hotel info', variant: 'destructive' });
        return;
      }

      setIsEditingHotel(false);
      toast({ title: 'Hotel information updated.' });
    } catch {
      toast({ title: 'Failed to save hotel info', variant: 'destructive' });
    }
  };

  // ── Filtered audit ───────────────────────────────────────────
  const filteredAudit = auditTrail.filter(e => {
    const matchStatus = auditFilter === 'All' || e.status === auditFilter;
    const matchSearch = !auditSearch ||
      e.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      e.user_name.toLowerCase().includes(auditSearch.toLowerCase()) ||
      e.target.toLowerCase().includes(auditSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // ── System services ──────────────────────────────────────────
  const services = [
    { icon: <Database   style={{ width: 13, height: 13 }} />, label: 'Database',        ok: isSupabaseConnected },
    { icon: <Lock       style={{ width: 13, height: 13 }} />, label: 'Authentication',  ok: true                },
    { icon: <Server     style={{ width: 13, height: 13 }} />, label: 'API Server',      ok: true                },
    { icon: <CreditCard style={{ width: 13, height: 13 }} />, label: 'Payment Gateway', ok: true                },
    { icon: <Wifi       style={{ width: 13, height: 13 }} />, label: 'CDN / Storage',   ok: true                },
  ];

  const allOnline = services.every(s => s.ok);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="animate-fade-in"
      style={{
        color:           TEXT_DARK,
        fontFamily:      "'Jost', 'DM Sans', sans-serif",
        backgroundColor: PAGE_BG,
        minHeight:       '100vh',
        padding:         '36px 40px',
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
              Configuration
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.02em',
            color: TEXT_DARK, lineHeight: 1.1, marginBottom: 6,
          }}>
            Admin{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>Settings</span>
          </h1>
          <p style={{ fontSize: 12, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            Hotel configuration and system management
          </p>
        </div>
      </div>

      {/* ── Two-column top grid ───────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: 20, marginBottom: 20,
      }}>

        {/* ══════════════════════════════════════════════
            HOTEL INFORMATION CARD
            ══════════════════════════════════════════ */}
        <div style={{
          backgroundColor: PANEL_BG,
          border: `0.5px solid ${BORDER_LIGHT}`,
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(30,27,20,0.04)',
        }}>
          {/* Card header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: `0.5px solid ${BORDER_LIGHT}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Building2 style={{ width: 15, height: 15, color: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD }}>
                Hotel Information
              </span>
            </div>

            {/* Edit / Save toggle */}
            <button
              onClick={() => isEditingHotel ? handleSaveHotelInfo() : setIsEditingHotel(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.18em',
                border: isEditingHotel ? `0.5px solid ${GOLD_BORDER}` : `0.5px solid ${BORDER_LIGHT}`,
                backgroundColor: isEditingHotel ? GOLD_PALE : 'transparent',
                color: isEditingHotel ? GOLD : TEXT_MUTED,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = GOLD_BORDER;
                e.currentTarget.style.color = GOLD;
                e.currentTarget.style.backgroundColor = GOLD_PALE;
              }}
              onMouseLeave={e => {
                if (!isEditingHotel) {
                  e.currentTarget.style.borderColor = BORDER_LIGHT;
                  e.currentTarget.style.color = TEXT_MUTED;
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {isEditingHotel
                ? <><Save style={{ width: 11, height: 11 }} /> Save Changes</>
                : <><Edit3 style={{ width: 11, height: 11 }} /> Edit</>}
            </button>
          </div>

          {/* Card body */}
          <div style={{ padding: '24px' }}>
            {isEditingHotel ? (
              /* ── Edit mode ── */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Hotel Name',     key: 'name',         type: 'text'  },
                  { label: 'Email Address',  key: 'email',        type: 'email' },
                  { label: 'Phone Number',   key: 'phone',        type: 'tel'   },
                  { label: 'Check-in Time',  key: 'checkInTime',  type: 'text'  },
                  { label: 'Check-out Time', key: 'checkOutTime', type: 'text'  },
                ].map(field => (
                  <div key={field.key}>
                    <label style={labelSt}>{field.label}</label>
                    <Input
                      type={field.type}
                      value={(hotelInfo as any)[field.key]}
                      onChange={e => setHotelInfo({ ...hotelInfo, [field.key]: e.target.value })}
                      style={lightInput}
                      className="focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelSt}>Address</label>
                  <Input
                    value={hotelInfo.address}
                    onChange={e => setHotelInfo({ ...hotelInfo, address: e.target.value })}
                    style={lightInput}
                    className="focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                {/* Save CTA */}
                <div style={{ gridColumn: '1 / -1', paddingTop: 8, borderTop: `0.5px solid ${DIVIDER}` }}>
                  <button
                    onClick={handleSaveHotelInfo}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      backgroundColor: GOLD, padding: '11px 22px',
                      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.22em',
                      fontWeight: 700, color: '#0c0b09', border: 'none',
                      cursor: 'pointer', transition: 'background-color 0.2s', fontFamily: 'inherit',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = GOLD_LIGHT)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = GOLD)}
                  >
                    Save Information <ArrowRight style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Hotel Name',            value: hotelInfo.name,                                          span: false },
                  { label: 'Email Address',          value: hotelInfo.email,                                         span: false },
                  { label: 'Address',                value: hotelInfo.address,                                       span: true  },
                  { label: 'Phone Number',           value: hotelInfo.phone,                                         span: false },
                  { label: 'Check-in / Check-out',   value: `${hotelInfo.checkInTime} / ${hotelInfo.checkOutTime}`,  span: false },
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      gridColumn: item.span ? '1 / -1' : 'auto',
                      padding: '12px 16px',
                      border: `0.5px solid ${BORDER_LIGHT}`,
                      backgroundColor: 'rgba(196,160,90,0.025)',
                    }}
                  >
                    <div style={{ ...labelSt, marginBottom: 5 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: TEXT_DARK, fontWeight: 500 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════
            SYSTEM STATUS CARD (dark)
            ══════════════════════════════════════════ */}
        <div style={{
          backgroundColor: DARK_BG,
          border: `0.5px solid rgba(196,160,90,0.18)`,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 2px 14px rgba(10,8,4,0.15)',
        }}>
          {/* Header */}
          <div style={{
            padding: '18px 24px',
            borderBottom: `0.5px solid ${BORDER_DARK}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Server style={{ width: 14, height: 14, color: GOLD }} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD }}>
              System Status
            </span>
          </div>

          {/* Services */}
          <div style={{ padding: '20px 24px', flex: 1 }}>
            {services.map((svc, i) => (
              <div
                key={svc.label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 0',
                  borderBottom: i < services.length - 1 ? `0.5px solid ${BORDER_DARK}` : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: svc.ok ? GOLD : '#d97070' }}>{svc.icon}</span>
                  <span style={{ fontSize: 12, color: TEXT_LIGHT }}>{svc.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    display: 'block', width: 6, height: 6, borderRadius: '50%',
                    backgroundColor: svc.ok ? '#4a9c6a' : '#d97070',
                    boxShadow: svc.ok
                      ? '0 0 6px rgba(74,156,106,0.55)'
                      : '0 0 6px rgba(217,112,112,0.55)',
                  }} />
                  <span style={{
                    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.15em',
                    color: svc.ok ? '#4a9c6a' : '#d97070',
                  }}>
                    {svc.ok ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Overall health footer */}
          <div style={{
            margin: '0 24px 22px',
            padding: '10px 14px',
            border: `0.5px solid ${allOnline ? 'rgba(74,156,106,0.28)' : 'rgba(217,112,112,0.28)'}`,
            backgroundColor: allOnline ? 'rgba(74,156,106,0.08)' : 'rgba(217,112,112,0.08)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {allOnline
              ? <CheckCircle2 style={{ width: 13, height: 13, color: '#4a9c6a' }} />
              : <XCircle      style={{ width: 13, height: 13, color: '#d97070' }} />}
            <span style={{
              fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em',
              color: allOnline ? '#4a9c6a' : '#d97070',
            }}>
              {allOnline ? 'All systems operational' : 'Degraded performance'}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          AUDIT TRAIL CARD
          ══════════════════════════════════════════ */}
      <div style={{
        backgroundColor: PANEL_BG,
        border: `0.5px solid ${BORDER_LIGHT}`,
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(30,27,20,0.04)',
      }}>

        {/* Card header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px',
          borderBottom: `0.5px solid ${BORDER_LIGHT}`,
          flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield style={{ width: 15, height: 15, color: GOLD }} />
            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD }}>
              Audit Trail
            </span>
            <span style={{
              fontSize: 9, padding: '2px 9px',
              border: `0.5px solid ${GOLD_BORDER}`,
              backgroundColor: GOLD_PALE, color: GOLD,
              letterSpacing: '0.12em',
            }}>
              {auditTrail.length} entries
            </span>
          </div>

          {/* Toolbar right */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search style={{
                position: 'absolute', left: 10, top: '50%',
                transform: 'translateY(-50%)',
                width: 12, height: 12, color: TEXT_MUTED,
              }} />
              <input
                placeholder="Search logs…"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                style={{
                  height: 34, backgroundColor: PAGE_BG,
                  border: `0.5px solid ${BORDER_LIGHT}`,
                  borderRadius: 0, paddingLeft: 30, paddingRight: 10,
                  fontSize: 12, color: TEXT_DARK,
                  fontFamily: 'inherit', outline: 'none', width: 200,
                }}
              />
            </div>

            {/* Status filter pills */}
            <div style={{ display: 'flex', gap: 5 }}>
              {(['All', 'success', 'warning', 'error'] as const).map(f => {
                const isActive = auditFilter === f;
                const st = f !== 'All' ? auditSt(f) : null;
                const col = st?.color || GOLD;
                const bdr = st?.border || GOLD_BORDER;
                const bg  = st?.bg     || GOLD_PALE;
                return (
                  <button
                    key={f}
                    onClick={() => setAuditFilter(f)}
                    style={{
                      padding: '4px 12px', fontSize: 9,
                      textTransform: 'uppercase', letterSpacing: '0.16em',
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
                    {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                );
              })}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchAuditLogs}
              disabled={isLoadingAudit}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 11px', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.16em',
                border: `0.5px solid ${BORDER_LIGHT}`,
                backgroundColor: 'transparent', color: TEXT_MUTED,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = GOLD_BORDER;
                e.currentTarget.style.color = GOLD;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = BORDER_LIGHT;
                e.currentTarget.style.color = TEXT_MUTED;
              }}
            >
              <RefreshCw style={{ width: 11, height: 11, animation: isLoadingAudit ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>

            {/* Delete All */}
            {auditTrail.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.16em',
                  border: '0.5px solid rgba(217,112,112,0.28)',
                  backgroundColor: 'rgba(217,112,112,0.05)',
                  color: '#d97070',
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(217,112,112,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(217,112,112,0.05)')}
              >
                <Trash2 style={{ width: 11, height: 11 }} />
                Delete All
              </button>
            )}
          </div>
        </div>

        {/* Delete-all confirmation inline banner */}
        {showDeleteConfirm && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px',
            backgroundColor: 'rgba(217,112,112,0.06)',
            borderBottom: `0.5px solid rgba(217,112,112,0.22)`,
            flexWrap: 'wrap', gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle style={{ width: 14, height: 14, color: '#d97070' }} />
              <span style={{ fontSize: 12, color: TEXT_WARM }}>
                Delete all <strong>{auditTrail.length}</strong> audit log entries? This cannot be undone.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '6px 14px', fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.16em',
                  border: `0.5px solid ${BORDER_LIGHT}`,
                  backgroundColor: 'transparent', color: TEXT_MUTED,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD_BORDER; e.currentTarget.style.color = GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER_LIGHT; e.currentTarget.style.color = TEXT_MUTED; }}
              >
                Cancel
              </button>
              <button
                onClick={deleteAllAuditLogs}
                style={{
                  padding: '6px 14px', fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.16em',
                  border: '0.5px solid rgba(217,112,112,0.40)',
                  backgroundColor: 'rgba(217,112,112,0.14)',
                  color: '#d97070',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(217,112,112,0.24)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(217,112,112,0.14)')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Trash2 style={{ width: 11, height: 11 }} /> Confirm Delete
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: 440, overflowY: 'auto' }}>
          {/* Sticky column headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1.2fr 1.8fr 1.6fr 110px',
            padding: '10px 24px',
            borderBottom: `0.5px solid ${BORDER_LIGHT}`,
            backgroundColor: 'rgba(196,160,90,0.04)',
            position: 'sticky', top: 0, zIndex: 1,
          }}>
            {['Action', 'User', 'Target', 'Timestamp', 'Status'].map(col => (
              <span key={col} style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.22em', color: TEXT_MUTED,
              }}>
                {col}
              </span>
            ))}
          </div>

          {/* Loading */}
          {isLoadingAudit && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <RefreshCw style={{ width: 20, height: 20, color: GOLD, margin: '0 auto 12px', opacity: 0.5, animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.24em', color: TEXT_MUTED }}>
                Loading logs…
              </p>
            </div>
          )}

          {/* Empty */}
          {!isLoadingAudit && filteredAudit.length === 0 && (
            <div style={{ padding: '52px 24px', textAlign: 'center' }}>
              <Shield style={{ width: 24, height: 24, color: GOLD, margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.24em', color: TEXT_MUTED, marginBottom: 4 }}>
                No audit logs found
              </p>
              <p style={{ fontSize: 11, color: 'rgba(61,53,38,0.3)' }}>
                {auditTrail.length > 0 ? 'Try adjusting your search or filters' : 'Actions will be logged here automatically'}
              </p>
            </div>
          )}

          {/* Rows */}
          {!isLoadingAudit && filteredAudit.map((entry, i) => {
            const st      = auditSt(entry.status);
            const isHover = hoveredAudit === entry.id;
            const isLast  = i === filteredAudit.length - 1;

            return (
              <div
                key={entry.id}
                onMouseEnter={() => setHoveredAudit(entry.id)}
                onMouseLeave={() => setHoveredAudit(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1.2fr 1.8fr 1.6fr 110px',
                  padding: '13px 24px',
                  borderBottom: isLast ? 'none' : `0.5px solid ${BORDER_LIGHT}`,
                  backgroundColor: isHover ? 'rgba(196,160,90,0.03)' : 'transparent',
                  transition: 'background-color 0.15s',
                  alignItems: 'center',
                }}
              >
                {/* Action */}
                <div style={{ paddingRight: 12 }}>
                  <div style={{ fontSize: 12, color: TEXT_DARK, fontWeight: 500 }}>
                    {entry.action}
                  </div>
                  {entry.details && (
                    <div style={{ fontSize: 10, color: TEXT_MUTED, marginTop: 2, fontWeight: 400 }}>
                      {entry.details}
                    </div>
                  )}
                </div>

                {/* User */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, paddingRight: 12 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%',
                    backgroundColor: GOLD_PALE,
                    border: `0.5px solid ${GOLD_BORDER}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, color: GOLD,
                    fontFamily: 'Georgia, serif', fontStyle: 'italic', flexShrink: 0,
                  }}>
                    {(entry.user_name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: 12, color: TEXT_WARM }}>{entry.user_name}</span>
                </div>

                {/* Target */}
                <div style={{
                  fontSize: 11, color: TEXT_MUTED, paddingRight: 12,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {entry.target}
                </div>

                {/* Timestamp */}
                <div style={{ fontSize: 11, color: TEXT_MUTED }}>
                  {new Date(entry.created_at).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: 'numeric', minute: '2-digit',
                  })}
                </div>

                {/* Status */}
                <div>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em',
                    padding: '3px 10px',
                    border: `0.5px solid ${st.border}`,
                    backgroundColor: st.bg, color: st.color,
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: '50%',
                      backgroundColor: st.color, display: 'block', flexShrink: 0,
                    }} />
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;