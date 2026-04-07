import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useHotel } from '@/contexts/HotelContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, BedDouble } from 'lucide-react';
import { RoomTier } from '@/types/hotel';

const tierColors: Record<RoomTier, string> = {
  Basic: 'bg-muted text-muted-foreground',
  Standard: 'bg-accent text-accent-foreground',
  Deluxe: 'bg-primary/20 text-primary',
  Suite: 'bg-primary/30 text-primary',
  Presidential: 'bg-primary text-primary-foreground',
};

const RoomsPage = () => {
  const { rooms } = useHotel();
  const { isAuthenticated } = useAuth();
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [capacityFilter, setCapacityFilter] = useState<string>('all');

  const activeRooms = rooms.filter(r => r.isActive);
  const filtered = activeRooms.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.description.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || r.tier === tierFilter;
    const matchCap = capacityFilter === 'all' || r.capacity >= parseInt(capacityFilter);
    return matchSearch && matchTier && matchCap;
  });

  return (
    <div className="animate-fade-in">
      <section className="hero-gradient py-16 text-center">
        <h1 className="font-heading text-4xl font-bold text-primary-foreground md:text-5xl">Our Rooms</h1>
        <p className="mt-2 text-primary-foreground/80">Find the perfect room for your stay</p>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Room Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Deluxe">Deluxe</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Presidential">Presidential</SelectItem>
              </SelectContent>
            </Select>
            <Select value={capacityFilter} onValueChange={setCapacityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Guests" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Capacity</SelectItem>
                <SelectItem value="1">1+ Guests</SelectItem>
                <SelectItem value="2">2+ Guests</SelectItem>
                <SelectItem value="4">4+ Guests</SelectItem>
                <SelectItem value="6">6+ Guests</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(room => (
              <div key={room.id} className="card-elevated group overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative overflow-hidden">
                  <img src={room.images[0]} alt={room.name} className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" width={800} height={600} />
                  <Badge className={`absolute right-3 top-3 ${tierColors[room.tier]}`}>{room.tier}</Badge>
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-card-foreground">{room.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{room.description}</p>
                  <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {room.capacity} guests</span>
                    <span className="flex items-center gap-1"><BedDouble className="h-4 w-4" /> Floor {room.floor}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {room.amenities.slice(0, 3).map(a => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                    {room.amenities.length > 3 && <Badge variant="outline" className="text-xs">+{room.amenities.length - 3}</Badge>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary">${room.pricePerNight}</span>
                      <span className="text-sm text-muted-foreground">/night</span>
                    </div>
                    <Button asChild>
                      <Link to={isAuthenticated ? `/book/${room.id}` : '/login'}>{isAuthenticated ? 'Book Now' : 'Login to Book'}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="py-16 text-center text-muted-foreground">
              <BedDouble className="mx-auto h-12 w-12 opacity-40" />
              <p className="mt-4 text-lg">No rooms found matching your criteria</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default RoomsPage;
