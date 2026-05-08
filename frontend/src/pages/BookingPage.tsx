import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/contexts/NotificationContext';
import { PaymentMethod, PaymentStatus } from '@/types/hotel';
import { CalendarCheck, Users, AlertCircle, Clock, CreditCard } from 'lucide-react';

const BookingPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { getRoomById, createBooking, isRoomAvailable } = useHotel();
  const { user } = useAuth();
  const { createNotification } = useNotifications();
  const navigate = useNavigate();
  const { toast } = useToast();

  const room = getRoomById(roomId || '');

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check if room is in a condition that prevents booking
  const isRoomBookable = room?.condition === 'clean' || !room?.condition;
  const roomConditionMessage = room?.condition === 'dirty' 
    ? 'This room is currently dirty and unavailable for booking.' 
    : room?.condition === 'maintenance' 
    ? 'This room is under maintenance and unavailable for booking.' 
    : '';

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [availability, setAvailability] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!room || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Room not found or not authenticated.</p>
      </div>
    );
  }

  const nights = checkIn && checkOut ? Math.max(0, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000)) : 0;
  const total = nights * room.pricePerNight;

  const checkAvailability = () => {
    if (!checkIn || !checkOut) return;
    const available = isRoomAvailable(room.id, checkIn, checkOut, checkInTime, checkOutTime);
    setAvailability(available);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nights <= 0) {
      toast({ title: 'Invalid dates', description: 'Check-out must be after check-in.', variant: 'destructive' });
      return;
    }
    // Prevent booking if room is dirty or under maintenance
    if (!isRoomBookable) {
      toast({ 
        title: 'Room Unavailable', 
        description: roomConditionMessage, 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = await createBooking({
      userId: user.id,
      roomId: room.id,
      checkIn,
      checkOut,
      checkInTime,
      checkOutTime,
      guests,
      status: 'pending',
      totalAmount: total,
      paymentStatus: 'unpaid' as PaymentStatus,
      paymentMethod,
    });
    setIsProcessing(false);
    
    if (result.success) {
      toast({ title: 'Booking Created!', description: `Booking ref confirmed. Total: $${total}` });
      
      // Create notification for admin/staff
      createNotification({
        userId: null, // null means all admins/staff see it
        title: 'New Booking Received',
        message: `${user.name} booked ${room.name} for ${nights} night(s) - $${total}`,
        type: 'booking',
        relatedId: undefined, // Booking ID not returned from createBooking
        read: false,
      });
      
      navigate('/dashboard');
    } else {
      setIsProcessing(false);
      toast({ title: 'Booking Failed', description: result.error, variant: 'destructive' });
    }
  };


  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="animate-fade-in py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">Book: {room.name}</h1>
        <Badge className="mt-2">{room.tier}</Badge>

        {/* Room condition warning */}
        {!isRoomBookable && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Room Unavailable</span>
            </div>
            <p className="mt-1 text-sm">{roomConditionMessage}</p>
          </div>
        )}

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Room info */}
          <div>
            <img src={room.images[0]} alt={room.name} className="rounded-lg object-cover w-full h-64" width={800} height={600} />
            <div className="mt-4">
              <p className="text-muted-foreground">{room.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {room.amenities.map(a => (
                  <Badge key={a} variant="outline">{a}</Badge>
                ))}
              </div>
              <p className="mt-4 text-2xl font-bold text-primary">${room.pricePerNight}<span className="text-sm font-normal text-muted-foreground">/night</span></p>
            </div>
          </div>

          {/* Booking form */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading flex items-center gap-2">
                <CalendarCheck className="h-5 w-5 text-primary" />
                Reservation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Check-in Date</Label>
                    <Input type="date" min={today} value={checkIn} onChange={e => { setCheckIn(e.target.value); setAvailability(null); }} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Check-out Date</Label>
                    <Input type="date" min={checkIn || today} value={checkOut} onChange={e => { setCheckOut(e.target.value); setAvailability(null); }} required />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Check-in Time
                    </Label>
                    <Input 
                      type="time" 
                      value={checkInTime} 
                      onChange={e => { setCheckInTime(e.target.value); setAvailability(null); }} 
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Check-out Time
                    </Label>
                    <Input 
                      type="time" 
                      value={checkOutTime} 
                      onChange={e => { setCheckOutTime(e.target.value); setAvailability(null); }} 
                      required 
                    />
                  </div>
                </div>
                {checkIn === checkOut && (
                  <p className="text-xs text-muted-foreground bg-accent/50 p-2 rounded">
                    Same-day booking selected. Times must not overlap with existing bookings.
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Guests</Label>
                  <Input type="number" min={1} max={room.capacity} value={guests} onChange={e => setGuests(parseInt(e.target.value))} required />
                  <p className="text-xs text-muted-foreground">Max: {room.capacity} guests</p>
                </div>

                <Button type="button" variant="outline" className="w-full" onClick={checkAvailability} disabled={!checkIn || !checkOut}>
                  Check Availability
                </Button>

                {availability !== null && (
                  <div className={`flex items-center gap-2 rounded-md p-3 text-sm ${availability ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
                    {availability ? (
                      <>
                        ✓ Room is available for your dates!
                        {checkIn === checkOut && (
                          <span className="block text-xs mt-1">Time slot {checkInTime} - {checkOutTime} is free.</span>
                        )}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4" /> 
                        {checkIn === checkOut ? (
                          <>Time slot {checkInTime} - {checkOutTime} overlaps with an existing booking. Please choose a different time.</>
                        ) : (
                          <>Room is occupied for these dates. Please choose different dates.</>
                        )}
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Credit / Debit Card
                        </span>
                      </SelectItem>
                      <SelectItem value="cash">Cash on Arrival</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Method Notice */}
                {paymentMethod && nights <= 0 && (
                  <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm text-amber-700 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Please select check-in and check-out dates first to proceed with booking.
                    </p>
                  </div>
                )}

                {nights > 0 && (
                  <div className="rounded-md bg-muted p-4">
                    <h4 className="font-semibold text-foreground">Booking Summary</h4>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between"><span>{nights} night(s) × ${room.pricePerNight}</span><span>${total}</span></div>
                      <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground"><span>Total</span><span>${total}</span></div>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  size="lg" 
                  disabled={!isRoomBookable || availability === false || nights <= 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Proceed to Payment
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
