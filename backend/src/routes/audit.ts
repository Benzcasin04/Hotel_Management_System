import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// Get audit logs - admin only
router.get('/', authenticate, requireAdmin, getAuditLogs);

export default router;
