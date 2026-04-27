import { Router } from 'express';
import { createUserAsAdmin, resetUserPassword, toggleUserStatus } from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// POST /api/admin/users - Create new user (Admin, Staff, or Client)
router.post('/users', createUserAsAdmin);

// POST /api/admin/users/reset-password - Reset user password
router.post('/users/reset-password', resetUserPassword);

// PATCH /api/admin/users/:id/status - Suspend/Activate user
router.patch('/users/:id/status', toggleUserStatus);

export default router;
