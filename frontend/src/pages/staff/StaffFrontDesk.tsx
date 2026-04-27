import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/data/mockData';
import { logAuditAction } from '@/pages/admin/AdminSettings';
import { Search, LogIn, LogOut } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-primary/20 text-primary',
  checked_in: 'bg-success/20 text-success',
  checked_out: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
};

const StaffFrontDesk = () => {
  const { bookings, rooms, updateBookingStatus } = useHotel();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  // Show confirmed (arrivals) and checked_in (departures)
  const relevant = bookings.filter(b =>
    b.status === 'confirmed' || b.status === 'checked_in' || b.status === 'pending'
  );

  const filtered = relevant.filter(b => {
    const guest = mockUsers.find(u => u.id === b.userId);
    const room = rooms.find(r => r.id === b.roomId);
    return (guest?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (room?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
  });

  const handleCheckIn = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const guest = mockUsers.find(u => u.id === booking?.userId);
    const room = rooms.find(r => r.id === booking?.roomId);
    
    updateBookingStatus(bookingId, 'checked_in');
    
    // Log to audit trail
    logAuditAction(
      'Staff: Guest Check-in',
      `${room?.name || 'Room'} - ${guest?.name || 'Guest'}`,
      'success',
      `Staff ${user?.name} checked in guest ${guest?.name || 'Guest'}`
    );
    
    toast({ title: 'Guest checked in successfully' });
  };

  const handleCheckOut = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    const guest = mockUsers.find(u => u.id === booking?.userId);
    const room = rooms.find(r => r.id === booking?.roomId);
    
    updateBookingStatus(bookingId, 'checked_out');
    
    // Log to audit trail
    logAuditAction(
      'Staff: Guest Check-out',
      `${room?.name || 'Room'} - ${guest?.name || 'Guest'}`,
      'warning',
      `Staff ${user?.name} checked out guest ${guest?.name || 'Guest'}, room marked dirty`
    );
    
    toast({ title: 'Guest checked out — room marked dirty' });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Front Desk</h1>
      <p className="text-sm text-muted-foreground">Check guests in and out</p>

      <div className="mt-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by guest, room, or ref..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <div className="mt-6 space-y-4">
        {filtered.map(booking => {
          const guest = mockUsers.find(u => u.id === booking.userId);
          const room = rooms.find(r => r.id === booking.roomId);
          return (
            <Card key={booking.id} className="card-elevated">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {room && <img src={room.images[0]} alt={room.name} className="h-14 w-20 rounded-md object-cover" />}
                  <div>
                    <h3 className="font-semibold text-foreground">{guest?.name}</h3>
                    <p className="text-sm text-muted-foreground">{room?.name} · Room {room?.floor}F</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.checkIn} → {booking.checkOut} · {booking.guests} guest(s) · Ref: {booking.id}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[booking.status]}>{booking.status.replace('_', ' ')}</Badge>
                  {(booking.status === 'confirmed' || booking.status === 'pending') && (
                    <Button size="sm" onClick={() => handleCheckIn(booking.id)} className="gap-1">
                      <LogIn className="h-4 w-4" /> Check In
                    </Button>
                  )}
                  {booking.status === 'checked_in' && (
                    <Button size="sm" variant="outline" onClick={() => handleCheckOut(booking.id)} className="gap-1">
                      <LogOut className="h-4 w-4" /> Check Out
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No active bookings found.</div>
        )}
      </div>
    </div>
  );
};

export default StaffFrontDesk;
