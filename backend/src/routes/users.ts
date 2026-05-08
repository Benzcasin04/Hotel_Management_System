import { Router } from 'express';
import {
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller';
import { authenticate, requireAdmin, requireAdminOrStaff } from '../middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Current user profile
router.get('/me', getCurrentUser);

// Admin and Staff can view all users
router.get('/', requireAdminOrStaff, getAllUsers);

// Only Admin can create/delete users
router.post('/', requireAdmin, createUser);
router.delete('/:id', requireAdmin, deleteUser);

// Admin and Staff can update users
router.put('/:id', requireAdminOrStaff, updateUser);

export default router;
