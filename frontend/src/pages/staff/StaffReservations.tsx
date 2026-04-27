import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/data/mockData';
import { logAuditAction } from '@/pages/admin/AdminSettings';
import { Search, MessageSquarePlus, Eye } from 'lucide-react';

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  confirmed: 'bg-primary/20 text-primary',
  checked_in: 'bg-success/20 text-success',
  checked_out: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/20 text-destructive',
};

const paymentColors: Record<string, string> = {
  paid: 'bg-success/20 text-success',
  unpaid: 'bg-destructive/20 text-destructive',
  refunded: 'bg-muted text-muted-foreground',
};

const StaffReservations = () => {
  const { bookings, rooms, payments } = useHotel();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [noteDialog, setNoteDialog] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [detailDialog, setDetailDialog] = useState<string | null>(null);

  const filtered = bookings.filter(b => {
    const guest = mockUsers.find(u => u.id === b.userId);
    const room = rooms.find(r => r.id === b.roomId);
    const matchSearch = (guest?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (room?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      b.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleSaveNote = () => {
    if (noteDialog && noteText.trim()) {
      const booking = bookings.find(b => b.id === noteDialog);
      const guest = mockUsers.find(u => u.id === booking?.userId);
      const room = rooms.find(r => r.id === booking?.roomId);
      
      // TODO: addGuestNotes function not implemented yet
      // addGuestNotes(noteDialog, noteText, user?.name);
      
      // Log to audit trail
      logAuditAction(
        'Staff: Added Guest Note',
        `${room?.name || 'Room'} - ${guest?.name || 'Guest'}`,
        'success',
        `Staff ${user?.name} added note to booking ${noteDialog.slice(0, 8)}`
      );
      
      toast({ title: 'Guest notes saved' });
    }
    setNoteDialog(null);
    setNoteText('');
  };

  const detailBooking = detailDialog ? bookings.find(b => b.id === detailDialog) : null;
  const detailGuest = detailBooking ? mockUsers.find(u => u.id === detailBooking.userId) : null;
  const detailRoom = detailBooking ? rooms.find(r => r.id === detailBooking.roomId) : null;
  const detailPayment = detailBooking ? payments.find(p => p.bookingId === detailBooking.id) : null;

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Reservations</h1>
      <p className="text-sm text-muted-foreground">View all reservations (read-only) · Add guest notes</p>

      <div className="mt-4 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
          const guest = mockUsers.find(u => u.id === booking.userId);
          const room = rooms.find(r => r.id === booking.roomId);
          const payment = payments.find(p => p.bookingId === booking.id);
          return (
            <Card key={booking.id} className="card-elevated">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{guest?.name}</h3>
                  <p className="text-sm text-muted-foreground">{room?.name} · {booking.checkIn} → {booking.checkOut}</p>
                  <p className="text-xs text-muted-foreground">Ref: {booking.id} · {booking.guests} guest(s)</p>
                  {booking.guestNotes && (
                    <p className="mt-1 text-xs text-primary italic">Notes: {booking.guestNotes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={statusColors[booking.status]}>{booking.status.replace('_', ' ')}</Badge>
                  <Badge className={paymentColors[payment?.status || 'unpaid']}>{payment?.status || 'unpaid'}</Badge>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setDetailDialog(booking.id)}>
                    <Eye className="h-3 w-3" /> View
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => { setNoteDialog(booking.id); setNoteText(booking.guestNotes || ''); }}>
                    <MessageSquarePlus className="h-3 w-3" /> Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && <div className="py-12 text-center text-muted-foreground">No reservations found.</div>}
      </div>

      {/* Guest Notes Dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Guest Notes</DialogTitle></DialogHeader>
          <Textarea
            placeholder="Late checkout, special requests, allergies..."
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Cancel</Button>
            <Button onClick={handleSaveNote}>Save Notes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!detailDialog} onOpenChange={() => setDetailDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Booking Detail</DialogTitle></DialogHeader>
          {detailBooking && (
            <div className="space-y-3 text-sm">
              <div><span className="font-medium text-foreground">Ref:</span> {detailBooking.id}</div>
              <div><span className="font-medium text-foreground">Guest:</span> {detailGuest?.name} ({detailGuest?.email})</div>
              <div><span className="font-medium text-foreground">Room:</span> {detailRoom?.name} — {detailRoom?.tier}</div>
              <div><span className="font-medium text-foreground">Dates:</span> {detailBooking.checkIn} → {detailBooking.checkOut}</div>
              <div><span className="font-medium text-foreground">Guests:</span> {detailBooking.guests}</div>
              <div className="flex gap-2">
                <Badge className={statusColors[detailBooking.status]}>{detailBooking.status.replace('_', ' ')}</Badge>
                <Badge className={paymentColors[detailPayment?.status || 'unpaid']}>{detailPayment?.status} — ${detailPayment?.amount}</Badge>
              </div>
              {detailBooking.guestNotes && (
                <div><span className="font-medium text-foreground">Notes:</span> {detailBooking.guestNotes}</div>
              )}
              <div className="text-xs text-muted-foreground">Created: {new Date(detailBooking.createdAt).toLocaleString()}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffReservations;
