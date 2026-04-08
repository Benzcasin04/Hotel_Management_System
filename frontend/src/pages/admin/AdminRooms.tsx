import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { RoomTier, Room } from '@/types/hotel';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import roomStandard from '@/assets/room-standard.jpg';
import roomLuxury from '@/assets/room-luxury.jpg';
import roomSuite from '@/assets/room-suite.jpg';
import roomPresidential from '@/assets/room-presidential.jpg';

const defaultImages: Record<RoomTier, string> = {
  Basic: roomStandard,
  Standard: roomStandard,
  Deluxe: roomLuxury,
  Suite: roomSuite,
  Presidential: roomPresidential,
};

const AdminRooms = () => {
  const { rooms, addRoom, updateRoom, deleteRoom, toggleRoomActive } = useHotel();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const emptyForm = { name: '', tier: 'Basic' as RoomTier, floor: 1, capacity: 2, pricePerNight: 89, description: '', amenities: 'Wi-Fi, Air Conditioning, TV', isActive: true };
  const [form, setForm] = useState(emptyForm);

  const filtered = rooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.tier.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => {
    setEditingRoom(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({
      name: room.name,
      tier: room.tier,
      floor: room.floor,
      capacity: room.capacity,
      pricePerNight: room.pricePerNight,
      description: room.description,
      amenities: room.amenities.join(', '),
      isActive: room.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const amenities = form.amenities.split(',').map(a => a.trim()).filter(Boolean);
    if (editingRoom) {
      updateRoom(editingRoom.id, { ...form, amenities });
      toast({ title: 'Room updated!' });
    } else {
      addRoom({ ...form, amenities, images: [defaultImages[form.tier]] });
      toast({ title: 'Room created!' });
    }
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteRoom(id);
    toast({ title: 'Room deleted' });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Room Management</h1>
          <p className="text-sm text-muted-foreground">{rooms.length} rooms total</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Room</Button>
      </div>

      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 max-w-sm" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(room => (
          <Card key={room.id} className="card-elevated overflow-hidden">
            <img src={room.images[0]} alt={room.name} className="h-40 w-full object-cover" />
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-foreground">{room.name}</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline">{room.tier}</Badge>
                    <Badge className={room.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}>
                      {room.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <span className="text-lg font-bold text-primary">${room.pricePerNight}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{room.description}</p>
              <div className="mt-3 text-xs text-muted-foreground">Floor {room.floor} · {room.capacity} guests</div>
              <div className="mt-3 flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(room)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="outline" size="sm" onClick={() => toggleRoomActive(room.id)}>
                  {room.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(room.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingRoom ? 'Edit Room' : 'Create Room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Room Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tier</Label>
                <Select value={form.tier} onValueChange={v => setForm(f => ({ ...f, tier: v as RoomTier }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['Basic', 'Standard', 'Deluxe', 'Suite', 'Presidential'] as RoomTier[]).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Floor</Label>
                <Input type="number" min={1} value={form.floor} onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Capacity</Label>
                <Input type="number" min={1} value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Price/Night ($)</Label>
                <Input type="number" min={1} value={form.pricePerNight} onChange={e => setForm(f => ({ ...f, pricePerNight: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Amenities (comma-separated)</Label>
              <Input value={form.amenities} onChange={e => setForm(f => ({ ...f, amenities: e.target.value }))} placeholder="Wi-Fi, TV, Mini Bar..." />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
              <Label>Active</Label>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingRoom ? 'Update Room' : 'Create Room'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRooms;
