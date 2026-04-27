import { useAuth } from '@/contexts/AuthContext';
import { useHotel } from '@/contexts/HotelContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { BedDouble, CalendarCheck, Users, Clock, Sparkles, AlertTriangle, Wrench } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-primary/20 text-primary',
  checked_in: 'bg-success/20 text-success',
  checked_out: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
};

const StaffDashboard = () => {
  const { user } = useAuth();
  const { bookings, rooms, payments } = useHotel();

  // Calculate stats
  const todayBookings = bookings.filter(b => b.checkIn === new Date().toISOString().split('T')[0]);
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const dirtyRooms = rooms.filter(r => r.condition === 'dirty');
  const maintenanceRooms = rooms.filter(r => r.condition === 'maintenance');

  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Staff Dashboard</h1>
      <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>

      {/* Stats Grid */}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-accent p-2"><CalendarCheck className="h-5 w-5 text-accent-foreground" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Today's Arrivals</div>
              <div className="text-xl font-bold text-foreground">{todayBookings.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-warning/20 p-2"><Clock className="h-5 w-5 text-warning" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Pending</div>
              <div className="text-xl font-bold text-foreground">{pendingBookings.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-destructive/20 p-2"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Dirty Rooms</div>
              <div className="text-xl font-bold text-foreground">{dirtyRooms.length}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-md bg-muted p-2"><Wrench className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <div className="text-xs text-muted-foreground">Maintenance</div>
              <div className="text-xl font-bold text-foreground">{maintenanceRooms.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link to="/staff/frontdesk">Front Desk</Link></Button>
        <Button asChild variant="outline"><Link to="/staff/housekeeping">Housekeeping</Link></Button>
        <Button asChild variant="outline"><Link to="/staff/reservations">Reservations</Link></Button>
      </div>

      {/* Recent Bookings */}
      <Card className="mt-6 card-elevated">
        <CardHeader>
          <CardTitle className="font-heading">Recent Bookings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground">No recent bookings</p>
          ) : (
            recentBookings.map(booking => (
              <div key={booking.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div>
                  <div className="font-medium text-foreground">Booking {booking.id}</div>
                  <div className="text-xs text-muted-foreground">{booking.checkIn} → {booking.checkOut}</div>
                </div>
                <Badge className={statusColors[booking.status]}>{booking.status.replace('_', ' ')}</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDashboard;
