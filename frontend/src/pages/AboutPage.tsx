import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-hotel.jpg';
import { Award, Users, Globe, Heart, ArrowRight } from 'lucide-react';

// ── Design tokens (mirrors ContactPage & Navbar palette) ──────
const C = {
  cream:       '#f5f0e8',
  warmWhite:   '#faf8f3',
  surfaceWarm: '#fdf9f4',
  surface:     '#ffffff',
  gold:        '#b8924a',
  goldLight:   '#d4aa6a',
  goldPale:    '#e8d5a8',
  charcoal:    '#2a2520',
  brownMid:    '#5a4a38',
  brownSoft:   '#8a7562',
  textBody:    '#3d3028',
  textMuted:   '#7a6a58',
  border:      'rgba(90,74,56,0.13)',
  borderGold:  'rgba(184,146,74,0.30)',
  shadow:      '0 2px 32px rgba(42,37,32,0.07), 0 1px 4px rgba(42,37,32,0.04)',
};

// ── Small reusable tag ────────────────────────────────────────
const EyebrowTag = ({
  text,
  center = false,
}: {
  text: string;
  center?: boolean;
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: center ? 'center' : 'flex-start',
    gap: 10,
    marginBottom: 18,
  }}>
    <span style={{ display: 'block', height: '0.5px', width: center ? 28 : 20, background: C.gold, opacity: 0.7 }} />
    <span style={{ fontSize: 9, letterSpacing: '0.32em', textTransform: 'uppercase' as const, color: C.gold, fontWeight: 600 }}>
      {text}
    </span>
    {center && <span style={{ display: 'block', height: '0.5px', width: 28, background: C.gold, opacity: 0.7 }} />}
  </div>
);

const AboutPage = () => {
  return (
    <div
      className="animate-fade-in"
      style={{ backgroundColor: C.warmWhite, color: C.textBody, fontFamily: 'sans-serif' }}
    >

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', height: 380, overflow: 'hidden' }}>
        <img
          src={heroImage}
          alt="About LuxeStay"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: 'scale(1.06)',
          }}
          width={1920}
          height={1080}
        />

        {/* Warm cinematic overlay — lighter than original */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 90% 80% at 50% 60%, rgba(42,37,32,0.42) 0%, rgba(42,37,32,0.78) 100%)',
        }} />

        {/* Top rule */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(184,146,74,0.45), transparent)`,
        }} />

        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 24, left: 24, width: 22, height: 22, borderTop: `0.5px solid ${C.borderGold}`, borderLeft: `0.5px solid ${C.borderGold}` }} />
        <div style={{ position: 'absolute', top: 24, right: 24, width: 22, height: 22, borderTop: `0.5px solid ${C.borderGold}`, borderRight: `0.5px solid ${C.borderGold}` }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, width: 22, height: 22, borderBottom: `0.5px solid ${C.borderGold}`, borderLeft: `0.5px solid ${C.borderGold}` }} />
        <div style={{ position: 'absolute', bottom: 24, right: 24, width: 22, height: 22, borderBottom: `0.5px solid ${C.borderGold}`, borderRight: `0.5px solid ${C.borderGold}` }} />

        {/* Content */}
        <div style={{
          position: 'relative', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center',
        }}>
          <div>
            <EyebrowTag text="Our Story" center />
            <h1 style={{
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: 'clamp(2.4rem, 5vw, 4rem)',
              fontWeight: 300,
              letterSpacing: '-0.02em',
              color: C.cream,
              lineHeight: 1.05,
            }}>
              About <span style={{ fontStyle: 'italic', color: C.goldLight }}>LuxeStay</span>
            </h1>
            <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(245,240,232,0.5)', letterSpacing: '0.05em' }}>
              Our story, our mission, our promise
            </p>
          </div>
        </div>

        {/* Bottom rule */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(184,146,74,0.3), transparent)`,
        }} />
      </section>


      {/* ── STORY + MISSION ──────────────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: C.warmWhite }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: 48, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

            {/* Our Story */}
            <div style={{
              background: C.surface,
              border: `0.5px solid ${C.border}`,
              boxShadow: C.shadow,
              padding: '36px 32px',
              position: 'relative',
            }}>
              {/* Gold top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, transparent)`,
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ display: 'block', height: '0.5px', width: 20, background: C.gold }} />
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: C.gold, fontWeight: 600 }}>01</span>
              </div>

              <h2 style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: '1.75rem',
                fontWeight: 300,
                color: C.charcoal,
                marginBottom: 20,
                lineHeight: 1.15,
              }}>
                Our <span style={{ fontStyle: 'italic', color: C.gold }}>Story</span>
              </h2>

              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.85, marginBottom: 14 }}>
                Founded in 2020, LuxeStay was born from a passion for exceptional hospitality. What started as a boutique hotel has grown into a premier destination for travelers seeking comfort, elegance, and memorable experiences.
              </p>
              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.85 }}>
                Every detail at LuxeStay is crafted with care — from our hand-selected linens to our curated dining experiences. We believe luxury should be accessible, personal, and unforgettable.
              </p>

              {/* Bottom accent */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: `0.5px solid ${C.border}` }}>
                <p style={{
                  fontFamily: 'Georgia, Times New Roman, serif',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  color: C.brownSoft,
                  lineHeight: 1.6,
                }}>
                  "Luxury should be accessible, personal, and unforgettable."
                </p>
              </div>
            </div>

            {/* Our Mission */}
            <div style={{
              background: C.surface,
              border: `0.5px solid ${C.border}`,
              boxShadow: C.shadow,
              padding: '36px 32px',
              position: 'relative',
            }}>
              {/* Gold top bar */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight}, transparent)`,
              }} />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <span style={{ display: 'block', height: '0.5px', width: 20, background: C.gold }} />
                <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: C.gold, fontWeight: 600 }}>02</span>
              </div>

              <h2 style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: '1.75rem',
                fontWeight: 300,
                color: C.charcoal,
                marginBottom: 20,
                lineHeight: 1.15,
              }}>
                Our <span style={{ fontStyle: 'italic', color: C.gold }}>Mission</span>
              </h2>

              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.85, marginBottom: 14 }}>
                To provide an unparalleled hospitality experience that combines modern comfort with timeless elegance. We strive to make every guest feel at home while experiencing the finest amenities and services.
              </p>
              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.85 }}>
                Our commitment to sustainability and community engagement drives everything we do, from eco-friendly practices to local partnerships.
              </p>

              {/* Bottom accent */}
              <div style={{ marginTop: 28, paddingTop: 20, borderTop: `0.5px solid ${C.border}` }}>
                <p style={{
                  fontFamily: 'Georgia, Times New Roman, serif',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  color: C.brownSoft,
                  lineHeight: 1.6,
                }}>
                  "Every guest deserves to feel at home in the finest surroundings."
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ── STATS ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: C.charcoal, padding: 0 }}>
        {/* Top rule */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(184,146,74,0.35), transparent)` }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '64px 24px' }}>
          <EyebrowTag text="By The Numbers" center />

          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 1,
            background: 'rgba(245,240,232,0.06)',
            border: `0.5px solid rgba(245,240,232,0.06)`,
          }}>
            {[
              { icon: Award,  value: '5+',      label: 'Years of Excellence' },
              { icon: Users,  value: '50,000+',  label: 'Happy Guests'        },
              { icon: Globe,  value: '30+',      label: 'Countries Served'    },
              { icon: Heart,  value: '98%',      label: 'Satisfaction Rate'   },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: C.charcoal,
                  padding: '40px 24px',
                  textAlign: 'center',
                  transition: 'background-color 0.3s',
                  cursor: 'default',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.brownMid)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.charcoal)}
              >
                {/* Icon box */}
                <div style={{
                  width: 42, height: 42,
                  border: `0.5px solid ${C.borderGold}`,
                  background: 'rgba(184,146,74,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 18px',
                }}>
                  <stat.icon style={{ width: 17, height: 17, color: C.gold }} />
                </div>

                {/* Value */}
                <div style={{
                  fontFamily: 'Georgia, Times New Roman, serif',
                  fontSize: '2.2rem',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: C.goldLight,
                  lineHeight: 1,
                  marginBottom: 10,
                }}>
                  {stat.value}
                </div>

                {/* Label */}
                <div style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.22em',
                  color: 'rgba(245,240,232,0.4)',
                  fontWeight: 500,
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, rgba(184,146,74,0.3), transparent)` }} />
      </section>


      {/* ── VALUES STRIP ─────────────────────────────────────── */}
      <section style={{ padding: '80px 24px', backgroundColor: C.warmWhite }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <EyebrowTag text="What We Stand For" />

          <div style={{
            display: 'grid',
            gap: 20,
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          }}>
            {[
              { num: '01', title: 'Excellence',    body: 'Uncompromising standards in every aspect of your stay, from arrival to departure.' },
              { num: '02', title: 'Sustainability', body: 'Eco-conscious practices woven into our operations without sacrificing comfort.' },
              { num: '03', title: 'Community',      body: 'Deep ties with local artisans, farmers, and partners who shape our identity.' },
            ].map((v, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: C.surface,
                  border: `0.5px solid ${C.border}`,
                  boxShadow: C.shadow,
                  padding: '28px 24px',
                  position: 'relative',
                  transition: 'border-color 0.3s, box-shadow 0.3s',
                  cursor: 'default',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = C.borderGold;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 4px 24px rgba(184,146,74,0.1)`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow;
                }}
              >
                {/* Hover gold bottom bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, ${C.gold}, ${C.goldLight})`,
                  transform: 'scaleX(0)',
                  transformOrigin: 'left',
                  transition: 'transform 0.3s ease',
                }} />

                <span style={{
                  fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.25em',
                  color: C.gold, display: 'block', marginBottom: 12, fontWeight: 600,
                }}>
                  {v.num}
                </span>

                <h3 style={{
                  fontFamily: 'Georgia, Times New Roman, serif',
                  fontSize: '1.15rem',
                  fontWeight: 300,
                  fontStyle: 'italic',
                  color: C.charcoal,
                  marginBottom: 12,
                }}>
                  {v.title}
                </h3>

                <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.75 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA ───────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        padding: '88px 24px',
        textAlign: 'center',
        backgroundColor: C.surfaceWarm,
        overflow: 'hidden',
        borderTop: `0.5px solid ${C.border}`,
        borderBottom: `0.5px solid ${C.border}`,
      }}>
        {/* Subtle warm grid texture */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 59px, ${C.border} 60px),
                            repeating-linear-gradient(90deg, transparent, transparent 59px, ${C.border} 60px)`,
          opacity: 0.4,
        }} />

        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 24, left: 24, width: 22, height: 22, borderTop: `0.5px solid ${C.borderGold}`, borderLeft: `0.5px solid ${C.borderGold}` }} />
        <div style={{ position: 'absolute', top: 24, right: 24, width: 22, height: 22, borderTop: `0.5px solid ${C.borderGold}`, borderRight: `0.5px solid ${C.borderGold}` }} />
        <div style={{ position: 'absolute', bottom: 24, left: 24, width: 22, height: 22, borderBottom: `0.5px solid ${C.borderGold}`, borderLeft: `0.5px solid ${C.borderGold}` }} />
        <div style={{ position: 'absolute', bottom: 24, right: 24, width: 22, height: 22, borderBottom: `0.5px solid ${C.borderGold}`, borderRight: `0.5px solid ${C.borderGold}` }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <EyebrowTag text="Begin Your Journey" center />

          <h2 style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 'clamp(1.8rem, 4vw, 3rem)',
            fontWeight: 300,
            letterSpacing: '-0.02em',
            color: C.charcoal,
            lineHeight: 1.1,
            marginBottom: 16,
          }}>
            Ready to Experience<br />
            <span style={{ fontStyle: 'italic', color: C.gold }}>LuxeStay?</span>
          </h2>

          <p style={{
            fontSize: 13,
            color: C.textMuted,
            maxWidth: 400,
            margin: '0 auto 36px',
            lineHeight: 1.8,
          }}>
            Book your stay today and discover what makes us special.
          </p>

          <Link
            to="/rooms"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: C.charcoal,
              padding: '15px 36px',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.22em',
              fontWeight: 500,
              color: C.cream,
              textDecoration: 'none',
              transition: 'background-color 0.25s',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.brownMid)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.charcoal)}
          >
            Explore Rooms
            <ArrowRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;