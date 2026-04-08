import { Router } from 'express';
import {
  getAllPayments,
  getUserPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  processRefund
} from '../controllers/payment.controller';

const router = Router();

// Public routes (with auth middleware)
router.get('/my', getUserPayments);
router.get('/:id', getPaymentById);
router.post('/', createPayment);
router.put('/:id', updatePayment);

// Admin only routes
router.get('/', getAllPayments);
router.post('/:id/refund', processRefund);

export default router;
