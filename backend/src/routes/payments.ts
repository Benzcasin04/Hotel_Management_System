import { Router } from 'express';
import {
  getAllPayments,
  getUserPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  processRefund
} from '../controllers/payment.controller';
import { authenticate, requireAdmin, requireAdminOrStaff } from '../middleware/auth';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// User routes
router.get('/my', getUserPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);

// Admin and Staff can view all payments
router.get('/', requireAdminOrStaff, getAllPayments);

// Admin and Staff can update payments
router.put('/:id', requireAdminOrStaff, updatePayment);

// Only Admin can process refunds
router.post('/:id/refund', requireAdmin, processRefund);

export default router;
