import { mockUsers } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useHotel } from '@/contexts/HotelContext';

const AdminUsers = () => {
  const { bookings } = useHotel();

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">User Management</h1>
      <p className="text-sm text-muted-foreground">{mockUsers.length} registered users</p>

      <div className="mt-6 space-y-4">
        {mockUsers.map(user => {
          const userBookings = bookings.filter(b => b.userId === user.id);
          return (
            <Card key={user.id} className="card-elevated">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.email} · {user.phone}</p>
                    <p className="text-xs text-muted-foreground">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={user.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}>
                    {user.role}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{userBookings.length} booking(s)</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminUsers;
