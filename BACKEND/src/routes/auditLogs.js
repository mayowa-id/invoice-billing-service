import express from 'express';
import { listAuditLogs } from '../controllers/auditLogController.js';
import { authenticateToken } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { ROLES } from '../lib/constants.js';

const router = express.Router();

// Only owners and admins can view audit logs
router.get(
  '/',
  authenticateToken,
  authorize(ROLES.OWNER, ROLES.ADMIN),
  listAuditLogs
);

export default router;