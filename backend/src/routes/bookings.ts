import { Router } from 'express';
import {
  getAllBookings,
  getUserBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
  deleteBooking
} from '../controllers/booking.controller';
import { authenticate, requireAdmin, requireAdminOrStaff } from '../middleware/auth';

const router = Router();

// All booking routes require authentication
router.use(authenticate);

// User routes
router.get('/my', getUserBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);

// Admin and Staff can view all bookings
router.get('/', requireAdminOrStaff, getAllBookings);

// Admin and Staff can update bookings (for check-in/out)
router.put('/:id', requireAdminOrStaff, updateBooking);

// Admin can cancel bookings
router.delete('/:id', requireAdmin, cancelBooking);

// Admin can hard delete bookings (completely remove from database)
router.delete('/:id/permanent', requireAdmin, deleteBooking);

export default router;
