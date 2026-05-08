import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Mail, CheckCircle, Trash2, RefreshCw,
  Search, MailOpen, Inbox, MailCheck, Clock,
} from 'lucide-react';
import { ContactMessage, CONTACT_MESSAGES_KEY } from '@/pages/ContactPage';
import { logAuditAction } from './AdminSettings';
import { supabase } from '@/lib/supabase';

// ── Design Tokens ──────────────────────────────────────────────
const GOLD        = '#c4a05a';
const GOLD_LIGHT  = '#d4b06a';
const GOLD_PALE   = 'rgba(196,160,90,0.10)';
const GOLD_BORDER = 'rgba(196,160,90,0.22)';

const PAGE_BG     = '#f0ebe0';
const PANEL_BG    = '#faf7f1';

const TEXT_DARK   = '#1e1b14';
const TEXT_WARM   = '#3d3526';
const TEXT_MUTED  = 'rgba(61,53,38,0.48)';

const BORDER_LIGHT = 'rgba(61,53,38,0.10)';
const DIVIDER      = 'rgba(196,160,90,0.15)';

// ── Component ──────────────────────────────────────────────────
const AdminMessages = () => {
  const { toast } = useToast();
  const [messages,    setMessages]    = useState<ContactMessage[]>([]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [search,      setSearch]      = useState('');
  const [filterRead,  setFilterRead]  = useState<'All' | 'Unread' | 'Read'>('All');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [hoveredId,   setHoveredId]   = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────────
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setMessages(data.map(msg => ({
          id:        msg.id,
          name:      msg.name,
          email:     msg.email,
          subject:   msg.subject,
          message:   msg.message,
          read:      msg.read,
          timestamp: msg.created_at,
        })));
      } else {
        const saved = localStorage.getItem(CONTACT_MESSAGES_KEY);
        if (saved) setMessages(JSON.parse(saved));
      }
    } catch {
      const saved = localStorage.getItem(CONTACT_MESSAGES_KEY);
      if (saved) setMessages(JSON.parse(saved));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Handlers ─────────────────────────────────────────────────
  const markAsRead = async (messageId: string) => {
    const updated = messages.map(msg =>
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    setMessages(updated);
    localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(updated));
    try {
      await supabase.from('messages').update({ read: true }).eq('id', messageId);
    } catch { /* silent */ }
    logAuditAction('Marked Message as Read', `Message #${messageId.slice(0, 8)}`, 'success');
    toast({ title: 'Message marked as read' });
  };

  const deleteMessage = async (messageId: string) => {
    const updated = messages.filter(msg => msg.id !== messageId);
    setMessages(updated);
    localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(updated));
    try {
      await supabase.from('messages').delete().eq('id', messageId);
    } catch { /* silent */ }
    logAuditAction('Deleted Contact Message', `Message #${messageId.slice(0, 8)}`, 'warning');
    toast({ title: 'Message deleted' });
    if (expandedId === messageId) setExpandedId(null);
  };

  const markAllRead = async () => {
    const updated = messages.map(m => ({ ...m, read: true }));
    setMessages(updated);
    localStorage.setItem(CONTACT_MESSAGES_KEY, JSON.stringify(updated));
    try {
      await supabase.from('messages').update({ read: true }).eq('read', false);
    } catch { /* silent */ }
    toast({ title: 'All messages marked as read' });
  };

  // ── Stats ────────────────────────────────────────────────────
  const unreadCount = messages.filter(m => !m.read).length;
  const readCount   = messages.filter(m => m.read).length;

  // ── Filtering ────────────────────────────────────────────────
  const filtered = messages.filter(m => {
    const matchSearch = !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.subject?.toLowerCase().includes(search.toLowerCase()) ||
      m.message?.toLowerCase().includes(search.toLowerCase());
    const matchRead =
      filterRead === 'All' ||
      (filterRead === 'Unread' && !m.read) ||
      (filterRead === 'Read'   &&  m.read);
    return matchSearch && matchRead;
  });

  // ── Render ────────────────────────────────────────────────────
  return (
    <div
      className="animate-fade-in"
      style={{
        color: TEXT_DARK,
        fontFamily: "'Jost', 'DM Sans', sans-serif",
        backgroundColor: PAGE_BG,
        minHeight: '100vh',
        padding: '36px 40px',
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
              Inbox
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: '2rem', fontWeight: 300, letterSpacing: '-0.02em',
            color: TEXT_DARK, lineHeight: 1.1, marginBottom: 6,
          }}>
            Contact{' '}
            <span style={{ fontStyle: 'italic', color: GOLD }}>Messages</span>
          </h1>
          <p style={{ fontSize: 12, color: TEXT_MUTED, letterSpacing: '0.04em' }}>
            {messages.length} messages
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 10, padding: '2px 9px', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.18em',
                border: `0.5px solid ${GOLD_BORDER}`,
                backgroundColor: GOLD_PALE, color: GOLD,
              }}>
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>

        {/* Header actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '10px 18px', fontSize: 9,
                textTransform: 'uppercase', letterSpacing: '0.2em',
                border: `0.5px solid ${GOLD_BORDER}`,
                backgroundColor: GOLD_PALE, color: GOLD,
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(196,160,90,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = GOLD_PALE; }}
            >
              <MailCheck style={{ width: 12, height: 12 }} />
              Mark All Read
            </button>
          )}
          <button
            onClick={fetchMessages}
            disabled={isLoading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', fontSize: 9,
              textTransform: 'uppercase', letterSpacing: '0.2em',
              border: `0.5px solid ${BORDER_LIGHT}`,
              backgroundColor: 'transparent', color: TEXT_MUTED,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = GOLD_BORDER;
                e.currentTarget.style.color = GOLD;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = BORDER_LIGHT;
              e.currentTarget.style.color = TEXT_MUTED;
            }}
          >
            <RefreshCw style={{
              width: 12, height: 12,
              animation: isLoading ? 'spin 1s linear infinite' : 'none',
            }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Strip ──────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 1, marginBottom: 32,
        border: `0.5px solid ${BORDER_LIGHT}`,
        backgroundColor: BORDER_LIGHT,
        overflow: 'hidden',
      }}>
        {[
          { icon: <Inbox      style={{ width: 14, height: 14, color: GOLD }} />,        label: 'Total',   value: messages.length, unit: 'messages' },
          { icon: <Mail       style={{ width: 14, height: 14, color: '#c4913a' }} />,   label: 'Unread',  value: unreadCount,     unit: 'pending'  },
          { icon: <MailOpen   style={{ width: 14, height: 14, color: '#4a9c6a' }} />,   label: 'Read',    value: readCount,       unit: 'reviewed' },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: PANEL_BG, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              {stat.icon}
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.24em', color: TEXT_MUTED }}>
                {stat.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{
                fontFamily: 'Georgia, serif', fontStyle: 'italic',
                fontSize: '1.6rem', fontWeight: 300, color: TEXT_DARK, lineHeight: 1,
              }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 10, color: TEXT_MUTED }}>{stat.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: 360 }}>
          <Search style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', width: 13, height: 13, color: TEXT_MUTED,
          }} />
          <input
            placeholder="Search sender, subject, or content…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              height: 42, backgroundColor: PANEL_BG,
              border: `0.5px solid ${BORDER_LIGHT}`,
              borderRadius: 0, paddingLeft: 36, paddingRight: 12,
              fontSize: 13, color: TEXT_DARK, fontFamily: 'inherit',
              outline: 'none', width: '100%',
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {(['All', 'Unread', 'Read'] as const).map(f => {
            const isActive = filterRead === f;
            const activeColor =
              f === 'Unread' ? '#c4913a' :
              f === 'Read'   ? '#4a9c6a' : GOLD;
            const activeBorder =
              f === 'Unread' ? 'rgba(196,145,58,0.35)' :
              f === 'Read'   ? 'rgba(74,156,106,0.35)' : GOLD_BORDER;
            const activeBg =
              f === 'Unread' ? 'rgba(196,145,58,0.09)' :
              f === 'Read'   ? 'rgba(74,156,106,0.09)' : GOLD_PALE;
            return (
              <button
                key={f}
                onClick={() => setFilterRead(f)}
                style={{
                  padding: '6px 18px', fontSize: 9,
                  textTransform: 'uppercase', letterSpacing: '0.18em',
                  border: isActive ? `0.5px solid ${activeBorder}` : `0.5px solid ${BORDER_LIGHT}`,
                  backgroundColor: isActive ? activeBg : 'transparent',
                  color: isActive ? activeColor : TEXT_MUTED,
                  cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = activeBorder;
                    e.currentTarget.style.color = activeColor;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = BORDER_LIGHT;
                    e.currentTarget.style.color = TEXT_MUTED;
                  }
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Message List ─────────────────────────────────── */}
      <div style={{
        border: `0.5px solid ${BORDER_LIGHT}`,
        backgroundColor: PANEL_BG,
        overflow: 'hidden',
      }}>
        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ padding: '72px 24px', textAlign: 'center' }}>
            <Mail style={{ width: 28, height: 28, color: GOLD, margin: '0 auto 14px', opacity: 0.4 }} />
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.28em', color: TEXT_MUTED, marginBottom: 6 }}>
              No messages found
            </p>
            <p style={{ fontSize: 12, color: 'rgba(61,53,38,0.3)' }}>
              {search || filterRead !== 'All'
                ? 'Try adjusting your search or filters'
                : 'Messages from the Contact page will appear here'}
            </p>
          </div>
        )}

        {filtered.map((msg, index) => {
          const isHover    = hoveredId === msg.id;
          const isExpanded = expandedId === msg.id;
          const isLast     = index === filtered.length - 1;

          const formattedDate = new Date(msg.timestamp).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit',
          });

          return (
            <div
              key={msg.id}
              onMouseEnter={() => setHoveredId(msg.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                borderBottom: isLast ? 'none' : `0.5px solid ${BORDER_LIGHT}`,
                backgroundColor: isExpanded
                  ? 'rgba(196,160,90,0.04)'
                  : msg.read ? 'transparent' : 'rgba(196,160,90,0.025)',
                transition: 'background-color 0.2s',
                position: 'relative',
              }}
            >
              {/* Unread left accent bar */}
              {!msg.read && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: 3, backgroundColor: GOLD,
                  opacity: isExpanded ? 1 : 0.7,
                }} />
              )}

              {/* ── Message header row (always visible) ──── */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                style={{
                  display: 'flex', alignItems: 'center',
                  gap: 16, padding: '18px 24px 18px 24px',
                  cursor: 'pointer',
                  paddingLeft: !msg.read ? 28 : 24,
                }}
              >
                {/* Avatar / icon */}
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                  backgroundColor: msg.read ? 'rgba(61,53,38,0.06)' : GOLD_PALE,
                  border: `0.5px solid ${msg.read ? BORDER_LIGHT : GOLD_BORDER}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  fontSize: '1rem', color: msg.read ? TEXT_MUTED : GOLD,
                  transition: 'all 0.2s',
                }}>
                  {(msg.name || 'G').charAt(0).toUpperCase()}
                </div>

                {/* Sender + subject */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3,
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: msg.read ? 400 : 600,
                      color: TEXT_DARK, letterSpacing: '0.02em',
                    }}>
                      {msg.name}
                    </span>
                    {!msg.read && (
                      <span style={{
                        fontSize: 8, textTransform: 'uppercase', letterSpacing: '0.2em',
                        padding: '2px 8px',
                        border: `0.5px solid ${GOLD_BORDER}`,
                        backgroundColor: GOLD_PALE, color: GOLD,
                      }}>
                        New
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 12, color: msg.read ? TEXT_MUTED : TEXT_WARM,
                    fontWeight: msg.read ? 400 : 500,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    maxWidth: 420,
                  }}>
                    {msg.subject || '(No subject)'}
                    {!isExpanded && (
                      <span style={{ color: TEXT_MUTED, fontWeight: 400, marginLeft: 8 }}>
                        — {msg.message?.slice(0, 60)}{msg.message?.length > 60 ? '…' : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Meta: date + email */}
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end',
                    fontSize: 10, color: TEXT_MUTED, marginBottom: 3,
                  }}>
                    <Clock style={{ width: 10, height: 10 }} />
                    {formattedDate}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(61,53,38,0.35)', letterSpacing: '0.03em' }}>
                    {msg.email}
                  </div>
                </div>

                {/* Expand chevron */}
                <div style={{
                  flexShrink: 0, width: 24, height: 24,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: isHover || isExpanded ? GOLD : 'rgba(61,53,38,0.25)',
                  transition: 'color 0.2s, transform 0.2s',
                  transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  fontSize: 12,
                }}>
                  ▾
                </div>
              </div>

              {/* ── Expanded body ──────────────────────────── */}
              {isExpanded && (
                <div style={{
                  paddingLeft: !msg.read ? 28 : 24,
                  paddingRight: 24,
                  paddingBottom: 20,
                }}>
                  {/* Divider */}
                  <div style={{ height: '0.5px', backgroundColor: DIVIDER, marginBottom: 18 }} />

                  {/* Message body */}
                  <div style={{
                    padding: '16px 20px',
                    border: `0.5px solid ${BORDER_LIGHT}`,
                    backgroundColor: 'rgba(196,160,90,0.03)',
                    marginBottom: 18,
                  }}>
                    {/* Subject line */}
                    <div style={{
                      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.22em',
                      color: GOLD, marginBottom: 10,
                    }}>
                      {msg.subject || 'No Subject'}
                    </div>
                    {/* Body text */}
                    <p style={{
                      fontSize: 13, color: TEXT_WARM, lineHeight: 1.8,
                      whiteSpace: 'pre-wrap', fontFamily: 'Georgia, serif', fontStyle: 'italic',
                    }}>
                      {msg.message}
                    </p>
                  </div>

                  {/* Reply hint + sender info row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: 12,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: TEXT_MUTED }}>
                      <Mail style={{ width: 11, height: 11, color: GOLD }} />
                      Reply to:
                      <a
                        href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || '')}`}
                        style={{ color: GOLD, textDecoration: 'none', letterSpacing: '0.02em' }}
                      >
                        {msg.email}
                      </a>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!msg.read && (
                        <button
                          onClick={e => { e.stopPropagation(); markAsRead(msg.id); }}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '7px 16px', fontSize: 9,
                            textTransform: 'uppercase', letterSpacing: '0.18em',
                            border: '0.5px solid rgba(74,156,106,0.32)',
                            backgroundColor: 'rgba(74,156,106,0.07)',
                            color: '#4a9c6a',
                            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(74,156,106,0.14)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(74,156,106,0.07)'; }}
                        >
                          <CheckCircle style={{ width: 11, height: 11 }} />
                          Mark Read
                        </button>
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); deleteMessage(msg.id); }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '7px 16px', fontSize: 9,
                          textTransform: 'uppercase', letterSpacing: '0.18em',
                          border: '0.5px solid rgba(248,113,113,0.28)',
                          backgroundColor: 'rgba(248,113,113,0.05)',
                          color: '#d97070',
                          cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(248,113,113,0.05)'; }}
                      >
                        <Trash2 style={{ width: 11, height: 11 }} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminMessages;