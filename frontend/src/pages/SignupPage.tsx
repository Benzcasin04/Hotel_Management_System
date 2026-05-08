import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Hotel, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

// ── Design Tokens — mirrors LoginPage exactly ──────────────────
const GOLD         = '#c4a05a';
const GOLD_LIGHT   = '#d4b06a';
const GOLD_PALE    = 'rgba(196,160,90,0.10)';
const GOLD_BORDER  = 'rgba(196,160,90,0.30)';

// Warm mid-tone palette — same as LoginPage
const PAGE_BG      = '#2a2318';   // warm dark brown
const CARD_BG      = '#322b1e';   // warm card surface
const CARD_SURFACE = '#3a3224';   // input fill
const CARD_FOCUS   = '#3e3528';   // focused input fill

const TEXT_LIGHT   = '#f0ead6';
const TEXT_MUTED   = 'rgba(240,220,185,0.50)';
const TEXT_DIM     = 'rgba(240,220,185,0.28)';

const BORDER_SUBTLE = 'rgba(240,220,185,0.10)';
const BORDER_FOCUS  = 'rgba(196,160,90,0.60)';

// ── Shared input base style ────────────────────────────────────
const inputBase: React.CSSProperties = {
  backgroundColor: CARD_SURFACE,
  border:          `0.5px solid ${BORDER_SUBTLE}`,
  borderRadius:    0,
  color:           TEXT_LIGHT,
  fontSize:        13,
  height:          46,
  outline:         'none',
  transition:      'border-color 0.2s, background-color 0.2s',
  width:           '100%',
  fontFamily:      'inherit',
};

// ── Eye toggle sub-component ───────────────────────────────────
const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    style={{
      position:  'absolute',
      right:     14, top: '50%',
      transform: 'translateY(-50%)',
      background: 'none', border: 'none',
      cursor:     'pointer',
      color:      TEXT_DIM,
      display:    'flex', alignItems: 'center',
      transition: 'color 0.2s',
    }}
    onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
    onMouseLeave={e => (e.currentTarget.style.color = TEXT_DIM)}
  >
    {show ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
  </button>
);

// ── Component ──────────────────────────────────────────────────
const SignupPage = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [isLoading,           setIsLoading]           = useState(false);
  const [showPassword,        setShowPassword]        = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focused,             setFocused]             = useState<string | null>(null);

  const { signup } = useAuth();
  const navigate   = useNavigate();
  const { toast }  = useToast();

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await signup({
        name:     form.name,
        email:    form.email,
        phone:    form.phone,
        password: form.password,
      });

      if (result.success) {
        toast({ title: 'Account created!', description: 'Welcome to LuxeStay.' });
        navigate('/dashboard');
      } else {
        const msg = result.error?.toLowerCase() || '';
        if (msg.includes('429') || msg.includes('rate limit') || msg.includes('too many')) {
          toast({
            title: 'Please wait',
            description: 'Too many attempts. Wait 60 seconds and try again.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Signup failed', description: result.error, variant: 'destructive' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fieldBorder = (field: string) => focused === field ? BORDER_FOCUS : BORDER_SUBTLE;
  const fieldBg     = (field: string) => focused === field ? CARD_FOCUS   : CARD_SURFACE;

  // ── Render ──────────────────────────────────────────────────
  return (
    <div style={{
      minHeight:       '100vh',
      backgroundColor: PAGE_BG,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '48px 24px',
      position:        'relative',
      overflow:        'hidden',
      fontFamily:      "'Jost', 'DM Sans', sans-serif",
    }}>

      {/* ── Grid texture ─────────────────────────────────── */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: [
          'repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(196,160,90,0.03) 80px)',
          'repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(196,160,90,0.03) 80px)',
        ].join(','),
      }} />

      {/* ── Central ambient glow ─────────────────────────── */}
      <div style={{
        position:   'absolute',
        top: '45%', left: '50%',
        transform:  'translate(-50%, -50%)',
        width: 700, height: 600,
        background: 'radial-gradient(ellipse, rgba(196,160,90,0.07) 0%, transparent 68%)',
        pointerEvents: 'none',
      }} />

      {/* ── Side warm light ──────────────────────────────── */}
      <div style={{
        position: 'absolute', left: 0, top: '15%', bottom: '15%', width: '30%',
        background: 'linear-gradient(to right, rgba(196,160,90,0.03) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', right: 0, top: '15%', bottom: '15%', width: '30%',
        background: 'linear-gradient(to left, rgba(196,160,90,0.03) 0%, transparent 100%)',
        pointerEvents: 'none',
      }} />

      {/* ════════════════════════════════════════════
          CARD
          ════════════════════════════════════════ */}
      <div style={{
        position:        'relative',
        width:           '100%',
        maxWidth:        460,
        backgroundColor: CARD_BG,
        border:          `0.5px solid rgba(196,160,90,0.18)`,
        padding:         '48px 44px 44px',
        boxShadow:       '0 24px 80px rgba(8,6,3,0.45), 0 4px 20px rgba(8,6,3,0.25)',
      }}>

        {/* ── Corner brackets ─────────────────────────── */}
        {[
          { top: 14,    left: 14,  bTop: true,  bLeft:  true,  bBot: false, bRight: false },
          { top: 14,    right: 14, bTop: true,  bRight: true,  bBot: false, bLeft:  false },
          { bottom: 14, left: 14,  bBot: true,  bLeft:  true,  bTop: false, bRight: false },
          { bottom: 14, right: 14, bBot: true,  bRight: true,  bTop: false, bLeft:  false },
        ].map((c, i) => (
          <div key={i} style={{
            position:          'absolute',
            width:  22, height: 22,
            top:    c.top,    left:   c.left,
            bottom: c.bottom, right:  c.right,
            borderTopWidth:    c.bTop  ? '0.5px' : 0,
            borderLeftWidth:   c.bLeft ? '0.5px' : 0,
            borderBottomWidth: c.bBot  ? '0.5px' : 0,
            borderRightWidth:  c.bRight ? '0.5px' : 0,
            borderStyle:       'solid',
            borderColor:       GOLD_BORDER,
          }} />
        ))}

        {/* ── Card header ──────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 30 }}>

          {/* Hotel icon */}
          <div style={{
            width: 52, height: 52,
            border:          `0.5px solid ${GOLD_BORDER}`,
            backgroundColor: GOLD_PALE,
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            margin:          '0 auto 20px',
          }}>
            <Hotel style={{ width: 22, height: 22, color: GOLD }} />
          </div>

          {/* Eyebrow */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            10, marginBottom: 14,
          }}>
            <span style={{ display: 'block', height: 1, width: 24, background: GOLD, opacity: 0.6 }} />
            <span style={{
              fontSize:      9, textTransform: 'uppercase',
              letterSpacing: '0.34em', color: GOLD,
            }}>
              LuxeStay
            </span>
            <span style={{ display: 'block', height: 1, width: 24, background: GOLD, opacity: 0.6 }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontFamily:    'Georgia, "Times New Roman", serif',
            fontSize:      '1.9rem', fontWeight: 300,
            letterSpacing: '-0.02em', color: TEXT_LIGHT,
            lineHeight:    1.1, marginBottom: 8,
          }}>
            Create{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>Account</span>
          </h1>
          <p style={{ fontSize: 12, color: TEXT_MUTED, letterSpacing: '0.03em' }}>
            Join LuxeStay for an exclusive experience
          </p>
        </div>

        {/* ── Divider ──────────────────────────────────── */}
        <div style={{ height: '0.5px', background: BORDER_SUBTLE, marginBottom: 26 }} />

        {/* ── Form ─────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Name + Phone — 2-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.22em', color: TEXT_MUTED,
              }}>
                Full Name
              </label>
              <Input
                id="name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Alexandra"
                required
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(null)}
                style={{ ...inputBase, borderColor: fieldBorder('name'), backgroundColor: fieldBg('name') }}
                className="placeholder:text-[rgba(240,220,185,0.16)] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Phone */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.22em', color: TEXT_MUTED,
              }}>
                Phone
              </label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+63 9XX"
                required
                onFocus={() => setFocused('phone')}
                onBlur={() => setFocused(null)}
                style={{ ...inputBase, borderColor: fieldBorder('phone'), backgroundColor: fieldBg('phone') }}
                className="placeholder:text-[rgba(240,220,185,0.16)] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{
              fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.22em', color: TEXT_MUTED,
            }}>
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="your@email.com"
              required
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              style={{ ...inputBase, borderColor: fieldBorder('email'), backgroundColor: fieldBg('email') }}
              className="placeholder:text-[rgba(240,220,185,0.16)] focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label style={{
              fontSize: 9, textTransform: 'uppercase',
              letterSpacing: '0.22em', color: TEXT_MUTED,
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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
                className="placeholder:text-[rgba(240,220,185,0.16)] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <EyeToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
            </div>
          </div>

          {/* Confirm Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{
                fontSize: 9, textTransform: 'uppercase',
                letterSpacing: '0.22em', color: TEXT_MUTED,
              }}>
                Confirm Password
              </label>
              {/* Inline match indicator */}
              {form.confirmPassword.length > 0 && (
                <span style={{
                  fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.16em',
                  color: form.password === form.confirmPassword ? '#4a9c6a' : '#d97070',
                  transition: 'color 0.2s',
                }}>
                  {form.password === form.confirmPassword ? '✓ Matches' : '✗ No match'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="••••••••"
                required
                onFocus={() => setFocused('confirm')}
                onBlur={() => setFocused(null)}
                style={{
                  ...inputBase,
                  borderColor: form.confirmPassword.length > 0
                    ? form.password === form.confirmPassword
                      ? 'rgba(74,156,106,0.50)'
                      : 'rgba(217,112,112,0.50)'
                    : fieldBorder('confirm'),
                  backgroundColor: fieldBg('confirm'),
                  paddingRight:    48,
                }}
                className="placeholder:text-[rgba(240,220,185,0.16)] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: '0.5px', background: BORDER_SUBTLE }} />

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             10,
              backgroundColor: isLoading ? 'rgba(196,160,90,0.50)' : GOLD,
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
                  display:        'block',
                  width: 13, height: 13,
                  borderRadius:   '50%',
                  border:         '2px solid rgba(12,11,9,0.35)',
                  borderTopColor: '#0c0b09',
                  animation:      'spin 0.8s linear infinite',
                }} />
                Creating Account…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight style={{ width: 13, height: 13 }} />
              </>
            )}
          </button>
        </form>

        {/* ── Footer link ───────────────────────────────── */}
        <p style={{
          marginTop:  22,
          textAlign:  'center',
          fontSize:   12,
          color:      TEXT_DIM,
          lineHeight: 1.6,
        }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{
              color:          GOLD,
              textDecoration: 'none',
              letterSpacing:  '0.03em',
              transition:     'opacity 0.2s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '0.7')}
            onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.opacity = '1')}
          >
            Sign In
          </Link>
        </p>

        {/* ── Bottom decorative rule ────────────────────── */}
        <div style={{
          display:        'flex',
          alignItems:     'center',
          gap:            10,
          marginTop:      26,
          paddingTop:     18,
          borderTop:      `0.5px solid ${BORDER_SUBTLE}`,
          justifyContent: 'center',
        }}>
          <span style={{ display: 'block', height: 1, width: 28, background: 'rgba(196,160,90,0.22)' }} />
          <span style={{
            fontSize: 8, textTransform: 'uppercase',
            letterSpacing: '0.3em', color: 'rgba(196,160,90,0.30)',
          }}>
            Premium Accommodations
          </span>
          <span style={{ display: 'block', height: 1, width: 28, background: 'rgba(196,160,90,0.22)' }} />
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SignupPage;