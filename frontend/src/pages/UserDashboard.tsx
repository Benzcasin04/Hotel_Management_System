import { useAuth } from '@/contexts/AuthContext';
import { useHotel } from '@/contexts/HotelContext';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarCheck, BedDouble, Clock, DollarSign, X, Users, Calendar, CreditCard, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';
import { Booking } from '@/types/hotel';

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
  const { user, isLoading } = useAuth();
  const { getBookingsByUser, getRoomById } = useHotel();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Wait for auth to finish loading before redirecting
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

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
                <Card 
                  key={booking.id} 
                  className="card-elevated cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setDialogOpen(true);
                  }}
                >
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

      {/* Booking Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Reservation Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (() => {
            const room = getRoomById(selectedBooking.roomId);
            return (
              <div className="space-y-6">
                {/* Room Image and Name */}
                {room && (
                  <div className="space-y-2">
                    <img 
                      src={room.images[0]} 
                      alt={room.name} 
                      className="w-full h-48 object-cover rounded-lg" 
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-heading text-xl font-semibold">{room.name}</h3>
                        <p className="text-muted-foreground">{room.tier} Room · Floor {room.floor}</p>
                      </div>
                      <Badge variant="outline">${room.pricePerNight}/night</Badge>
                    </div>
                  </div>
                )}

                {/* Booking Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check-in</p>
                      <p className="font-medium">{selectedBooking.checkIn}</p>
                      {selectedBooking.checkInTime && (
                        <p className="text-xs text-primary">{selectedBooking.checkInTime}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Check-out</p>
                      <p className="font-medium">{selectedBooking.checkOut}</p>
                      {selectedBooking.checkOutTime && (
                        <p className="text-xs text-primary">{selectedBooking.checkOutTime}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Guests</p>
                      <p className="font-medium">{selectedBooking.guests} guest(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Method</p>
                      <p className="font-medium capitalize">{selectedBooking.paymentMethod.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Booking Status</p>
                    <Badge className={statusColors[selectedBooking.status]}>
                      {selectedBooking.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                    <Badge className={paymentColors[selectedBooking.paymentStatus]}>
                      {selectedBooking.paymentStatus}
                    </Badge>
                  </div>
                </div>

                {/* Room Description */}
                {room && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Room Description</p>
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  </div>
                )}

                {/* Amenities */}
                {room && room.amenities.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, idx) => (
                        <Badge key={idx} variant="outline">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notes
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedBooking.notes}</p>
                  </div>
                )}

                {/* Reference & Total */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Booking Reference</p>
                    <p className="text-sm font-mono">{selectedBooking.id}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">${selectedBooking.totalAmount}</p>
                  </div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserDashboard;
