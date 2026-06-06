import { useAuth } from '@/contexts/AuthContext';
import { useHotel } from '@/contexts/HotelContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { Navigate, Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Booking, PaymentMethod, PaymentStatus, BookingStatus } from '@/types/hotel';
import { useToast } from '@/hooks/use-toast';
import {
  CalendarCheck, BedDouble, Clock, DollarSign,
  Calendar, Users, CreditCard, FileText, ArrowRight,
  ChevronRight, Star, MapPin, Banknote, Building2, Wallet,
  CheckCircle2, X, Shield, Info, AlertCircle
} from 'lucide-react';

// ── Design tokens ──────────────────────────────────────────
const GOLD     = '#c4a05a';
const BORDER   = 'rgba(196,160,90,0.15)';
const SURFACE  = '#ffffff';
const PAGE_BG  = '#f7f3ee';
const DARK_HDR = '#2c2418';
const TEXT     = '#1a1612';
const MUTED    = '#8a7d6e';
const CREAM    = '#faf8f4';

// ── Status config ──────────────────────────────────────────
const statusConfig: Record<string, { bg: string; color: string; border: string; dot: string }> = {
  pending:     { bg: 'rgba(245,158,11,0.1)',  color: '#b45309', border: 'rgba(245,158,11,0.3)',  dot: '#f59e0b' },
  confirmed:   { bg: 'rgba(196,160,90,0.12)', color: '#92660a', border: 'rgba(196,160,90,0.3)',  dot: '#c4a05a' },
  checked_in:  { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)', dot: '#10b981' },
  checked_out: { bg: 'rgba(138,125,110,0.1)', color: MUTED,     border: 'rgba(138,125,110,0.2)', dot: '#a8a29e' },
  cancelled:   { bg: 'rgba(239,68,68,0.1)',   color: '#991b1b', border: 'rgba(239,68,68,0.25)',  dot: '#ef4444' },
};

const paymentConfig: Record<string, { bg: string; color: string; border: string }> = {
  unpaid:    { bg: 'rgba(239,68,68,0.1)',   color: '#991b1b', border: 'rgba(239,68,68,0.25)'  },  // Not paid yet - red
  pending:   { bg: 'rgba(245,158,11,0.1)', color: '#92400e', border: 'rgba(245,158,11,0.25)' },  // Awaiting approval - amber
  completed: { bg: 'rgba(16,185,129,0.1)',  color: '#065f46', border: 'rgba(16,185,129,0.25)' },  // Paid - green
  refunded:  { bg: 'rgba(138,125,110,0.1)', color: MUTED,     border: 'rgba(138,125,110,0.2)' },  // Refunded - gray
};

// ── Reusable pills ─────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', fontFamily: 'Georgia, serif',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {status.replace('_', ' ')}
    </span>
  );
};

const PaymentPill = ({ status }: { status: string }) => {
  const cfg = paymentConfig[status] ?? paymentConfig.unpaid;
  // Map status to display label
  const labelMap: Record<string, string> = {
    unpaid: 'unpaid',
    pending: 'pending',    // Payment submitted, awaiting admin approval
    completed: 'paid',
    refunded: 'refunded',
  };
  const label = labelMap[status] || status;
  return (
    <span style={{
      fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700,
      padding: '4px 10px', borderRadius: 999,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap', fontFamily: 'Georgia, serif',
    }}>
      {label}
    </span>
  );
};

// Payment method icons
const PaymentMethodIcon = ({ method }: { method: PaymentMethod }) => {
  switch (method) {
    case 'card': return <CreditCard size={16} />;
    case 'cash': return <Banknote size={16} />;
    case 'bank_transfer': return <Building2 size={16} />;
    default: return <Wallet size={16} />;
  }
};

// ── Info tile for dialog ───────────────────────────────────
const InfoTile = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', borderRadius: 10,
    background: CREAM, border: `1px solid ${BORDER}`,
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
      background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 6px rgba(196,160,90,0.3)',
    }}>
      <Icon size={15} color="#1a1612" />
    </div>
    <div>
      <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: TEXT }}>{value}</p>
      {sub && <p style={{ fontSize: 10, color: GOLD, marginTop: 1 }}>{sub}</p>}
    </div>
  </div>
);

// ── Stat card config ───────────────────────────────────────
const statConfigs = [
  { icon: CalendarCheck, label: 'Total Bookings', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.2)'  },
  { icon: Clock,         label: 'Pending',        gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.2)'  },
  { icon: BedDouble,     label: 'Active',         gradient: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.2)'  },
  { icon: DollarSign,    label: 'Total Spent',    gradient: 'linear-gradient(135deg,#c4a05a,#d4b06a)', glow: 'rgba(196,160,90,0.25)' },
];

const UserDashboard = () => {
  const { user, isLoading } = useAuth();
  const { getBookingsByUser, getRoomById, createPayment, createPaymentAndUpdateBooking, payments, updatePaymentStatus, updateBookingStatus, getDisplayPaymentStatus } = useHotel();
  const { createNotification } = useNotifications();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Payment modal state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [bookingToPay, setBookingToPay] = useState<Booking | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Track payments being processed to prevent duplicates
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  
  // Credit card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  
  // Credit card validation errors
  const [cardNumberError, setCardNumberError] = useState('');
  const [cardNameError, setCardNameError] = useState('');
  const [cardExpiryError, setCardExpiryError] = useState('');
  const [cardCvvError, setCardCvvError] = useState('');
  
  // Bank transfer form state
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [referenceNumber] = useState(() => `LS-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`);
  
  // Bank transfer validation errors
  const [bankNameError, setBankNameError] = useState('');
  const [accountHolderError, setAccountHolderError] = useState('');
  const [accountNumberError, setAccountNumberError] = useState('');
  
  // Cash on arrival form state
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [cashConfirmedError, setCashConfirmedError] = useState('');

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: PAGE_BG }}>
        <div style={{ width: 36, height: 36, border: `2px solid ${GOLD}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const bookings = getBookingsByUser(user.id);

  // Reset payment form state
  const resetPaymentForms = () => {
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setBankName('');
    setAccountHolder('');
    setAccountNumber('');
    setCashConfirmed(false);
    setSelectedPaymentMethod('card');
    // Clear all errors
    setCardNumberError('');
    setCardNameError('');
    setCardExpiryError('');
    setCardCvvError('');
    setBankNameError('');
    setAccountHolderError('');
    setAccountNumberError('');
    setCashConfirmedError('');
  };

  // Credit card formatting
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    }
    return v;
  };

  // Handle payment submission with validation
  const handlePaymentSubmit = async () => {
    if (!bookingToPay || !user) return;
    
    // Clear previous errors
    setCardNumberError('');
    setCardNameError('');
    setCardExpiryError('');
    setCardCvvError('');
    setBankNameError('');
    setAccountHolderError('');
    setAccountNumberError('');
    setCashConfirmedError('');
    
    let hasError = false;
    
    // Validate based on payment method
    if (selectedPaymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setCardNumberError('Please enter a valid 16-digit card number');
        hasError = true;
      }
      if (!cardName.trim()) {
        setCardNameError('Please enter the name on your card');
        hasError = true;
      }
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        setCardExpiryError('Please enter expiry date as MM/YY');
        hasError = true;
      }
      if (cardCvv.length < 3) {
        setCardCvvError('Please enter a 3-digit CVV code');
        hasError = true;
      }
    }
    
    if (selectedPaymentMethod === 'bank_transfer') {
      if (!bankName.trim()) {
        setBankNameError('Please enter your bank name');
        hasError = true;
      }
      if (!accountHolder.trim()) {
        setAccountHolderError('Please enter the account holder name');
        hasError = true;
      }
      if (!accountNumber.trim() || accountNumber.replace(/\s/g, '').length < 8) {
        setAccountNumberError('Please enter a valid account number');
        hasError = true;
      }
    }
    
    if (selectedPaymentMethod === 'cash' && !cashConfirmed) {
      setCashConfirmedError('Please confirm you understand the cash payment terms');
      hasError = true;
    }
    
    if (hasError) {
      toast({ title: 'Please fix the errors above', description: 'Some required fields are missing or invalid.', variant: 'destructive' });
      return;
    }
    
    // Prevent multiple simultaneous submissions
    if (isProcessingPayment) {
      toast({ title: 'Payment Processing', description: 'Please wait while we process your payment.', variant: 'destructive' });
      return;
    }
    
    // Check if this payment is already being processed
    if (processingPayments.has(bookingToPay.id)) {
      toast({ title: 'Payment Processing', description: 'This payment is already being processed.', variant: 'destructive' });
      return;
    }
    
    // Check if payment already exists for this booking (any status)
    const existingPayment = payments.find(p => p.bookingId === bookingToPay.id);
    
    // If payment already exists, prevent duplicate creation
    if (existingPayment) {
      if (existingPayment.status === 'pending' || existingPayment.status === 'completed') {
        toast({ 
          title: 'Payment Already Submitted', 
          description: existingPayment.status === 'pending' 
            ? 'Your payment is already pending approval.' 
            : 'This booking has already been paid.',
          variant: 'destructive' 
        });
        return;
      }
      
      // If there's an existing payment but booking is still unpaid, update the existing payment
      if (bookingToPay.paymentStatus === 'unpaid') {
        setIsProcessingPayment(true);
        setProcessingPayments(prev => new Set(prev).add(bookingToPay.id));
        try {
          // Update existing payment with new method and details
          await updatePaymentStatus(existingPayment.id, 'pending', `Payment method updated to ${selectedPaymentMethod.replace('_', ' ')}`, 'user');
          
          // Update booking status to confirmed
          await updateBookingStatus(bookingToPay.id, 'confirmed');
          
          // Refresh bookings to get updated payment status
          await getBookingsByUser(user.id);
          
          // Notify admin about payment
          createNotification({
            userId: null,
            title: 'Payment Updated - Approval Required',
            message: `${user.name} updated their payment method to ${selectedPaymentMethod.replace('_', ' ')} for booking ${bookingToPay.id.slice(0, 8)}... Please review and approve.`,
            type: 'payment',
            relatedId: existingPayment.id,
            read: false,
          });
          
          toast({
            title: 'Payment Updated',
            description: 'Your payment has been submitted for admin approval.',
          });
          
          setPaymentDialogOpen(false);
          setBookingToPay(null);
          resetPaymentForms();
          return;
        } catch (error) {
          toast({
            title: 'Payment Update Failed',
            description: 'There was an error updating your payment. Please try again.',
            variant: 'destructive',
          });
          return;
        } finally {
          setIsProcessingPayment(false);
          setProcessingPayments(prev => {
            const newSet = new Set(prev);
            newSet.delete(bookingToPay.id);
            return newSet;
          });
        }
      }
    }
    
    // Create new payment record
    setIsProcessingPayment(true);
    setProcessingPayments(prev => new Set(prev).add(bookingToPay.id));
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      console.log('Creating payment for booking:', bookingToPay.id, 'with method:', selectedPaymentMethod);
      
      // Create payment and update booking in one combined operation
      const payment = await createPaymentAndUpdateBooking(
        bookingToPay.id,
        bookingToPay.totalAmount,
        selectedPaymentMethod
      );
      
      console.log('Payment created and booking updated:', payment);
      
      // Refresh bookings to get updated payment status from backend
      await getBookingsByUser(user.id);
      
      console.log('Bookings refreshed');
      
      // Notify admin about payment
      createNotification({
        userId: null,
        title: 'Payment Received - Approval Required',
        message: `${user.name} made a ${selectedPaymentMethod.replace('_', ' ')} payment of $${bookingToPay.totalAmount} for booking ${bookingToPay.id.slice(0, 8)}... Please review and approve.`,
        type: 'payment',
        relatedId: payment.id,
        read: false,
      });
      
      // Success toast
      toast({
        title: 'Payment Submitted',
        description: 'Your payment has been submitted for admin approval.',
      });
      
      // Close dialog and reset
      setPaymentDialogOpen(false);
      setBookingToPay(null);
      resetPaymentForms();
    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'There was an error processing your payment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessingPayment(false);
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(bookingToPay.id);
        return newSet;
      });
    }
  };

  const stats = [
    bookings.length,
    bookings.filter(b => b.status === 'pending').length,
    bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length,
    `$${bookings.filter(b => b.paymentStatus === 'completed' || b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0)}`,
  ];

  return (
    <div className="animate-fade-in" style={{ fontFamily: 'Georgia, serif', color: TEXT, background: PAGE_BG, minHeight: '100vh' }}>
      <div className="dashboard-container" style={{ margin: '0 auto', padding: '1.5rem', maxWidth: '1200px' }}>
        <style>{`
          @media (max-width: 768px) {
            .dashboard-container {
              padding: 1rem !important;
            }
            .booking-card {
              flex-direction: column !important;
            }
            .booking-card > div:last-child {
              border-left: none !important;
              border-top: 1px solid #e5d4b1 !important;
              padding-top: 1rem !important;
            }
            .stats-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

        {/* ── Hero Header ── */}
        <div style={{
          background: DARK_HDR, borderRadius: 16, padding: '1.5rem',
          marginBottom: 26, position: 'relative', overflow: 'hidden',
          boxShadow: '0 6px 28px rgba(0,0,0,0.16)',
        }}>
          {/* Glow blobs */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -30, left: '30%', width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, #c4a05a, transparent)' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              {/* Avatar */}
              <div style={{
                width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, color: '#1a1612',
                boxShadow: '0 4px 14px rgba(196,160,90,0.45)',
                border: '2px solid rgba(196,160,90,0.4)',
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                  <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
                  <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, fontWeight: 700 }}>Guest Portal</span>
                </div>
                <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.85rem', fontWeight: 300, color: '#f7f3ee', lineHeight: 1.1 }}>
                  My <em style={{ fontStyle: 'italic', color: GOLD }}>Dashboard</em>
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(247,243,238,0.5)', marginTop: 4 }}>
                  Welcome back, <span style={{ color: 'rgba(247,243,238,0.85)', fontWeight: 600 }}>{user.name}</span>
                </p>
              </div>
            </div>

            {/* Book CTA */}
            <Link
              to="/rooms"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                padding: '12px 22px', borderRadius: 10,
                fontSize: 11, fontWeight: 700, color: '#1a1612',
                textDecoration: 'none', fontFamily: 'Georgia, serif',
                letterSpacing: '0.06em', transition: 'opacity 0.2s',
                boxShadow: '0 3px 12px rgba(196,160,90,0.35)',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Book New Room
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 28 }}>
          {stats.map((val, i) => {
            const cfg = statConfigs[i];
            return (
              <div
                key={i}
                style={{
                  background: SURFACE, borderRadius: 12, padding: '16px 18px',
                  border: `1px solid ${BORDER}`,
                  boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                  position: 'relative', overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 22px ${cfg.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: cfg.gradient, borderRadius: '12px 12px 0 0' }} />
                <div style={{
                  width: 32, height: 32, borderRadius: 9, background: cfg.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 12, marginTop: 4,
                  boxShadow: `0 2px 8px ${cfg.glow}`,
                }}>
                  <cfg.icon size={15} color="#fff" />
                </div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 300, color: TEXT, lineHeight: 1, marginBottom: 4 }}>
                  {val}
                </div>
                <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.15em', color: GOLD, fontWeight: 700 }}>
                  {cfg.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Reservations Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'block', height: 1, width: 18, background: GOLD }} />
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontWeight: 300, color: TEXT }}>
              My <em style={{ fontStyle: 'italic', color: GOLD }}>Reservations</em>
            </h2>
          </div>
          <span style={{ fontSize: 11, color: MUTED }}>
            {bookings.length} reservation{bookings.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Bookings List ── */}
        {bookings.length === 0 ? (
          <div style={{
            padding: '64px 24px', textAlign: 'center',
            background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`,
            boxShadow: '0 2px 12px rgba(26,22,18,0.05)',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
            }}>
              <CalendarCheck size={26} color="rgba(196,160,90,0.45)" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: TEXT, marginBottom: 6 }}>No reservations yet</p>
            <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Browse our rooms to start your luxury experience</p>
            <Link
              to="/rooms"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                padding: '11px 22px', borderRadius: 9,
                fontSize: 11, fontWeight: 700, color: '#1a1612',
                textDecoration: 'none', fontFamily: 'Georgia, serif',
                boxShadow: '0 3px 10px rgba(196,160,90,0.3)',
              }}
            >
              Browse Rooms <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bookings.map(booking => {
              const room = getRoomById(booking.roomId);
              const scfg = statusConfig[booking.status] ?? statusConfig.pending;
              return (
                <div
                  key={booking.id}
                  onClick={() => { setSelectedBooking(booking); setDialogOpen(true); }}
                  className="booking-card"
                  style={{
                    background: SURFACE, borderRadius: 14, overflow: 'hidden',
                    border: `1px solid ${BORDER}`,
                    boxShadow: '0 2px 10px rgba(26,22,18,0.05)',
                    cursor: 'pointer', display: 'flex',
                    transition: 'all 0.25s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(196,160,90,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(26,22,18,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(26,22,18,0.05)'; }}
                >
                  {/* Status left bar */}
                  <div style={{ width: 4, flexShrink: 0, background: scfg.dot, borderRadius: '14px 0 0 14px' }} />

                  {/* Room image */}
                  {room && (
                    <div style={{ width: 110, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
                      <img
                        src={room.images[0]}
                        alt={room.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.5s' }}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.06)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                      />
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 60%, rgba(255,255,255,0.08))' }} />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 5, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: TEXT }}>{room?.name || 'Room'}</span>
                      {room && (
                        <span style={{
                          fontSize: 9, padding: '2px 8px', borderRadius: 999,
                          background: 'rgba(196,160,90,0.1)', color: '#92660a',
                          border: '1px solid rgba(196,160,90,0.2)', fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                        }}>
                          {room.tier}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: MUTED, flexWrap: 'wrap' }}>
                      <Calendar size={11} />
                      <span>{booking.checkIn} → {booking.checkOut}</span>
                      <span>·</span>
                      <Users size={11} />
                      <span>{booking.guests} guest{booking.guests !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'rgba(138,125,110,0.55)', fontFamily: 'monospace' }}>
                      Ref: {booking.id.slice(0, 20)}…
                    </div>
                  </div>

                  {/* Right panel */}
                  <div style={{
                    padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10,
                    borderLeft: `1px solid ${BORDER}`, flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <StatusPill status={booking.status} />
                        <PaymentPill status={getDisplayPaymentStatus(booking)} />
                      </div>
                      <div style={{ fontFamily: 'Georgia, serif', fontSize: '1.3rem', fontStyle: 'italic', fontWeight: 300, color: TEXT, textAlign: 'right' }}>
                        ${booking.totalAmount}
                      </div>
                      {/* Pay Now button for unpaid bookings only */}
                      {(booking.paymentStatus === 'unpaid') && booking.status === 'pending' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingToPay(booking);
                            setSelectedPaymentMethod(booking.paymentMethod);
                            setPaymentDialogOpen(true);
                          }}
                          style={{
                            marginTop: 8,
                            padding: '8px 16px', borderRadius: 8,
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            border: 'none',
                            fontSize: 11, fontWeight: 700, color: '#fff',
                            cursor: 'pointer', fontFamily: 'Georgia, serif',
                            boxShadow: '0 3px 10px rgba(239,68,68,0.35)',
                            transition: 'opacity 0.2s',
                            display: 'flex', alignItems: 'center', gap: 6,
                            minWidth: '90px',
                            justifyContent: 'center',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                        >
                          <CreditCard size={14} />
                          Pay Now
                        </button>
                      )}
                    </div>
                    <ChevronRight size={15} color={MUTED} />
                  </div>

                  </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Booking Details Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={{ borderRadius: 16, border: 'none', boxShadow: '0 25px 60px rgba(0,0,0,0.18)', padding: 0, fontFamily: 'Georgia, serif' }}>

          {/* Dialog header */}
          <div style={{ background: DARK_HDR, padding: '20px 24px', borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, fontWeight: 700 }}>Reservation Details</span>
            </div>
            <DialogTitle style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 300, color: '#f7f3ee', margin: 0 }}>
              Reservation <em style={{ color: GOLD, fontStyle: 'italic' }}>Overview</em>
            </DialogTitle>
          </div>

          {selectedBooking && (() => {
            const room = getRoomById(selectedBooking.roomId);
            return (
              <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Room card */}
                {room && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}` }}>
                    <div style={{ height: 3, background: 'linear-gradient(90deg, #c4a05a, #d4b06a)' }} />
                    <img src={room.images[0]} alt={room.name} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                    <div style={{ padding: '14px 16px', background: SURFACE }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <h3 style={{ fontSize: 15, fontWeight: 700, color: TEXT, marginBottom: 2 }}>{room.name}</h3>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MapPin size={11} color={MUTED} />
                            <span style={{ fontSize: 11, color: MUTED }}>{room.tier} Room · Floor {room.floor}</span>
                          </div>
                        </div>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.2rem', fontStyle: 'italic', fontWeight: 300, color: GOLD }}>
                          ${room.pricePerNight}<span style={{ fontSize: 10, color: MUTED }}>/night</span>
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.7, marginBottom: 10 }}>{room.description}</p>
                      {/* Amenities */}
                      {room.amenities.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                          {room.amenities.map((a, i) => (
                            <span key={i} style={{
                              fontSize: 9, padding: '3px 9px', borderRadius: 999,
                              background: 'rgba(196,160,90,0.1)', color: '#92660a',
                              border: '1px solid rgba(196,160,90,0.25)', fontWeight: 600,
                              textTransform: 'uppercase', letterSpacing: '0.1em',
                            }}>{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Info tiles grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <InfoTile icon={Calendar} label="Check-in" value={selectedBooking.checkIn} sub={selectedBooking.checkInTime} />
                  <InfoTile icon={Calendar} label="Check-out" value={selectedBooking.checkOut} sub={selectedBooking.checkOutTime} />
                  <InfoTile icon={Users} label="Guests" value={`${selectedBooking.guests} guest${selectedBooking.guests !== 1 ? 's' : ''}`} />
                  <InfoTile icon={CreditCard} label="Payment Method" value={selectedBooking.paymentMethod.replace('_', ' ')} />
                </div>

                {/* Status row */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 5 }}>Booking Status</p>
                    <StatusPill status={selectedBooking.status} />
                  </div>
                  <div>
                    <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 5 }}>Payment Status</p>
                    <PaymentPill status={getDisplayPaymentStatus(selectedBooking)} />
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: CREAM, border: `1px solid ${BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
                      <FileText size={12} color={GOLD} />
                      <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: GOLD, fontWeight: 700 }}>Notes</span>
                    </div>
                    <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7 }}>{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Reference + total */}
                <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Booking Reference</span>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: TEXT }}>{selectedBooking.id}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #2c2418, #1a1612)',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(247,243,238,0.65)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total Amount</span>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.75rem', fontStyle: 'italic', fontWeight: 300, color: GOLD }}>
                      ${selectedBooking.totalAmount}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ padding: '0 24px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setDialogOpen(false)}
              style={{
                padding: '10px 24px', borderRadius: 8,
                background: CREAM, border: `1px solid ${BORDER}`,
                fontSize: 12, fontWeight: 600, color: TEXT, cursor: 'pointer',
                fontFamily: 'Georgia, serif', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = SURFACE; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = CREAM; }}
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Payment Dialog ── */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md" style={{ borderRadius: 16, border: 'none', boxShadow: '0 25px 60px rgba(0,0,0,0.18)', padding: 0, fontFamily: 'Georgia, serif', maxHeight: '90vh', overflow: 'auto' }}>
          {/* Dialog header */}
          <div style={{ background: DARK_HDR, padding: '20px 24px', borderRadius: '16px 16px 0 0', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(196,160,90,0.2) 0%, transparent 70%)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ display: 'block', height: 1, width: 14, background: GOLD }} />
              <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.28em', color: GOLD, fontWeight: 700 }}>Complete Payment</span>
            </div>
            <DialogTitle style={{ fontFamily: 'Georgia, serif', fontSize: '1.4rem', fontWeight: 300, color: '#f7f3ee', margin: 0 }}>
              Pay for <em style={{ color: GOLD, fontStyle: 'italic' }}>Booking</em>
            </DialogTitle>
          </div>

          {bookingToPay && (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Amount display */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderRadius: 10,
                background: 'linear-gradient(135deg, #2c2418, #1a1612)',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(247,243,238,0.65)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Amount Due</span>
                <span style={{ fontFamily: 'Georgia, serif', fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 300, color: GOLD }}>
                  ${bookingToPay.totalAmount}
                </span>
              </div>

              {/* Payment method selection - Toggleable */}
              <div>
                <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8, fontWeight: 700 }}>Select Payment Method (Click to toggle)</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { method: 'card' as PaymentMethod, label: 'Credit / Debit Card', desc: 'Pay securely with your card', color: '#6366f1' },
                    { method: 'bank_transfer' as PaymentMethod, label: 'Bank Transfer', desc: 'Transfer to hotel account', color: '#f59e0b' },
                    { method: 'cash' as PaymentMethod, label: 'Cash on Arrival', desc: 'Pay at check-in', color: '#10b981' },
                  ].map(({ method, label, desc, color }) => (
                    <button
                      key={method}
                      onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === method ? 'card' : method)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 8,
                        background: selectedPaymentMethod === method ? `${color}15` : SURFACE,
                        border: `2px solid ${selectedPaymentMethod === method ? color : BORDER}`,
                        cursor: 'pointer', transition: 'all 0.2s',
                        textAlign: 'left', width: '100%',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: selectedPaymentMethod === method ? color : CREAM,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: selectedPaymentMethod === method ? '#fff' : MUTED,
                        transition: 'all 0.2s',
                      }}>
                        <PaymentMethodIcon method={method} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: selectedPaymentMethod === method ? color : TEXT, transition: 'color 0.2s' }}>{label}</p>
                        <p style={{ fontSize: 10, color: MUTED }}>{desc}</p>
                      </div>
                      {selectedPaymentMethod === method && (
                        <div style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: 'linear-gradient(135deg, #c4a05a, #d4b06a)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="#1a1612" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Card Form */}
              {selectedPaymentMethod === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Card Preview */}
                  <div style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
                    borderRadius: 10, padding: '14px',
                    boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                    position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                    <div style={{ position: 'absolute', bottom: -10, left: -10, width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <CreditCard size={24} color="rgba(255,255,255,0.9)" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontStyle: 'italic' }}>VISA</span>
                      </div>
                      <div style={{ fontSize: 14, fontFamily: 'monospace', color: '#fff', letterSpacing: 2, marginBottom: 10 }}>
                        {cardNumber || '#### #### #### ####'}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Cardholder</div>
                          <div style={{ fontSize: 12, color: '#fff', textTransform: 'uppercase' }}>{cardName || 'YOUR NAME'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Expires</div>
                          <div style={{ fontSize: 12, color: '#fff' }}>{cardExpiry || 'MM/YY'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

              {/* Card Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 9, color: cardNumberError ? '#ef4444' : MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 4 }}>Card Number</label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={e => { setCardNumber(formatCardNumber(e.target.value)); setCardNumberError(''); }}
                    maxLength={19}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6,
                      border: `1px solid ${cardNumberError ? '#ef4444' : BORDER}`, background: CREAM,
                      fontSize: 13, fontFamily: 'monospace', color: TEXT,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => !cardNumberError && (e.target.style.borderColor = GOLD)}
                    onBlur={e => !cardNumberError && (e.target.style.borderColor = BORDER)}
                  />
                  {cardNumberError && (
                    <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={10} /> {cardNumberError}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 9, color: cardNameError ? '#ef4444' : MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 4 }}>Cardholder Name</label>
                  <input
                    type="text"
                    placeholder="Name as it appears on card"
                    value={cardName}
                    onChange={e => { setCardName(e.target.value); setCardNameError(''); }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6,
                      border: `1px solid ${cardNameError ? '#ef4444' : BORDER}`, background: CREAM,
                      fontSize: 13, color: TEXT,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => !cardNameError && (e.target.style.borderColor = GOLD)}
                    onBlur={e => !cardNameError && (e.target.style.borderColor = BORDER)}
                  />
                  {cardNameError && (
                    <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={10} /> {cardNameError}
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 9, color: cardExpiryError ? '#ef4444' : MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 4 }}>Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={e => {
                        let v = e.target.value.replace(/[^0-9]/g, '');
                        if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2, 4);
                        setCardExpiry(v);
                        setCardExpiryError('');
                      }}
                      maxLength={5}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6,
                        border: `1px solid ${cardExpiryError ? '#ef4444' : BORDER}`, background: CREAM,
                        fontSize: 13, textAlign: 'center', color: TEXT,
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => !cardExpiryError && (e.target.style.borderColor = GOLD)}
                      onBlur={e => !cardExpiryError && (e.target.style.borderColor = BORDER)}
                    />
                    {cardExpiryError && (
                      <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={10} /> {cardExpiryError}
                      </span>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: 9, color: cardCvvError ? '#ef4444' : MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 4 }}>CVV</label>
                    <input
                      type="password"
                      placeholder="123"
                      value={cardCvv}
                      onChange={e => { setCardCvv(e.target.value.replace(/[^0-9]/g, '').slice(0, 4)); setCardCvvError(''); }}
                      maxLength={4}
                      style={{
                        width: '100%', padding: '10px 12px', borderRadius: 6,
                        border: `1px solid ${cardCvvError ? '#ef4444' : BORDER}`, background: CREAM,
                        fontSize: 13, textAlign: 'center', color: TEXT,
                        outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={e => !cardCvvError && (e.target.style.borderColor = GOLD)}
                      onBlur={e => !cardCvvError && (e.target.style.borderColor = BORDER)}
                    />
                    {cardCvvError && (
                      <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <AlertCircle size={10} /> {cardCvvError}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.2)`, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={12} color="#10b981" />
                  <span style={{ fontSize: 10, color: '#059669' }}>Your payment is securely encrypted</span>
                </div>
              </div>
            </div>
          )}

          {/* Bank Transfer Form */}
          {selectedPaymentMethod === 'bank_transfer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Hotel Bank Details */}
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.25)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Building2 size={16} color="#d97706" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#b45309' }}>Hotel Bank Account</span>
                </div>
                <div style={{ display: 'grid', gap: 4, fontSize: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: MUTED }}>Bank:</span>
                    <span style={{ fontWeight: 600, color: TEXT }}>Metropolitan Bank</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: MUTED }}>Account:</span>
                    <span style={{ fontWeight: 600, color: TEXT }}>LuxeStay Hotel Inc.</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: MUTED }}>Number:</span>
                    <span style={{ fontWeight: 600, color: TEXT, fontFamily: 'monospace' }}>1234 5678 9012 3456</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: MUTED }}>SWIFT:</span>
                    <span style={{ fontWeight: 600, color: TEXT }}>METBPHMM</span>
                  </div>
                </div>
                <div style={{ marginTop: 8, padding: '8px', borderRadius: 4, background: '#fff', border: `1px dashed ${BORDER}` }}>
                  <span style={{ fontSize: 9, color: MUTED }}>Reference: </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: GOLD, fontFamily: 'monospace' }}>{referenceNumber}</span>
                </div>
              </div>

              {/* Transfer Instructions */}
              <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(99,102,241,0.06)', border: `1px solid rgba(99,102,241,0.15)` }}>
                <p style={{ fontSize: 9, color: '#4f46e5', fontWeight: 700, marginBottom: 4 }}>Instructions:</p>
                <ol style={{ fontSize: 9, color: MUTED, paddingLeft: 14, margin: 0, lineHeight: 1.5 }}>
                  <li>Log in to your online banking</li>
                  <li>Transfer to the hotel account above</li>
                  <li>Include reference number in description</li>
                  <li>Save your receipt</li>
                </ol>
              </div>

              {/* User Bank Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 9, color: bankNameError ? '#ef4444' : MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 3 }}>Your Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g., BDO, BPI"
                    value={bankName}
                    onChange={e => { setBankName(e.target.value); setBankNameError(''); }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6,
                      border: `1px solid ${bankNameError ? '#ef4444' : BORDER}`, background: CREAM,
                      fontSize: 13, color: TEXT,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => !bankNameError && (e.target.style.borderColor = GOLD)}
                    onBlur={e => !bankNameError && (e.target.style.borderColor = BORDER)}
                  />
                  {bankNameError && (
                    <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={10} /> {bankNameError}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 9, color: accountHolderError ? '#ef4444' : MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 3 }}>Account Holder</label>
                  <input
                    type="text"
                    placeholder="Name on account"
                    value={accountHolder}
                    onChange={e => { setAccountHolder(e.target.value); setAccountHolderError(''); }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6,
                      border: `1px solid ${accountHolderError ? '#ef4444' : BORDER}`, background: CREAM,
                      fontSize: 13, color: TEXT,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => !accountHolderError && (e.target.style.borderColor = GOLD)}
                    onBlur={e => !accountHolderError && (e.target.style.borderColor = BORDER)}
                  />
                  {accountHolderError && (
                    <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={10} /> {accountHolderError}
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: 9, color: accountNumberError ? '#ef4444' : MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, display: 'block', marginBottom: 3 }}>Account Number</label>
                  <input
                    type="text"
                    placeholder="For verification"
                    value={accountNumber}
                    onChange={e => { setAccountNumber(e.target.value); setAccountNumberError(''); }}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 6,
                      border: `1px solid ${accountNumberError ? '#ef4444' : BORDER}`, background: CREAM,
                      fontSize: 13, fontFamily: 'monospace', color: TEXT,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={e => !accountNumberError && (e.target.style.borderColor = GOLD)}
                    onBlur={e => !accountNumberError && (e.target.style.borderColor = BORDER)}
                  />
                  {accountNumberError && (
                    <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertCircle size={10} /> {accountNumberError}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ padding: '8px 10px', borderRadius: 6, background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)` }}>
                <span style={{ fontSize: 9, color: '#b45309' }}>Booking confirmed after verification (1-2 hours)</span>
              </div>
            </div>
          )}

          {/* Cash on Arrival Form */}
          {selectedPaymentMethod === 'cash' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Cash Payment Info */}
              <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(16,185,129,0.08)', border: `1px solid rgba(16,185,129,0.2)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Banknote size={16} color="#059669" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#047857' }}>Cash on Arrival</span>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 10, color: MUTED }}>Amount: </span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#059669', fontFamily: 'Georgia, serif' }}>${bookingToPay?.totalAmount}</span>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: 4, background: '#fff', border: `1px solid rgba(16,185,129,0.15)` }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={10} color="#059669" />
                      <span style={{ fontSize: 9, color: TEXT }}>Due at check-in (after 2:00 PM)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={10} color="#059669" />
                      <span style={{ fontSize: 9, color: TEXT }}>Front Desk, LuxeStay Hotel</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Important Notes */}
              <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(245,158,11,0.08)', border: `1px solid rgba(245,158,11,0.2)` }}>
                <p style={{ fontSize: 9, color: '#b45309', fontWeight: 700, marginBottom: 4 }}>Important:</p>
                <ul style={{ fontSize: 9, color: MUTED, paddingLeft: 14, margin: 0, lineHeight: 1.5 }}>
                  <li>Accepted: USD, EUR, Local Currency</li>
                  <li>Cancellation: 24 hours before check-in</li>
                </ul>
              </div>

              {/* Confirmation Checkbox */}
              <div>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', padding: '10px', borderRadius: 6, background: cashConfirmed ? 'rgba(16,185,129,0.08)' : CREAM, border: `1px solid ${cashConfirmed ? 'rgba(16,185,129,0.3)' : cashConfirmedError ? '#ef4444' : BORDER}`, transition: 'all 0.2s' }}>
                  <input
                    type="checkbox"
                    checked={cashConfirmed}
                    onChange={e => { setCashConfirmed(e.target.checked); setCashConfirmedError(''); }}
                    style={{ marginTop: 2, width: 14, height: 14, accentColor: '#10b981' }}
                  />
                  <span style={{ fontSize: 10, color: TEXT, lineHeight: 1.4 }}>
                    I understand I need to pay <strong>${bookingToPay?.totalAmount}</strong> in cash upon arrival.
                  </span>
                </label>
                {cashConfirmedError && (
                  <span style={{ fontSize: 10, color: '#ef4444', marginTop: 4, marginLeft: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <AlertCircle size={10} /> {cashConfirmedError}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Info note */}
          <div style={{ padding: '10px 12px', borderRadius: 6, background: 'rgba(196,160,90,0.08)', border: `1px solid ${BORDER}` }}>
            <p style={{ fontSize: 10, color: MUTED, lineHeight: 1.4 }}>
              <strong style={{ color: TEXT }}>Note:</strong> Your payment will be held until admin approval.
            </p>
          </div>
        </div>
      )}

      {/* Footer buttons */}
      <div style={{ padding: '0 20px 16px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={() => setPaymentDialogOpen(false)}
          disabled={isProcessingPayment}
          style={{
            padding: '8px 16px', borderRadius: 6,
            background: CREAM, border: `1px solid ${BORDER}`,
            fontSize: 11, fontWeight: 600, color: TEXT, cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif', transition: 'all 0.2s',
            opacity: isProcessingPayment ? 0.6 : 1,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; }}
        >
          Cancel
        </button>
        <button
          onClick={handlePaymentSubmit}
          disabled={isProcessingPayment}
          style={{
            padding: '8px 18px', borderRadius: 6,
            background: selectedPaymentMethod === 'card' 
              ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : selectedPaymentMethod === 'cash'
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none',
            fontSize: 11, fontWeight: 700, color: '#fff', cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif',
            boxShadow: selectedPaymentMethod === 'card' 
              ? '0 2px 8px rgba(99,102,241,0.35)'
              : selectedPaymentMethod === 'cash'
              ? '0 2px 8px rgba(16,185,129,0.35)'
              : '0 2px 8px rgba(245,158,11,0.35)',
            transition: 'opacity 0.2s',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: isProcessingPayment ? 0.7 : 1,
          }}
        >
          {isProcessingPayment ? (
            <>
              <div style={{ width: 12, height: 12, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              Processing...
            </>
          ) : (
            <>
              {selectedPaymentMethod === 'card' && <CreditCard size={12} />}
              {selectedPaymentMethod === 'bank_transfer' && <Building2 size={12} />}
              {selectedPaymentMethod === 'cash' && <Banknote size={12} />}
              {selectedPaymentMethod === 'card' && 'Pay & Submit'}
              {selectedPaymentMethod === 'bank_transfer' && 'Confirm Transfer'}
              {selectedPaymentMethod === 'cash' && 'Confirm Cash'}
            </>
          )}
        </button>
      </div>
    </DialogContent>
  </Dialog>
    </div>
  );
};

export default UserDashboard;