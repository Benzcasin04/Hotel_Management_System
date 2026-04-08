import { Router } from 'express';
import roomRoutes from './rooms';
import userRoutes from './users';
import bookingRoutes from './bookings';
import paymentRoutes from './payments';

const router = Router();

// API routes
router.use('/rooms', roomRoutes);
router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

export default router;
