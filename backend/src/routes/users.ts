import { Router } from 'express';
import {
  getCurrentUser,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/user.controller';

const router = Router();

// Public routes (with auth middleware)
router.get('/me', getCurrentUser);

// Admin only routes
router.get('/', getAllUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
