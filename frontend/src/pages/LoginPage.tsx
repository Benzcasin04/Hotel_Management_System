import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Hotel, Eye, EyeOff, ArrowRight } from 'lucide-react';

// ── Design Tokens ──────────────────────────────────────────────
const GOLD         = '#c4a05a';
const GOLD_LIGHT   = '#d4b06a';
const GOLD_PALE    = 'rgba(196,160,90,0.10)';
const GOLD_BORDER  = 'rgba(196,160,90,0.30)';

// Warm mid-tone palette — the key balance point
const PAGE_BG      = '#2a2318';   // warm dark brown — rich but not pitch black
const CARD_BG      = '#322b1e';   // slightly lighter warm panel
const CARD_SURFACE = '#3a3224';   // input backgrounds

const TEXT_LIGHT   = '#f0ead6';
const TEXT_MUTED   = 'rgba(240,220,185,0.50)';
const TEXT_DIM     = 'rgba(240,220,185,0.28)';

const BORDER_SUBTLE = 'rgba(240,220,185,0.10)';
const BORDER_FOCUS  = 'rgba(196,160,90,0.60)';

// ── Input style ────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
  backgroundColor: CARD_SURFACE,
  border:          `0.5px solid ${BORDER_SUBTLE}`,
  borderRadius:    0,
  color:           TEXT_LIGHT,
  fontSize:        13,
  height:          48,
  outline:         'none',
  transition:      'border-color 0.2s, background-color 0.2s',
  width:           '100%',
  fontFamily:      'inherit',
};

const LoginPage = () => {
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focused,      setFocused]      = useState<string | null>(null);
  const [isLoading,    setIsLoading]    = useState(false);
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const { toast }    = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      const role = (result.role || 'user').toLowerCase();
      if (role === 'admin')       navigate('/admin',     { replace: true });
      else if (role === 'staff')  navigate('/staff',     { replace: true });
      else                        navigate('/dashboard', { replace: true });
    } else {
      toast({ title: 'Login failed', description: result.error, variant: 'destructive' });
    }
  };

  const fieldBorder = (field: string) =>
    focused === field ? BORDER_FOCUS : BORDER_SUBTLE;

  const fieldBg = (field: string) =>
    focused === field ? '#3e3528' : CARD_SURFACE;

  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: PAGE_BG,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '40px 24px',
      position:        'relative',
      overflow:        'hidden',
      fontFamily:      "'Jost', 'DM Sans', sans-serif",
    }}>

      {/* ── Subtle grid texture ──────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: [
          'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(196,160,90,0.03) 80px)',
          'repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(196,160,90,0.03) 80px)',
        ].join(','),
      }} />

      {/* ── Warm ambient glow — centred, balanced ────────── */}
      <div style={{
        position: 'absolute',
        top: '45%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 700, height: 500,
        background: 'radial-gradient(ellipse, rgba(196,160,90,0.07) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* ── Side ambient panels (subtle warm side-light) ─── */}
      <div style={{
        position: 'absolute', left: 0, top: '20%', bottom: '20%',
        width: '30%',
        background: 'linear-gradient(to right, rgba(196,160,90,0.03) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: '20%', bottom: '20%',
        width: '30%',
        background: 'linear-gradient(to left, rgba(196,160,90,0.03) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ════════════════════════════════════════════
          CARD
          ════════════════════════════════════════ */}
      <div style={{
        position:        'relative',
        width:           '100%',
        maxWidth:        440,
        backgroundColor: CARD_BG,
        border:          `0.5px solid rgba(196,160,90,0.18)`,
        padding:         '52px 44px 48px',
        boxShadow:       '0 24px 80px rgba(8,6,3,0.45), 0 4px 20px rgba(8,6,3,0.25)',
      }}>

        {/* ── Corner brackets ─────────────────────────────── */}
        {[
          { top: 14, left: 14,  borderTop: true,    borderLeft: true,  borderBottom: false, borderRight: false },
          { top: 14, right: 14, borderTop: true,    borderRight: true, borderBottom: false, borderLeft: false  },
          { bottom: 14, left: 14,  borderBottom: true, borderLeft: true,  borderTop: false, borderRight: false  },
          { bottom: 14, right: 14, borderBottom: true, borderRight: true, borderTop: false, borderLeft: false   },
        ].map((corner, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              width: 22, height: 22,
              top: corner.top,
              left: corner.left,
              bottom: corner.bottom,
              right: corner.right,
              borderTopWidth:    corner.borderTop    ? '0.5px' : '0',
              borderLeftWidth:   corner.borderLeft   ? '0.5px' : '0',
              borderBottomWidth: corner.borderBottom ? '0.5px' : '0',
              borderRightWidth:  corner.borderRight  ? '0.5px' : '0',
              borderStyle: 'solid',
              borderColor: GOLD_BORDER,
            }}
          />
        ))}

        {/* ── Card header ─────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>

          {/* Hotel icon */}
          <div style={{
            width:  52, height: 52,
            border: `0.5px solid ${GOLD_BORDER}`,
            backgroundColor: GOLD_PALE,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            margin:         '0 auto 22px',
          }}>
            <Hotel style={{ width: 22, height: 22, color: GOLD }} />
          </div>

          {/* Eyebrow — line · LUXESTAY · line */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            10,
            marginBottom:   16,
          }}>
            <span style={{ display: 'block', height: 1, width: 24, background: GOLD, opacity: 0.6 }} />
            <span style={{
              fontSize:       9,
              textTransform:  'uppercase',
              letterSpacing:  '0.34em',
              color:          GOLD,
            }}>
              LuxeStay
            </span>
            <span style={{ display: 'block', height: 1, width: 24, background: GOLD, opacity: 0.6 }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily:    'Georgia, "Times New Roman", serif',
            fontSize:      '2rem',
            fontWeight:    300,
            letterSpacing: '-0.02em',
            color:         TEXT_LIGHT,
            lineHeight:    1.1,
            marginBottom:  10,
          }}>
            Welcome{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>Back</span>
          </h1>
          <p style={{ fontSize: 12, color: TEXT_MUTED, letterSpacing: '0.03em' }}>
            Sign in to your LuxeStay account
          </p>
        </div>

        {/* ── Divider ─────────────────────────────────────── */}
        <div style={{ height: '0.5px', background: BORDER_SUBTLE, marginBottom: 32 }} />

        {/* ── Form ────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>

          {/* Email field */}
          <div>
            <label style={{
              fontSize:      9,
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              color:         TEXT_MUTED,
              display:       'block',
              marginBottom:  8,
            }}>
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={{
                ...inputBase,
                borderColor:     fieldBorder('email'),
                backgroundColor: fieldBg('email'),
              }}
              className="placeholder:text-[rgba(240,220,185,0.18)] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Password field */}
          <div>
            <label style={{
              fontSize:      9,
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              color:         TEXT_MUTED,
              display:       'block',
              marginBottom:  8,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                style={{
                  ...inputBase,
                  borderColor:     fieldBorder('password'),
                  backgroundColor: fieldBg('password'),
                  paddingRight:    48,
                }}
                className="placeholder:text-[rgba(240,220,185,0.18)] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              {/* Show / hide toggle */}
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{
                  position:  'absolute',
                  right:     14, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor:    'pointer',
                  color:     TEXT_DIM,
                  display:   'flex', alignItems: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
                onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}
              >
                {showPassword
                  ? <EyeOff style={{ width: 15, height: 15 }} />
                  : <Eye    style={{ width: 15, height: 15 }} />}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '0.5px', background: BORDER_SUBTLE }} />

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             10,
              backgroundColor: isLoading ? 'rgba(196,160,90,0.5)' : GOLD,
              padding:         '15px 24px',
              fontSize:        10,
              textTransform:   'uppercase',
              letterSpacing:   '0.26em',
              fontWeight:      700,
              color:           '#0c0b09',
              border:          'none',
              cursor:          isLoading ? 'not-allowed' : 'pointer',
              width:           '100%',
              transition:      'background-color 0.2s',
              fontFamily:      'inherit',
            }}
            onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = GOLD_LIGHT; }}
            onMouseLeave={e => { if (!isLoading) e.currentTarget.style.backgroundColor = GOLD; }}
          >
            {isLoading ? (
              <>
                <span style={{
                  display:       'block',
                  width:         13, height: 13,
                  borderRadius:  '50%',
                  border:        '2px solid rgba(12,11,9,0.35)',
                  borderTopColor: '#0c0b09',
                  animation:     'spin 0.8s linear infinite',
                }} />
                Signing In…
              </>
            ) : (
              <>
                Sign In
                <ArrowRight style={{ width: 13, height: 13 }} />
              </>
            )}
          </button>
        </form>

        {/* ── Footer ──────────────────────────────────────── */}
        <p style={{
          marginTop:  24,
          textAlign:  'center',
          fontSize:   12,
          color:      TEXT_DIM,
          lineHeight: 1.6,
        }}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            style={{
              color:          GOLD,
              textDecoration: 'none',
              letterSpacing:  '0.03em',
              transition:     'opacity 0.2s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.7')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
          >
            Create Account
          </Link>
        </p>

        {/* ── Bottom decorative rule ───────────────────────── */}
        <div style={{
          display:     'flex',
          alignItems:  'center',
          gap:         10,
          marginTop:   28,
          paddingTop:  20,
          borderTop:   `0.5px solid ${BORDER_SUBTLE}`,
          justifyContent: 'center',
        }}>
          <span style={{ display: 'block', height: 1, width: 28, background: 'rgba(196,160,90,0.22)' }} />
          <span style={{ fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'rgba(196,160,90,0.30)' }}>
            Premium Accommodations
          </span>
          <span style={{ display: 'block', height: 1, width: 28, background: 'rgba(196,160,90,0.22)' }} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;