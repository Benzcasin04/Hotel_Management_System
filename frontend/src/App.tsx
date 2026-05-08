import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from '@/contexts/AuthContext';
import { HotelProvider } from '@/contexts/HotelContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { SupabaseStatus } from "@/components/SupabaseStatus";
import '@/styles/responsive.css';

import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import StaffLayout from "@/components/layout/StaffLayout";
import HomePage from "@/pages/HomePage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import RoomsPage from "@/pages/RoomsPage";
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import BookingPage from "@/pages/BookingPage";
import UserDashboard from "@/pages/UserDashboard";
import SettingsPage from "@/pages/SettingsPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminRooms from "@/pages/admin/AdminRooms";
import AdminBookings from "@/pages/admin/AdminBookings";
import AdminPayments from "@/pages/admin/AdminPayments";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminMessages from "@/pages/admin/AdminMessages";
import StaffDashboard from "@/pages/staff/StaffDashboard";
import StaffFrontDesk from "@/pages/staff/StaffFrontDesk";
import StaffHousekeeping from "@/pages/staff/StaffHousekeeping";
import StaffReservations from "@/pages/staff/StaffReservations";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HotelProvider>
        <NotificationProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/book/:roomId" element={<BookingPage />} />
                <Route path="/dashboard" element={<UserDashboard />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/rooms" element={<AdminRooms />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/admin/payments" element={<AdminPayments />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/messages" element={<AdminMessages />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
              <Route element={<StaffLayout />}>
                <Route path="/staff" element={<StaffDashboard />} />
                <Route path="/staff/front-desk" element={<StaffFrontDesk />} />
                <Route path="/staff/housekeeping" element={<StaffHousekeeping />} />
                <Route path="/staff/reservations" element={<StaffReservations />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
          <SupabaseStatus />
        </NotificationProvider>
      </HotelProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
