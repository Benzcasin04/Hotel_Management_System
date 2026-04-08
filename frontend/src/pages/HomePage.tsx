import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Shield, Clock, Wifi } from 'lucide-react';
import heroImage from '@/assets/hero-hotel.jpg';
import roomLuxury from '@/assets/room-luxury.jpg';
import roomPresidential from '@/assets/room-presidential.jpg';
import roomSuite from '@/assets/room-suite.jpg';

const HomePage = () => {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[85vh] min-h-[600px] overflow-hidden">
        <img src={heroImage} alt="LuxeStay Hotel Lobby" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 hero-gradient opacity-75" />
        <div className="relative flex h-full items-center">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-primary/20 text-primary-foreground border-primary/30">★ Premium Hotel Experience</Badge>
              <h1 className="font-heading text-5xl font-bold leading-tight text-primary-foreground md:text-6xl lg:text-7xl">
                Luxury Awaits You
              </h1>
              <p className="mt-4 text-lg text-primary-foreground/80 md:text-xl">
                Experience world-class hospitality with breathtaking views, exquisite dining, and unparalleled comfort at LuxeStay.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" variant="hero" asChild>
                  <Link to="/rooms">Browse Rooms</Link>
                </Button>
                <Button size="lg" variant="hero-outline" asChild>
                  <Link to="/about">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Why Choose LuxeStay</h2>
            <p className="mt-3 text-muted-foreground">We redefine hospitality with every detail</p>
          </div>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: Star, title: '5-Star Service', desc: 'Award-winning hospitality and personalized service.' },
              { icon: Shield, title: 'Secure Booking', desc: 'Your reservations are confirmed instantly and securely.' },
              { icon: Clock, title: '24/7 Concierge', desc: 'Round-the-clock assistance for all your needs.' },
              { icon: Wifi, title: 'Modern Amenities', desc: 'High-speed Wi-Fi, smart rooms, and more.' },
            ].map((f, i) => (
              <div key={i} className="card-elevated rounded-lg border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Featured Rooms</h2>
            <p className="mt-3 text-muted-foreground">From cozy escapes to grand presidential suites</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { img: roomLuxury, title: 'Deluxe King', price: '$249', tier: 'Deluxe' },
              { img: roomSuite, title: 'Executive Suite', price: '$399', tier: 'Suite' },
              { img: roomPresidential, title: 'Presidential Suite', price: '$899', tier: 'Presidential' },
            ].map((room, i) => (
              <div key={i} className="card-elevated group overflow-hidden rounded-lg border border-border bg-card">
                <div className="relative overflow-hidden">
                  <img src={room.img} alt={room.title} className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" width={800} height={600} />
                  <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground">{room.tier}</Badge>
                </div>
                <div className="p-5">
                  <h3 className="font-heading text-lg font-semibold text-card-foreground">{room.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Starting from <span className="font-semibold text-primary">{room.price}</span>/night</p>
                  <Button className="mt-4 w-full" asChild>
                    <Link to="/rooms">View Details</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-primary-foreground md:text-4xl">Ready for an Unforgettable Stay?</h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">Book your perfect room today and experience the luxury that LuxeStay has to offer.</p>
          <Button size="lg" variant="hero" className="mt-8" asChild>
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
