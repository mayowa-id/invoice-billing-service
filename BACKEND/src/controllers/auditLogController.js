import { getAuditLogs } from '../services/auditService.js';

export async function listAuditLogs(req, res, next) {
  try {
    const filters = {
      targetType: req.query.targetType,
      targetId: req.query.targetId,
      userId: req.query.userId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
    };

    const result = await getAuditLogs(req.user.orgId, filters);
    res.status(200).json({
      message: 'Audit logs retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}