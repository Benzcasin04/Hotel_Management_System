import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useToast } from '@/hooks/use-toast';
import { logAuditAction } from './AdminSettings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Booking, BookingStatus } from '@/types/hotel';
import { Search, Trash2, X, Users, Calendar, CreditCard, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

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

const AdminBookings = () => {
  const { bookings, rooms, users, updateBookingStatus, cancelBooking, deleteBookingPermanently, getRoomById } = useHotel();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);

  const filtered = bookings.filter(b => {
    const user = users.find(u => u.id === b.userId);
    const room = rooms.find(r => r.id === b.roomId);
    const matchSearch = (user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (room?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = async (bookingId: string, status: string) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (status === 'cancelled') {
        await cancelBooking(bookingId);
      } else {
        await updateBookingStatus(bookingId, status as BookingStatus);
      }
      
      // Log to audit trail
      const room = rooms.find(r => r.id === booking?.roomId);
      const user = users.find(u => u.id === booking?.userId);
      logAuditAction(
        status === 'cancelled' ? 'Cancelled Booking' : `Updated Booking to ${status}`,
        `${room?.name || 'Room'} - ${user?.name || 'Guest'}`,
        status === 'cancelled' ? 'warning' : 'success',
        `Booking ${bookingId.slice(0, 8)} status changed to ${status}`
      );
      
      toast({ title: `Booking status updated to ${status}` });
    } catch (error) {
      toast({ title: 'Failed to update status', variant: 'destructive' });
    }
  };

  const openDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDialogOpen(true);
  };

  const openDeleteDialog = (e: React.MouseEvent, booking: Booking) => {
    e.stopPropagation();
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBooking = async () => {
    if (!bookingToDelete) return;
    try {
      await deleteBookingPermanently(bookingToDelete.id);
      
      // Log to audit trail
      const room = rooms.find(r => r.id === bookingToDelete.roomId);
      const user = users.find(u => u.id === bookingToDelete.userId);
      logAuditAction(
        'Deleted Booking',
        `${room?.name || 'Room'} - ${user?.name || 'Guest'}`,
        'warning',
        `Booking ${bookingToDelete.id.slice(0, 8)} permanently deleted`
      );
      
      toast({ title: 'Booking permanently deleted' });
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    } catch (error) {
      toast({ title: 'Failed to delete booking', variant: 'destructive' });
    }
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
          const user = users.find(u => u.id === booking.userId);
          const room = rooms.find(r => r.id === booking.roomId);
          return (
            <Card 
              key={booking.id} 
              className="card-elevated cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => openDetails(booking)}
            >
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  {room && <img src={room.images[0]} alt={room.name} className="h-14 w-20 rounded-md object-cover" />}
                  <div>
                    <h3 className="font-semibold text-foreground">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{room?.name} · {booking.checkIn} → {booking.checkOut}</p>
                    <p className="text-xs text-muted-foreground">Ref: {booking.id} · {booking.guests} guest(s)</p>
                  </div>
                </div>
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={e => openDeleteDialog(e, booking)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">No bookings found.</div>
        )}
      </div>

      {/* Booking Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (() => {
            const room = getRoomById(selectedBooking.roomId);
            const user = users.find(u => u.id === selectedBooking.userId);
            return (
              <div className="space-y-6">
                {/* Guest Info */}
                <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user?.name || 'Guest'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
                  </div>
                </div>

                {/* Room Info */}
                {room && (
                  <div className="space-y-3">
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
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, idx) => (
                        <Badge key={idx} variant="secondary">{amenity}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Dates & Info */}
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

                {/* Status */}
                <div className="flex items-center gap-4">
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
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Booking Permanently
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this booking? This action cannot be undone and will remove the booking from the database completely.
            </DialogDescription>
          </DialogHeader>
          {bookingToDelete && (
            <div className="py-4">
              <p className="text-sm"><strong>Booking ID:</strong> {bookingToDelete.id}</p>
              <p className="text-sm"><strong>Guest:</strong> {users.find(u => u.id === bookingToDelete.userId)?.name}</p>
              <p className="text-sm"><strong>Room:</strong> {rooms.find(r => r.id === bookingToDelete.roomId)?.name}</p>
              <p className="text-sm"><strong>Amount:</strong> ${bookingToDelete.totalAmount}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteBooking}>Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
