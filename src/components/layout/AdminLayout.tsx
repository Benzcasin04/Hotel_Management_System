import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  Hotel, LayoutDashboard, BedDouble, CalendarCheck, CreditCard,
  Users, Settings, LogOut, ChevronLeft, Menu,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user || user.role !== 'admin') return <Navigate to="/login" />;

  const links = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/rooms', label: 'Rooms', icon: BedDouble },
    { to: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
    { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} bg-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between px-4">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <Hotel className="h-6 w-6 text-sidebar-primary" />
              <span className="font-heading text-lg font-bold text-sidebar-foreground">LuxeStay</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-2 py-4">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              <link.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            onClick={logout}
            className={`w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground ${collapsed ? 'px-2' : 'justify-start gap-3'}`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && 'Logout'}
          </Button>
        </div>
      </aside>

      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 flex h-16 items-center border-b border-border bg-card/95 px-6 backdrop-blur">
          <h2 className="font-heading text-lg font-semibold text-foreground">Admin Panel</h2>
          <div className="ml-auto text-sm text-muted-foreground">{user.name}</div>
        </header>
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
