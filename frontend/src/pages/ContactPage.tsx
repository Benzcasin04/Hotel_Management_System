import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ContactPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Message Sent!', description: 'We will get back to you within 24 hours.' });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="animate-fade-in">
      <section className="hero-gradient py-20 text-center">
        <h1 className="font-heading text-4xl font-bold text-primary-foreground md:text-5xl">Contact Us</h1>
        <p className="mt-2 text-primary-foreground/80">We'd love to hear from you</p>
      </section>

      <section className="py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="font-heading text-2xl font-bold text-foreground">Get in Touch</h2>
              <p className="mt-3 text-muted-foreground">Have a question or need help with your reservation? We're here to assist.</p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: MapPin, label: 'Address', value: '123 Luxury Ave, Makati City, Manila, Philippines' },
                  { icon: Phone, label: 'Phone', value: '+63 2 8888 0000' },
                  { icon: Mail, label: 'Email', value: 'info@luxestay.com' },
                  { icon: Clock, label: 'Hours', value: 'Front Desk: 24/7' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="rounded-md bg-accent p-2">
                      <item.icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.label}</div>
                      <div className="text-sm text-muted-foreground">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Send a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" rows={4} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
                  </div>
                  <Button type="submit" className="w-full">Send Message</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
