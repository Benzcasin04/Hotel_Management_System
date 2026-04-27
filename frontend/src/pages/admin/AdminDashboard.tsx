import { useHotel } from '@/contexts/HotelContext';

import { Card, CardContent } from '@/components/ui/card';

import { BedDouble, CalendarCheck, DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

import {

  ChartContainer,

  ChartTooltip,

  ChartTooltipContent,

  type ChartConfig,

} from '@/components/ui/chart';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';



const AdminDashboard = () => {

  const { rooms, bookings, payments, users } = useHotel();



  const stats = [

    { icon: BedDouble, label: 'Total Rooms', value: rooms.length, sub: `${rooms.filter(r => r.isActive).length} active` },

    { icon: CalendarCheck, label: 'Total Bookings', value: bookings.length, sub: `${bookings.filter(b => b.status === 'pending').length} pending` },

    { icon: DollarSign, label: 'Revenue', value: `$${payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0).toLocaleString()}`, sub: 'from paid bookings' },

    { icon: Users, label: 'Users', value: users.length, sub: `${users.filter(u => u.role?.toLowerCase() === 'admin').length} admin, ${users.filter(u => u.role?.toLowerCase() === 'staff').length} staff` },

    { icon: TrendingUp, label: 'Occupancy', value: `${Math.round((bookings.filter(b => b.status === 'checked_in').length / Math.max(rooms.filter(r => r.isActive).length, 1)) * 100)}%`, sub: 'current occupancy' },

    { icon: AlertCircle, label: 'Unpaid', value: payments.filter(p => p.status === 'pending').length, sub: 'awaiting payment' },

  ];



  // Revenue by room tier

  const tierRevenue = rooms.reduce((acc, room) => {

    const roomBookings = bookings.filter(b => b.roomId === room.id);

    const revenue = roomBookings.reduce((s, b) => s + b.totalAmount, 0);

    const existing = acc.find(a => a.tier === room.tier);

    if (existing) { existing.revenue += revenue; existing.bookings += roomBookings.length; }

    else acc.push({ tier: room.tier, revenue, bookings: roomBookings.length });

    return acc;

  }, [] as { tier: string; revenue: number; bookings: number }[]);



  // Dynamic monthly data calculated from actual bookings and payments
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize data for all months with zero values
    const data = months.map(month => ({ month, revenue: 0, bookings: 0 }));
    
    // Calculate revenue and bookings per month from actual data
    bookings.forEach(booking => {
      const bookingDate = new Date(booking.createdAt);
      const monthIndex = bookingDate.getMonth();
      
      // Count bookings per month
      data[monthIndex].bookings += 1;
      
      // Find payment for this booking and add to revenue if completed
      const bookingPayment = payments.find(p => p.bookingId === booking.id && p.status === 'completed');
      if (bookingPayment) {
        data[monthIndex].revenue += bookingPayment.amount;
      }
    });
    
    return data;
  }, [bookings, payments]);



  // Booking status breakdown

  const statusData = [

    { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, fill: 'hsl(var(--primary))' },

    { name: 'Checked In', value: bookings.filter(b => b.status === 'checked_in').length, fill: 'hsl(var(--success))' },

    { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length, fill: 'hsl(var(--warning))' },

    { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, fill: 'hsl(var(--destructive))' },

  ].filter(d => d.value > 0);



  // Payment status breakdown

  const paymentStatusData = [

    { name: 'Paid', value: payments.filter(p => p.status === 'completed').length, fill: 'hsl(var(--success))' },

    { name: 'Pending', value: payments.filter(p => p.status === 'pending').length, fill: 'hsl(var(--destructive))' },

    { name: 'Refunded', value: payments.filter(p => p.status === 'refunded').length, fill: 'hsl(var(--muted-foreground))' },

  ].filter(d => d.value > 0);



  const revenueConfig: ChartConfig = {

    revenue: { label: 'Revenue ($)', color: 'hsl(var(--primary))' },

  };

  const tierConfig: ChartConfig = {

    revenue: { label: 'Revenue ($)', color: 'hsl(var(--primary))' },

    bookings: { label: 'Bookings', color: 'hsl(var(--accent-foreground))' },

  };

  const bookingLineConfig: ChartConfig = {

    bookings: { label: 'Bookings', color: 'hsl(var(--primary))' },

  };



  return (

    <div className="animate-fade-in">

      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h1>

      <p className="text-muted-foreground">Welcome to the admin panel</p>



      {/* Stats Cards */}

      <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">

        {stats.map((s, i) => (

          <Card key={i} className="card-elevated">

            <CardContent className="p-4">

              <s.icon className="h-5 w-5 text-primary" />

              <div className="mt-2 text-2xl font-bold text-foreground">{s.value}</div>

              <div className="text-xs font-medium text-muted-foreground">{s.label}</div>

              <div className="text-xs text-muted-foreground/70">{s.sub}</div>

            </CardContent>

          </Card>

        ))}

      </div>



      {/* Charts Row 1 */}

      <div className="mt-8 grid gap-6 md:grid-cols-2">

        <Card>

          <CardContent className="p-5">

            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Monthly Revenue</h3>

            <ChartContainer config={revenueConfig} className="h-[250px] w-full">

              <BarChart data={monthlyData}>

                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

                <XAxis dataKey="month" className="text-xs" />

                <YAxis className="text-xs" />

                <ChartTooltip content={<ChartTooltipContent />} />

                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />

              </BarChart>

            </ChartContainer>

          </CardContent>

        </Card>



        <Card>

          <CardContent className="p-5">

            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Booking Trend</h3>

            <ChartContainer config={bookingLineConfig} className="h-[250px] w-full">

              <LineChart data={monthlyData}>

                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

                <XAxis dataKey="month" className="text-xs" />

                <YAxis className="text-xs" />

                <ChartTooltip content={<ChartTooltipContent />} />

                <Line type="monotone" dataKey="bookings" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />

              </LineChart>

            </ChartContainer>

          </CardContent>

        </Card>

      </div>



      {/* Charts Row 2 */}

      <div className="mt-6 grid gap-6 md:grid-cols-3">

        <Card>

          <CardContent className="p-5">

            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Revenue by Room Tier</h3>

            <ChartContainer config={tierConfig} className="h-[250px] w-full">

              <BarChart data={tierRevenue}>

                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />

                <XAxis dataKey="tier" className="text-xs" />

                <YAxis className="text-xs" />

                <ChartTooltip content={<ChartTooltipContent />} />

                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />

              </BarChart>

            </ChartContainer>

          </CardContent>

        </Card>



        <Card>

          <CardContent className="p-5">

            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Booking Status</h3>

            <ChartContainer config={{ status: { label: 'Status' } }} className="h-[250px] w-full">

              <PieChart>

                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />

                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>

                  {statusData.map((entry, i) => (

                    <Cell key={i} fill={entry.fill} />

                  ))}

                </Pie>

              </PieChart>

            </ChartContainer>

          </CardContent>

        </Card>



        <Card>

          <CardContent className="p-5">

            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Payment Status</h3>

            <ChartContainer config={{ payment: { label: 'Payments' } }} className="h-[250px] w-full">

              <PieChart>

                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />

                <Pie data={paymentStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>

                  {paymentStatusData.map((entry, i) => (

                    <Cell key={i} fill={entry.fill} />

                  ))}

                </Pie>

              </PieChart>

            </ChartContainer>

          </CardContent>

        </Card>

      </div>



      {/* Recent Bookings & Room Status */}

      <div className="mt-6 grid gap-6 md:grid-cols-2">

        <Card>

          <CardContent className="p-5">
            <h3 className="font-heading text-lg font-semibold text-foreground">Recent Bookings</h3>
            <div className="mt-4 space-y-3">
              {bookings.slice(0, 5).map(b => {
                const u = users.find(u => u.id === b.userId);
                const r = rooms.find(r => r.id === b.roomId);
                return (
                  <div key={b.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                    <div>
                      <div className="font-medium text-foreground">{u?.name} — {r?.name}</div>
                      <div className="text-xs text-muted-foreground">{b.checkIn} → {b.checkOut}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${b.status === 'confirmed' ? 'bg-primary/20 text-primary' : b.status === 'pending' ? 'bg-warning/20 text-warning' : 'bg-muted text-muted-foreground'}`}>
                      {b.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>

        </Card>



        <Card>

          <CardContent className="p-5">

            <h3 className="font-heading text-lg font-semibold text-foreground">Room Status</h3>

            <div className="mt-4 space-y-3">

              {rooms.slice(0, 5).map(r => (

                <div key={r.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">

                  <div>

                    <div className="font-medium text-foreground">{r.name}</div>

                    <div className="text-xs text-muted-foreground">{r.tier} · Floor {r.floor}</div>

                  </div>

                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${r.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>

                    {r.isActive ? 'Active' : 'Inactive'}

                  </span>

                </div>

              ))}

            </div>

          </CardContent>

        </Card>

      </div>

    </div>

  );

};



export default AdminDashboard;

