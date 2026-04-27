import { useState } from 'react';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RoomCondition } from '@/types/hotel';
import { logAuditAction } from '@/pages/admin/AdminSettings';
import { Sparkles, AlertTriangle, Wrench } from 'lucide-react';

const conditionColors: Record<RoomCondition, string> = {
  clean: 'bg-success/20 text-success',
  dirty: 'bg-warning/20 text-warning',
  maintenance: 'bg-destructive/20 text-destructive',
};

const conditionIcons: Record<RoomCondition, React.ReactNode> = {
  clean: <Sparkles className="h-4 w-4" />,
  dirty: <AlertTriangle className="h-4 w-4" />,
  maintenance: <Wrench className="h-4 w-4" />,
};

const StaffHousekeeping = () => {
  const { rooms, updateRoomCondition } = useHotel();
  const { user } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>('all');

  const filtered = rooms.filter(r => {
    if (filter === 'all') return true;
    return r.condition === filter;
  });

  const handleConditionChange = (roomId: string, condition: RoomCondition) => {
    const room = rooms.find(r => r.id === roomId);
    updateRoomCondition(roomId, condition);
    
    // Log to audit trail
    logAuditAction(
      `Staff: Room ${condition.charAt(0).toUpperCase() + condition.slice(1)}`,
      room?.name || roomId,
      condition === 'clean' ? 'success' : condition === 'dirty' ? 'warning' : 'error',
      `Staff ${user?.name} marked room ${room?.name} as ${condition}`
    );
    
    toast({ title: `Room marked as ${condition}` });
  };

  const counts = {
    clean: rooms.filter(r => r.condition === 'clean').length,
    dirty: rooms.filter(r => r.condition === 'dirty').length,
    maintenance: rooms.filter(r => r.condition === 'maintenance').length,
  };

  return (
    <div className="animate-fade-in">
      <h1 className="font-heading text-2xl font-bold text-foreground">Housekeeping</h1>
      <p className="text-sm text-muted-foreground">Room status board — all rooms + condition</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="flex gap-2 text-sm">
          <Badge className={conditionColors.clean}>{counts.clean} Clean</Badge>
          <Badge className={conditionColors.dirty}>{counts.dirty} Dirty</Badge>
          <Badge className={conditionColors.maintenance}>{counts.maintenance} Maintenance</Badge>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rooms</SelectItem>
            <SelectItem value="clean">Clean</SelectItem>
            <SelectItem value="dirty">Dirty</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map(room => (
          <Card key={room.id} className="card-elevated">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{room.name}</h3>
                  <p className="text-xs text-muted-foreground">{room.tier} · Floor {room.floor} · Cap: {room.capacity}</p>
                </div>
                <Badge className={conditionColors[room.condition]}>
                  <span className="flex items-center gap-1">{conditionIcons[room.condition]} {room.condition}</span>
                </Badge>
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  variant={room.condition === 'clean' ? 'default' : 'outline'}
                  onClick={() => handleConditionChange(room.id, 'clean')}
                  disabled={room.condition === 'clean'}
                  className="gap-1 text-xs"
                >
                  <Sparkles className="h-3 w-3" /> Clean
                </Button>
                <Button
                  size="sm"
                  variant={room.condition === 'dirty' ? 'default' : 'outline'}
                  onClick={() => handleConditionChange(room.id, 'dirty')}
                  disabled={room.condition === 'dirty'}
                  className="gap-1 text-xs"
                >
                  <AlertTriangle className="h-3 w-3" /> Dirty
                </Button>
                <Button
                  size="sm"
                  variant={room.condition === 'maintenance' ? 'destructive' : 'outline'}
                  onClick={() => handleConditionChange(room.id, 'maintenance')}
                  disabled={room.condition === 'maintenance'}
                  className="gap-1 text-xs"
                >
                  <Wrench className="h-3 w-3" /> Maintenance
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StaffHousekeeping;
