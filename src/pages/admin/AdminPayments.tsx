import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/data/mockData';
import { Payment, PaymentStatus } from '@/types/hotel';
import { DollarSign, Pencil } from 'lucide-react';

const paymentColors: Record<string, string> = {
  unpaid: 'bg-destructive/20 text-destructive',
  paid: 'bg-success/20 text-success',
  refunded: 'bg-muted text-muted-foreground',
};

const AdminPayments = () => {
  const { payments, bookings, rooms, updatePaymentStatus, adjustPaymentAmount } = useHotel();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [adjustAmount, setAdjustAmount] = useState(0);
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustStatus, setAdjustStatus] = useState<PaymentStatus>('paid');

  const openAdjust = (payment: Payment) => {
    setSelectedPayment(payment);
    setAdjustAmount(payment.amount);
    setAdjustNote('');
    setAdjustStatus(payment.status);
    setDialogOpen(true);
  };

  const handleAdjust = () => {
    if (!selectedPayment) return;
    adjustPaymentAmount(selectedPayment.bookingId, adjustAmount, adjustNote, 'admin');
    updatePaymentStatus(selectedPayment.bookingId, adjustStatus, adjustNote, 'admin');
    toast({ title: 'Payment adjusted!' });
    setDialogOpen(false);
  };

  const handleQuickStatus = (bookingId: string, status: PaymentStatus) => {
    updatePaymentStatus(bookingId, status, undefined, 'admin');
    toast({ title: `Payment marked as ${status}` });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Payment Management</h1>
      <p className="text-sm text-muted-foreground">{payments.length} transactions</p>

      <div className="mt-6 space-y-4">
        {payments.map(payment => {
          const booking = bookings.find(b => b.id === payment.bookingId);
          const user = mockUsers.find(u => u.id === booking?.userId);
          const room = rooms.find(r => r.id === booking?.roomId);
          return (
            <Card key={payment.id} className="card-elevated">
              <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-md bg-accent p-2">
                    <DollarSign className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{user?.name} — {room?.name}</h3>
                    <p className="text-sm text-muted-foreground">Booking: {payment.bookingId} · {payment.method}</p>
                    {payment.note && <p className="text-xs text-muted-foreground/70">Note: {payment.note}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge className={paymentColors[payment.status]}>{payment.status}</Badge>
                  <span className="text-xl font-bold text-foreground">${payment.amount}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(payment.bookingId, 'paid')} className="text-xs">Mark Paid</Button>
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(payment.bookingId, 'unpaid')} className="text-xs">Mark Unpaid</Button>
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(payment.bookingId, 'refunded')} className="text-xs">Refund</Button>
                    <Button size="sm" variant="outline" onClick={() => openAdjust(payment)}><Pencil className="h-3 w-3" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Adjust Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input type="number" value={adjustAmount} onChange={e => setAdjustAmount(parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={adjustStatus} onValueChange={v => setAdjustStatus(v as PaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note (discount, surcharge, etc.)</Label>
              <Textarea value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="Reason for adjustment..." />
            </div>
            <Button onClick={handleAdjust} className="w-full">Save Adjustment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPayments;
