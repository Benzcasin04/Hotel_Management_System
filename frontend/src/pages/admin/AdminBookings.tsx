import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/data/mockData';
import { BookingStatus } from '@/types/hotel';
import { Search } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-primary/20 text-primary',
  checked_in: 'bg-success/20 text-success',
  checked_out: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
};

const AdminBookings = () => {
  const { bookings, rooms, updateBookingStatus, cancelBooking } = useHotel();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = bookings.filter(b => {
    const user = mockUsers.find(u => u.id === b.userId);
    const room = rooms.find(r => r.id === b.roomId);
    const matchSearch = (user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (room?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (bookingId: string, status: string) => {
    if (status === 'cancelled') {
      cancelBooking(bookingId);
    } else {
      updateBookingStatus(bookingId, status as BookingStatus);
    }
    toast({ title: `Booking status updated to ${status}` });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Booking Management</h1>
      <p className="text-sm text-muted-foreground">{bookings.length} total bookings</p>

      <div className="mt-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search by guest, room, or ref..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="checked_in">Checked In</SelectItem>
            <SelectItem value="checked_out">Checked Out</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.map(booking => {
          const user = mockUsers.find(u => u.id === booking.userId);
          const room = rooms.find(r => r.id === booking.roomId);
          return (
            <Card key={booking.id} className="card-elevated">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {room && <img src={room.images[0]} alt={room.name} className="h-14 w-20 rounded-md object-cover" />}
                  <div>
                    <h3 className="font-semibold text-foreground">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{room?.name} · {booking.checkIn} → {booking.checkOut}</p>
                    <p className="text-xs text-muted-foreground">Ref: {booking.id} · {booking.guests} guest(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={statusColors[booking.status]}>{booking.status.replace('_', ' ')}</Badge>
                  <span className="font-semibold text-foreground">${booking.totalAmount}</span>
                  <Select value={booking.status} onValueChange={v => handleStatusChange(booking.id, v)}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="checked_in">Check In</SelectItem>
                      <SelectItem value="checked_out">Check Out</SelectItem>
                      <SelectItem value="cancelled">Cancel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No bookings found.</div>
        )}
      </div>
    </div>
  );
};

export default AdminBookings;
