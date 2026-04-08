import { Router } from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom
} from '../controllers/room.controller';

const router = Router();

// Public routes
router.get('/', getRooms);
router.get('/:id', getRoomById);

// Admin only routes
router.post('/', createRoom);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);

export default router;
