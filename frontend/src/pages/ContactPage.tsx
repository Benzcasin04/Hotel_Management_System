import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabase';

export const CONTACT_MESSAGES_KEY = 'contact-messages';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// ── Design tokens ────────────────────────────────────────────
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
  border:      'rgba(90,74,56,0.15)',
  borderGold:  'rgba(184,146,74,0.35)',
  borderFocus: 'rgba(184,146,74,0.55)',
};

const inputStyle: React.CSSProperties = {
  backgroundColor: C.surfaceWarm,
  border: `0.5px solid ${C.border}`,
  borderRadius: 0,
  color: C.textBody,
  fontSize: 13,
  height: 44,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s, background 0.2s',
};

// ── Reusable sub-components ───────────────────────────────────
const PanelTag = ({ text }: { text: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    <span style={{ display: 'block', height: '0.5px', width: 20, background: C.gold }} />
    <span style={{ fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: C.gold, fontWeight: 500 }}>
      {text}
    </span>
  </div>
);

const ContactPage = () => {
  const { toast } = useToast();
  const { createNotification } = useNotifications();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [focused, setFocused] = useState<string | null>(null);

  const fieldBorder = (field: string) =>
    focused === field ? C.borderFocus : C.border;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newMessage: ContactMessage = {
      id: Date.now().toString(),
      name: form.name,
      email: form.email,
      subject: form.subject,
      message: form.message,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Save to localStorage (existing functionality)
    const existingMessages = JSON.parse(localStorage.getItem(CONTACT_MESSAGES_KEY) || '[]');
    localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify([newMessage, ...existingMessages]));

    // Save to Supabase database
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          name: form.name,
          email: form.email,
          subject: form.subject,
          message: form.message,
          read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message to Supabase:', error);
        alert('Error saving to Supabase: ' + error.message);
      } else {
        console.log('Message saved to Supabase:', data);
        newMessage.id = data.id;
      }
    } catch (error) {
      console.error('Failed to save message to Supabase:', error);
    }

    toast({ title: 'Message Sent!', description: 'We will get back to you within 24 hours.' });

    // Create notification for admin/staff
    createNotification({
      userId: null,
      title: 'New Contact Message',
      message: `${form.name}: ${form.subject}`,
      type: 'contact_message',
      relatedId: newMessage.id,
      read: false,
    });

    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div
      className="animate-fade-in"
      style={{ backgroundColor: C.warmWhite, color: C.textBody, fontFamily: 'sans-serif', minHeight: '100vh' }}
    >

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        position: 'relative',
        padding: '88px 24px 72px',
        textAlign: 'center',
        backgroundColor: C.charcoal,
        overflow: 'hidden',
      }}>
        {/* Subtle radial glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 60% 80% at 20% 50%, rgba(184,146,74,0.08) 0%, transparent 60%),
            radial-gradient(ellipse 50% 60% at 80% 50%, rgba(184,146,74,0.05) 0%, transparent 60%)
          `,
        }} />

        {/* Corner brackets */}
        <div style={{ position: 'absolute', top: 20, left: 20, width: 24, height: 24, borderTop: `0.5px solid ${C.borderGold}`, borderLeft: `0.5px solid ${C.borderGold}` }} />
        <div style={{ position: 'absolute', top: 20, right: 20, width: 24, height: 24, borderTop: `0.5px solid ${C.borderGold}`, borderRight: `0.5px solid ${C.borderGold}` }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ display: 'block', height: '0.5px', width: 32, background: C.gold, opacity: 0.6 }} />
            <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.35em', color: C.goldLight, fontWeight: 500 }}>
              Reach Out
            </span>
            <span style={{ display: 'block', height: '0.5px', width: 32, background: C.gold, opacity: 0.6 }} />
          </div>
          <h1 style={{
            fontFamily: 'Georgia, Times New Roman, serif',
            fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
            fontWeight: 300,
            letterSpacing: '-0.01em',
            color: C.cream,
            lineHeight: 1.05,
          }}>
            Contact <span style={{ fontStyle: 'italic', color: C.goldLight }}>Us</span>
          </h1>
          <p style={{ marginTop: 14, fontSize: 13, color: 'rgba(245,240,232,0.45)', letterSpacing: '0.06em' }}>
            We'd love to hear from you
          </p>
        </div>

        {/* Bottom divider */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, rgba(184,146,74,0.3), transparent)`,
        }} />
      </section>


      {/* ── MAIN CONTENT ─────────────────────────────────────── */}
      <section style={{ padding: '72px 24px 96px' }}>
        <div style={{
          maxWidth: 1040,
          margin: '0 auto',
          display: 'grid',
          gap: 48,
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          alignItems: 'start',
        }}>

          {/* ── LEFT: Info ─────────────────────────────────── */}
          <div>
            <PanelTag text="Get in Touch" />

            <h2 style={{
              fontFamily: 'Georgia, Times New Roman, serif',
              fontSize: '2rem',
              fontWeight: 300,
              color: C.charcoal,
              lineHeight: 1.15,
              marginBottom: 14,
            }}>
              We're Here to <span style={{ fontStyle: 'italic', color: C.gold }}>Assist</span>
            </h2>

            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.85, marginBottom: 36, maxWidth: 340 }}>
              Have a question or need help with your reservation? Our team is available around the clock to make your experience seamless.
            </p>

            {/* Contact items */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[
                { icon: MapPin, label: 'Address', value: '123 Luxury Ave, Makati City, Manila, Philippines' },
                { icon: Phone,  label: 'Phone',   value: '+63 2 8888 0000' },
                { icon: Mail,   label: 'Email',   value: 'info@luxestay.com' },
                { icon: Clock,  label: 'Hours',   value: 'Front Desk: 24/7' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                  padding: '18px 0',
                  borderBottom: `0.5px solid ${C.border}`,
                  ...(i === 0 ? { borderTop: `0.5px solid ${C.border}` } : {}),
                }}>
                  {/* Icon box */}
                  <div style={{
                    width: 38, height: 38, flexShrink: 0,
                    background: C.surfaceWarm,
                    border: `0.5px solid ${C.borderGold}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <item.icon style={{ width: 15, height: 15, color: C.gold }} />
                  </div>
                  {/* Text */}
                  <div>
                    <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.gold, marginBottom: 4, fontWeight: 500 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Decorative quote */}
            <div style={{
              marginTop: 32,
              padding: '16px 20px',
              background: C.surfaceWarm,
              borderLeft: `2px solid ${C.goldPale}`,
              borderTop: `0.5px solid ${C.border}`,
              borderBottom: `0.5px solid ${C.border}`,
              borderRight: `0.5px solid ${C.border}`,
            }}>
              <p style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: '0.95rem',
                fontStyle: 'italic',
                fontWeight: 300,
                color: C.brownSoft,
                lineHeight: 1.7,
              }}>
                "Every great stay begins with a conversation."
              </p>
            </div>
          </div>


          {/* ── RIGHT: Form ────────────────────────────────── */}
          <div style={{
            backgroundColor: C.surface,
            border: `0.5px solid ${C.border}`,
            boxShadow: '0 2px 32px rgba(42,37,32,0.08), 0 1px 4px rgba(42,37,32,0.04)',
            padding: '40px 36px',
            position: 'relative',
          }}>
            {/* Gold top accent bar */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${C.gold} 0%, ${C.goldLight} 50%, transparent 100%)`,
            }} />

            {/* Form header */}
            <div style={{ marginBottom: 28 }}>
              <PanelTag text="Send a Message" />
              <h3 style={{
                fontFamily: 'Georgia, Times New Roman, serif',
                fontSize: '1.4rem',
                fontWeight: 300,
                color: C.charcoal,
                fontStyle: 'italic',
              }}>
                How can we help?
              </h3>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Name + Email row */}
              <div style={{ display: 'grid', gap: 16, gridTemplateColumns: '1fr 1fr' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Label htmlFor="name" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.textMuted, fontWeight: 500 }}>
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused(null)}
                    required
                    style={{ ...inputStyle, borderColor: fieldBorder('name') }}
                    className="placeholder:text-[rgba(90,74,56,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Label htmlFor="email" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.textMuted, fontWeight: 500 }}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    style={{ ...inputStyle, borderColor: fieldBorder('email') }}
                    className="placeholder:text-[rgba(90,74,56,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>

              {/* Subject */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label htmlFor="subject" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.textMuted, fontWeight: 500 }}>
                  Subject
                </Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  onFocus={() => setFocused('subject')}
                  onBlur={() => setFocused(null)}
                  required
                  style={{ ...inputStyle, borderColor: fieldBorder('subject') }}
                  className="placeholder:text-[rgba(90,74,56,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              {/* Message */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Label htmlFor="message" style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em', color: C.textMuted, fontWeight: 500 }}>
                  Message
                </Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  onFocus={() => setFocused('message')}
                  onBlur={() => setFocused(null)}
                  required
                  style={{
                    backgroundColor: C.surfaceWarm,
                    border: `0.5px solid ${fieldBorder('message')}`,
                    borderRadius: 0,
                    color: C.textBody,
                    fontSize: 13,
                    resize: 'none',
                    outline: 'none',
                    transition: 'border-color 0.2s, background 0.2s',
                    lineHeight: 1.7,
                    fontFamily: 'inherit',
                  }}
                  className="placeholder:text-[rgba(90,74,56,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>

              {/* Divider */}
              <div style={{ height: '0.5px', backgroundColor: C.border }} />

              {/* Submit */}
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: C.charcoal,
                  padding: '15px 24px',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.25em',
                  fontWeight: 500,
                  color: C.cream,
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  transition: 'background-color 0.25s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.brownMid)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.charcoal)}
              >
                Send Message
                <Send style={{ width: 13, height: 13 }} />
              </button>

              <p style={{ fontSize: 10, color: 'rgba(90,74,56,0.4)', textAlign: 'center', letterSpacing: '0.05em' }}>
                We'll respond within 24 hours
              </p>
            </form>
          </div>

        </div>
      </section>

    </div>
  );
};

export default ContactPage;