import { Router } from 'express';
import {
  getAllBookings,
  getUserBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking
} from '../controllers/booking.controller';

const router = Router();

// Public routes (with auth middleware)
router.get('/my', getUserBookings);
router.get('/:id', getBookingById);
router.post('/', createBooking);
router.put('/:id', updateBooking);
router.delete('/:id', cancelBooking);

// Admin only routes
router.get('/', getAllBookings);

export default router;
