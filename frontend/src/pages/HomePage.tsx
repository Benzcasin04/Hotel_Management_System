import { Link } from 'react-router-dom';
import { Star, Shield, Clock, Wifi, ArrowRight, ChevronDown } from 'lucide-react';
import heroImage from '@/assets/hero-hotel.jpg';
import roomLuxury from '@/assets/room-luxury.jpg';
import roomPresidential from '@/assets/room-presidential.jpg';
import roomSuite from '@/assets/room-suite.jpg';

const HomePage = () => {
  return (
    <div className="animate-fade-in" style={{ fontFamily: "'Georgia', serif", background: '#f7f3ee', color: '#1a1612' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: '680px', overflow: 'hidden' }}>
        <img
          src={heroImage}
          alt="LuxeStay Hotel Lobby"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', animation: 'slowZoom 20s ease-in-out infinite alternate',
          }}
        />

        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(26,22,18,0.72) 0%, rgba(26,22,18,0.45) 50%, rgba(139,100,52,0.3) 100%)',
        }} />

        {/* Gold top rule */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

        {/* Decorative corner frames */}
        <div className="corner-dec" style={{ position: 'absolute', top: '2rem', left: '2rem', width: '48px', height: '48px', borderTop: '1.5px solid rgba(196,160,90,0.6)', borderLeft: '1.5px solid rgba(196,160,90,0.6)' }} />
        <div className="corner-dec" style={{ position: 'absolute', top: '2rem', right: '2rem', width: '48px', height: '48px', borderTop: '1.5px solid rgba(196,160,90,0.6)', borderRight: '1.5px solid rgba(196,160,90,0.6)' }} />
        <div className="corner-dec" style={{ position: 'absolute', bottom: '2rem', left: '2rem', width: '48px', height: '48px', borderBottom: '1.5px solid rgba(196,160,90,0.6)', borderLeft: '1.5px solid rgba(196,160,90,0.6)' }} />
        <div className="corner-dec" style={{ position: 'absolute', bottom: '2rem', right: '2rem', width: '48px', height: '48px', borderBottom: '1.5px solid rgba(196,160,90,0.6)', borderRight: '1.5px solid rgba(196,160,90,0.6)' }} />

        {/* Hero content */}
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '1400px', margin: '0 auto' }} className="hero-pad">
            <div style={{ maxWidth: '700px' }}>

              {/* Eyebrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem' }}>
                <span style={{ display: 'block', height: '1px', width: '40px', background: '#c4a05a' }} />
                <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#c4a05a', fontFamily: 'Georgia, serif' }}>
                  Premium Hotel Experience
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontSize: 'clamp(2.8rem, 7vw, 6.5rem)', fontWeight: 300,
                lineHeight: 1.04, letterSpacing: '-0.025em', color: '#f7f3ee', fontFamily: 'Georgia, serif',
              }}>
                Luxury<br />
                <em style={{ color: '#c4a05a', fontStyle: 'italic' }}>Awaits</em>{' '}
                <span style={{ color: '#f7f3ee' }}>You</span>
              </h1>

              <p style={{
                marginTop: '1.5rem', maxWidth: '440px', fontSize: 'clamp(0.95rem, 1.4vw, 1.1rem)',
                color: 'rgba(247,243,238,0.75)', lineHeight: 1.75, fontFamily: 'Georgia, serif',
              }}>
                Experience world-class hospitality with breathtaking views, exquisite dining,
                and unparalleled comfort at LuxeStay.
              </p>

              {/* CTAs */}
              <div style={{ marginTop: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
                <Link
                  to="/rooms"
                  className="hero-btn-primary"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '12px',
                    background: '#c4a05a', padding: '16px 32px',
                    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em',
                    fontWeight: 700, color: '#1a1612', textDecoration: 'none',
                    transition: 'all 0.3s', fontFamily: 'Georgia, serif',
                  }}
                >
                  Browse Rooms
                  <ArrowRight size={15} />
                </Link>
                <Link
                  to="/about"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '10px',
                    border: '1px solid rgba(247,243,238,0.35)', padding: '16px 32px',
                    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em',
                    fontWeight: 500, color: 'rgba(247,243,238,0.85)', textDecoration: 'none',
                    transition: 'all 0.3s', fontFamily: 'Georgia, serif',
                  }}
                >
                  Learn More
                </Link>
              </div>

              {/* Scroll cue */}
              <div style={{ marginTop: '3.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(247,243,238,0.4)' }}>
                <ChevronDown size={15} style={{ animation: 'bounce 2s infinite' }} />
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.28em' }}>Scroll</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(196,160,90,0.4), transparent)' }} />
      </section>


      {/* ── STATS BAR ── */}
      <section style={{ background: '#2c2418', borderTop: '1px solid rgba(196,160,90,0.2)', borderBottom: '1px solid rgba(196,160,90,0.2)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="section-pad">
          <div className="grid-4 stats-grid" style={{ borderLeft: '1px solid rgba(247,243,238,0.06)' }}>
            {[
              { value: '20+', label: 'Years of Excellence' },
              { value: '150', label: 'Luxury Rooms' },
              { value: '98%', label: 'Guest Satisfaction' },
              { value: '5★', label: 'International Rating' },
            ].map((stat, i) => (
              <div key={i} className="stat-cell" style={{
                padding: '2rem 2.5rem', textAlign: 'center',
                borderRight: '1px solid rgba(247,243,238,0.06)',
              }}>
                <p style={{ fontFamily: 'Georgia, serif', fontSize: '2.2rem', color: '#c4a05a', fontStyle: 'italic', fontWeight: 300 }}>
                  {stat.value}
                </p>
                <p style={{ marginTop: '6px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.22em', color: 'rgba(247,243,238,0.45)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FEATURES ── */}
      <section style={{ padding: '7rem 0', background: '#f7f3ee' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="section-pad">

          {/* Section header */}
          <div className="features-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '4rem' }}>
            <div className="features-title-block">
              <div className="features-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                <span style={{ display: 'block', height: '1px', width: '32px', background: '#c4a05a' }} />
                <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#c4a05a' }}>Our Promise</span>
              </div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: '#1a1612', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
                Why Choose<br />
                <em style={{ color: '#c4a05a' }}>LuxeStay</em>
              </h2>
            </div>
            <p className="features-tagline" style={{ maxWidth: '280px', fontSize: '14px', color: '#8a7d6e', lineHeight: 1.8, textAlign: 'right' }}>
              We redefine hospitality with every detail, every moment, every stay.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid-4" style={{ gap: '1px', background: 'rgba(196,160,90,0.15)', border: '1px solid rgba(196,160,90,0.15)' }}>
            {[
              { icon: Star,   title: '5-Star Service',   desc: 'Award-winning hospitality and deeply personalized service that anticipates your every need.' },
              { icon: Shield, title: 'Secure Booking',   desc: 'Your reservations are confirmed instantly and protected with enterprise-grade security.' },
              { icon: Clock,  title: '24/7 Concierge',   desc: 'Round-the-clock assistance — from restaurant reservations to private transfers.' },
              { icon: Wifi,   title: 'Modern Amenities', desc: 'High-speed Wi-Fi, climate-controlled smart rooms, spa, and rooftop pool.' },
            ].map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{
                  background: '#fff', padding: '2.5rem 2rem',
                  transition: 'background 0.3s, transform 0.3s',
                  cursor: 'default',
                }}
              >
                <div style={{
                  marginBottom: '1.5rem', width: '44px', height: '44px',
                  border: '1px solid rgba(196,160,90,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(196,160,90,0.06)',
                }}>
                  <f.icon size={16} color="#c4a05a" />
                </div>

                <p style={{ fontFamily: 'Georgia, serif', fontSize: '4rem', color: 'rgba(196,160,90,0.08)', fontStyle: 'italic', lineHeight: 1, marginBottom: '0.75rem', userSelect: 'none' }}>
                  0{i + 1}
                </p>

                <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, color: '#1a1612', marginBottom: '0.75rem', fontFamily: 'Georgia, serif' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: '13.5px', color: '#8a7d6e', lineHeight: 1.75 }}>{f.desc}</p>

                <div style={{ marginTop: '1.5rem', height: '2px', width: '0', background: '#c4a05a', transition: 'width 0.4s' }} className="feature-line" />
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ── FEATURED ROOMS ── */}
      <section style={{ background: '#2c2418', padding: '7rem 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="section-pad">

          <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1rem' }}>
              <span style={{ display: 'block', height: '1px', width: '32px', background: '#c4a05a' }} />
              <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#c4a05a' }}>Accommodations</span>
              <span style={{ display: 'block', height: '1px', width: '32px', background: '#c4a05a' }} />
            </div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 300, color: '#f7f3ee', letterSpacing: '-0.02em' }}>
              Featured <em style={{ color: '#c4a05a' }}>Rooms</em>
            </h2>
            <p style={{ marginTop: '1rem', fontSize: '13px', color: 'rgba(247,243,238,0.45)' }}>
              From intimate escapes to grand presidential suites
            </p>
          </div>

          {/* Room cards */}
          <div className="grid-3" style={{ gap: '1.5rem' }}>
            {[
              { img: roomLuxury,       title: 'Deluxe King',        price: '$249', tier: 'Deluxe',       desc: 'Refined comfort with panoramic garden views and a plush king bed.',                        h: '260px' },
              { img: roomSuite,        title: 'Executive Suite',    price: '$399', tier: 'Suite',         desc: 'Spacious retreat with separate living room and exclusive lounge access.',                  h: '320px' },
              { img: roomPresidential, title: 'Presidential Suite', price: '$899', tier: 'Presidential', desc: 'The pinnacle of luxury — private terrace, butler service, and bespoke interiors.',        h: '260px' },
            ].map((room, i) => (
              <div
                key={i}
                className="room-card"
                style={{
                  position: 'relative', overflow: 'hidden',
                  background: '#1a1612', border: '1px solid rgba(247,243,238,0.06)',
                  transition: 'border-color 0.4s, transform 0.4s',
                }}
              >
                <div style={{ position: 'relative', overflow: 'hidden', height: room.h }}>
                  <img
                    src={room.img}
                    alt={room.title}
                    className="room-img"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.7s' }}
                    loading="lazy"
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,22,18,0.88) 0%, transparent 55%)' }} />

                  <div style={{ position: 'absolute', top: '1rem', left: '1rem' }}>
                    <span style={{
                      border: '1px solid rgba(196,160,90,0.55)', background: 'rgba(26,22,18,0.75)',
                      padding: '4px 12px', fontSize: '9px', textTransform: 'uppercase',
                      letterSpacing: '0.25em', color: '#c4a05a', backdropFilter: 'blur(4px)',
                    }}>
                      {room.tier}
                    </span>
                  </div>

                  <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', color: '#f7f3ee', fontStyle: 'italic', fontWeight: 300 }}>
                      {room.price}
                    </span>
                    <span style={{ marginLeft: '4px', fontSize: '11px', color: 'rgba(247,243,238,0.5)' }}>/night</span>
                  </div>
                </div>

                <div style={{ padding: '1.5rem 1.75rem' }}>
                  <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.18em', fontWeight: 700, color: '#f7f3ee', marginBottom: '0.6rem', fontFamily: 'Georgia, serif' }}>
                    {room.title}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(247,243,238,0.5)', lineHeight: 1.75, marginBottom: '1.25rem' }}>{room.desc}</p>
                  <Link
                    to="/rooms"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '8px',
                      fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.22em',
                      color: '#c4a05a', textDecoration: 'none', transition: 'gap 0.3s',
                    }}
                  >
                    View Details <ArrowRight size={12} />
                  </Link>
                </div>

                <div className="room-line" style={{ position: 'absolute', bottom: 0, left: 0, height: '2px', width: '0', background: '#c4a05a', transition: 'width 0.5s' }} />
              </div>
            ))}
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link
              to="/rooms"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '12px',
                border: '1px solid rgba(247,243,238,0.18)', padding: '1rem 2.5rem',
                fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.25em',
                color: 'rgba(247,243,238,0.65)', textDecoration: 'none',
                transition: 'border-color 0.3s, color 0.3s',
              }}
              className="view-all-link"
            >
              View All Accommodations <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </section>


      {/* ── TESTIMONIAL BAND ── */}
      <section className="testimonial-section" style={{ background: '#c4a05a' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)', fontStyle: 'italic', fontWeight: 300, color: '#1a1612', lineHeight: 1.5 }}>
              "The most extraordinary stay of our lives.<br />LuxeStay is in a class of its own."
            </p>
            <p style={{ marginTop: '0.75rem', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(26,22,18,0.6)' }}>
              — James &amp; Clara W., Presidential Suite Guests
            </p>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={20} fill="#1a1612" color="#1a1612" />
            ))}
          </div>
        </div>
      </section>


      {/* ── CTA ── */}
      <section className="cta-section" style={{ position: 'relative', overflow: 'hidden', background: '#f7f3ee' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(196,160,90,0.06) 60px), repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(196,160,90,0.06) 60px)',
        }} />

        <div className="corner-dec" style={{ position: 'absolute', top: '2.5rem', left: '2.5rem', width: '40px', height: '40px', borderTop: '1.5px solid #c4a05a', borderLeft: '1.5px solid #c4a05a' }} />
        <div className="corner-dec" style={{ position: 'absolute', top: '2.5rem', right: '2.5rem', width: '40px', height: '40px', borderTop: '1.5px solid #c4a05a', borderRight: '1.5px solid #c4a05a' }} />
        <div className="corner-dec" style={{ position: 'absolute', bottom: '2.5rem', left: '2.5rem', width: '40px', height: '40px', borderBottom: '1.5px solid #c4a05a', borderLeft: '1.5px solid #c4a05a' }} />
        <div className="corner-dec" style={{ position: 'absolute', bottom: '2.5rem', right: '2.5rem', width: '40px', height: '40px', borderBottom: '1.5px solid #c4a05a', borderRight: '1.5px solid #c4a05a' }} />

        <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '1.25rem' }}>
            <span style={{ display: 'block', height: '1px', width: '32px', background: '#c4a05a' }} />
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.28em', color: '#c4a05a' }}>Reserve Your Stay</span>
            <span style={{ display: 'block', height: '1px', width: '32px', background: '#c4a05a' }} />
          </div>

          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(2.2rem, 5vw, 4rem)', fontWeight: 300, color: '#1a1612', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            Ready for an<br />
            <em style={{ color: '#c4a05a' }}>Unforgettable Stay?</em>
          </h2>

          <p style={{ margin: '1.5rem auto 0', maxWidth: '440px', fontSize: '14px', color: '#8a7d6e', lineHeight: 1.8 }}>
            Book your perfect room today and experience the luxury that LuxeStay has to offer.
            Your extraordinary journey begins here.
          </p>

          <Link
            to="/signup"
            className="cta-btn"
            style={{
              marginTop: '2.5rem', display: 'inline-flex', alignItems: 'center', gap: '12px',
              background: '#1a1612', padding: '18px 40px',
              fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em',
              fontWeight: 700, color: '#f7f3ee', textDecoration: 'none',
              transition: 'all 0.3s',
            }}
          >
            Get Started
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── STYLES ── */}
      <style>{`
        /* ── Keyframes ── */
        @keyframes slowZoom {
          from { transform: scale(1.05); }
          to   { transform: scale(1.12); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(4px); }
        }

        /* ── Responsive Layout Helpers ── */
        .hero-pad    { padding: 0 3rem; }
        .section-pad { padding-left: 3rem; padding-right: 3rem; }

        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); }

        .testimonial-section { padding: 4rem 3rem; }
        .cta-section         { padding: 8rem 3rem; }

        /* ── Tablet (≤1024px) ── */
        @media (max-width: 1024px) {
          .grid-4 { grid-template-columns: repeat(2, 1fr); }
          .grid-3 { grid-template-columns: repeat(2, 1fr); }

          .features-header  { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .features-tagline { text-align: left !important; max-width: 100% !important; }
        }

        /* ── Mobile (≤640px) ── */
        @media (max-width: 640px) {
          .hero-pad            { padding: 0 1.25rem; }
          .section-pad         { padding-left: 1.25rem; padding-right: 1.25rem; }
          .testimonial-section { padding: 3rem 1.25rem; }
          .cta-section         { padding: 5rem 1.25rem; }

          .grid-4 { grid-template-columns: 1fr; }
          .grid-3 { grid-template-columns: 1fr; }

          /* Decorative corners clip on narrow screens */
          .corner-dec { display: none; }

          /* Remove left border when single-column */
          .stats-grid { border-left: none !important; }

          /* Separate each stat with a top border when stacked */
          .stat-cell { border-top: 1px solid rgba(247,243,238,0.06); }

          /* ── FIX: centre the "Our Promise / Why Choose LuxeStay" header on mobile ── */
          .features-header {
            align-items: center !important;
            text-align: center !important;
          }

          /* Centre the eyebrow line + label */
          .features-eyebrow {
            justify-content: center !important;
          }

          /* Centre the h2 inside the title block */
          .features-title-block {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center !important;
          }

          /* Centre and full-width the tagline paragraph */
          .features-tagline {
            text-align: center !important;
            max-width: 100% !important;
            width: 100%;
          }
        }

        /* ── Hover States ── */
        .hero-btn-primary:hover {
          background: #d4b06a !important;
          gap: 16px !important;
        }

        .feature-card:hover {
          background: #fffdf9 !important;
          transform: translateY(-3px);
        }
        .feature-card:hover .feature-line {
          width: 100% !important;
        }

        .room-card:hover {
          border-color: rgba(196,160,90,0.45) !important;
          transform: translateY(-4px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        }
        .room-card:hover .room-img {
          transform: scale(1.06) !important;
        }
        .room-card:hover .room-line {
          width: 100% !important;
        }

        .view-all-link:hover {
          border-color: rgba(196,160,90,0.5) !important;
          color: #c4a05a !important;
        }

        .cta-btn:hover {
          background: #c4a05a !important;
          color: #1a1612 !important;
          gap: 16px !important;
        }

        /* ── Disable transforms on touch devices ── */
        @media (hover: none) {
          .room-card:hover    { transform: none; box-shadow: none; }
          .feature-card:hover { transform: none; }
        }
      `}</style>
    </div>
  );
};

export default HomePage;