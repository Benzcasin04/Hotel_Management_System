import { useAuth } from '@/contexts/AuthContext';
import { useHotel } from '@/contexts/HotelContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, BedDouble, Clock, DollarSign } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-primary/20 text-primary',
  checked_in: 'bg-success/20 text-success',
  checked_out: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
};

const paymentColors: Record<string, string> = {
  unpaid: 'bg-destructive/20 text-destructive',
  paid: 'bg-success/20 text-success',
  refunded: 'bg-muted text-muted-foreground',
};

const UserDashboard = () => {
  const { user } = useAuth();
  const { getBookingsByUser, getRoomById } = useHotel();

  if (!user) return <Navigate to="/login" />;

  const bookings = getBookingsByUser(user.id);

  return (
    <div className="animate-fade-in py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <h1 className="font-heading text-3xl font-bold text-foreground">My Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Welcome back, {user.name}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[
            { icon: CalendarCheck, label: 'Total Bookings', value: bookings.length },
            { icon: Clock, label: 'Pending', value: bookings.filter(b => b.status === 'pending').length },
            { icon: BedDouble, label: 'Active', value: bookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length },
            { icon: DollarSign, label: 'Total Spent', value: `$${bookings.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.totalAmount, 0)}` },
          ].map((s, i) => (
            <Card key={i} className="card-elevated">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-md bg-accent p-2"><s.icon className="h-5 w-5 text-accent-foreground" /></div>
                <div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                  <div className="text-xl font-bold text-foreground">{s.value}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold text-foreground">My Reservations</h2>
          <Button asChild><Link to="/rooms">Book New Room</Link></Button>
        </div>

        <div className="mt-4 space-y-4">
          {bookings.length === 0 ? (
            <Card className="py-12 text-center">
              <CalendarCheck className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">No bookings yet. Browse our rooms to get started!</p>
            </Card>
          ) : (
            bookings.map(booking => {
              const room = getRoomById(booking.roomId);
              return (
                <Card key={booking.id} className="card-elevated">
                  <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      {room && <img src={room.images[0]} alt={room.name} className="h-16 w-24 rounded-md object-cover" />}
                      <div>
                        <h3 className="font-heading font-semibold text-foreground">{room?.name || 'Room'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.checkIn} → {booking.checkOut} · {booking.guests} guest(s)
                        </p>
                        <p className="text-xs text-muted-foreground">Ref: {booking.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={statusColors[booking.status]}>{booking.status.replace('_', ' ')}</Badge>
                      <Badge className={paymentColors[booking.paymentStatus]}>{booking.paymentStatus}</Badge>
                      <span className="font-semibold text-foreground">${booking.totalAmount}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
