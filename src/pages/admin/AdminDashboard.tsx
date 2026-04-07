import { useHotel } from '@/contexts/HotelContext';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble, CalendarCheck, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { mockUsers } from '@/data/mockData';

const AdminDashboard = () => {
  const { rooms, bookings, payments } = useHotel();

  const stats = [
    { icon: BedDouble, label: 'Total Rooms', value: rooms.length, sub: `${rooms.filter(r => r.isActive).length} active` },
    { icon: CalendarCheck, label: 'Total Bookings', value: bookings.length, sub: `${bookings.filter(b => b.status === 'pending').length} pending` },
    { icon: DollarSign, label: 'Revenue', value: `$${payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0).toLocaleString()}`, sub: 'from paid bookings' },
    { icon: Users, label: 'Users', value: mockUsers.filter(u => u.role === 'user').length, sub: 'registered guests' },
    { icon: TrendingUp, label: 'Occupancy', value: `${Math.round((bookings.filter(b => b.status === 'checked_in').length / Math.max(rooms.filter(r => r.isActive).length, 1)) * 100)}%`, sub: 'current occupancy' },
    { icon: AlertCircle, label: 'Unpaid', value: bookings.filter(b => b.paymentStatus === 'unpaid').length, sub: 'awaiting payment' },
  ];

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h1>
      <p className="text-muted-foreground">Welcome to the admin panel</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s, i) => (
          <Card key={i} className="card-elevated">
            <CardContent className="p-4">
              <s.icon className="h-5 w-5 text-primary" />
              <div className="mt-2 text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>
              <div className="text-xs text-muted-foreground/70">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading text-lg font-semibold text-foreground">Recent Bookings</h3>
            <div className="mt-4 space-y-3">
              {bookings.slice(0, 5).map(b => {
                const u = mockUsers.find(u => u.id === b.userId);
                const r = rooms.find(r => r.id === b.roomId);
                return (
                  <div key={b.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div>
                      <div className="font-medium text-foreground">{u?.name} — {r?.name}</div>
                      <div className="text-xs text-muted-foreground">{b.checkIn} → {b.checkOut}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-primary/20 text-primary' : b.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="font-heading text-lg font-semibold text-foreground">Room Status</h3>
            <div className="mt-4 space-y-3">
              {rooms.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div>
                    <div className="font-medium text-foreground">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.tier} · Floor {r.floor}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                    {r.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
