import { Link } from 'react-router-dom';
import { Hotel, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <Hotel className="h-6 w-6 text-primary" />
              <span className="font-heading text-lg font-bold">LuxeStay</span>
            </div>
            <p className="text-sm text-secondary-foreground/70">
              Experience luxury redefined. Premium accommodations for the discerning traveler.
            </p>
          </div>

          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/rooms" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Rooms</Link>
              <Link to="/about" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">About Us</Link>
              <Link to="/contact" className="text-sm text-secondary-foreground/70 hover:text-primary transition-colors">Contact</Link>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-secondary-foreground/70">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> 123 Luxury Ave, Manila</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> +63 2 8888 0000</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@luxestay.com</div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 font-heading text-sm font-semibold uppercase tracking-wider">Hours</h4>
            <div className="text-sm text-secondary-foreground/70">
              <p>Front Desk: 24/7</p>
              <p>Check-in: 2:00 PM</p>
              <p>Check-out: 12:00 PM</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-secondary-foreground/10 pt-6 text-center text-xs text-secondary-foreground/50">
          &copy; {new Date().getFullYear()} LuxeStay Hotel. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
