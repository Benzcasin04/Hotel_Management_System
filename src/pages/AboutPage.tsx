import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import heroImage from '@/assets/hero-hotel.jpg';
import { Award, Users, Globe, Heart } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="animate-fade-in">
      <section className="relative h-64 overflow-hidden md:h-80">
        <img src={heroImage} alt="About LuxeStay" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 hero-gradient opacity-80" />
        <div className="relative flex h-full items-center justify-center text-center">
          <div>
            <h1 className="font-heading text-4xl font-bold text-primary-foreground md:text-5xl">About LuxeStay</h1>
            <p className="mt-2 text-primary-foreground/80">Our story, our mission, our promise</p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Our Story</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Founded in 2020, LuxeStay was born from a passion for exceptional hospitality. What started as a boutique hotel has grown into a premier destination for travelers seeking comfort, elegance, and memorable experiences.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Every detail at LuxeStay is crafted with care — from our hand-selected linens to our curated dining experiences. We believe luxury should be accessible, personal, and unforgettable.
              </p>
            </div>
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Our Mission</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                To provide an unparalleled hospitality experience that combines modern comfort with timeless elegance. We strive to make every guest feel at home while experiencing the finest amenities and services.
              </p>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Our commitment to sustainability and community engagement drives everything we do, from eco-friendly practices to local partnerships.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            {[
              { icon: Award, value: '5+', label: 'Years of Excellence' },
              { icon: Users, value: '50,000+', label: 'Happy Guests' },
              { icon: Globe, value: '30+', label: 'Countries Served' },
              { icon: Heart, value: '98%', label: 'Satisfaction Rate' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <stat.icon className="mx-auto h-8 w-8 text-primary" />
                <div className="mt-2 font-heading text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 text-center">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl font-bold text-foreground">Ready to Experience LuxeStay?</h2>
          <p className="mt-3 text-muted-foreground">Book your stay today and discover what makes us special.</p>
          <Button size="lg" className="mt-6" asChild>
            <Link to="/rooms">Explore Rooms</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
