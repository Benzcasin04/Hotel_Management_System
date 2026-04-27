import { Router } from 'express';
import roomRoutes from './rooms';
import userRoutes from './users';
import bookingRoutes from './bookings';
import paymentRoutes from './payments';
import adminRoutes from './admin';
import auditRoutes from './audit';

const router = Router();

// API routes
router.use('/rooms', roomRoutes);
router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/audit', auditRoutes);

export default router;
