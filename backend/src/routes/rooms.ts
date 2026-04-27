import { Router } from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/room.controller';
import { authenticate, requireAdmin, requireAdminOrStaff } from '../middleware/auth';

const router = Router();

// Public routes - no auth required for viewing
router.get('/', getRooms);
router.get('/:id', getRoomById);

// Protected routes require authentication
router.use(authenticate);

// Only Admin can create/delete rooms
router.post('/', requireAdmin, createRoom);
router.delete('/:id', requireAdmin, deleteRoom);

// Admin and Staff can update rooms (housekeeping status, etc.)
router.put('/:id', requireAdminOrStaff, updateRoom);

export default router;
