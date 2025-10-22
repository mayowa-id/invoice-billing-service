import AuditLog from '../models/AuditLog.js';
import logger from '../lib/logger.js';

export async function createAuditLog({
  orgId,
  userId,
  action,
  targetType,
  targetId,
  changes = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
}) {
  try {
    const auditLog = new AuditLog({
      orgId,
      userId,
      action,
      targetType,
      targetId,
      changes,
      metadata,
      ipAddress,
      userAgent,
    });

    await auditLog.save();
    logger.info(`Audit log created: ${action} on ${targetType} ${targetId}`);
    return auditLog;
  } catch (error) {
    logger.error(`Audit log creation error: ${error.message}`);
    // Don't throw - audit failures shouldn't break the main operation
  }
}

export async function getAuditLogs(orgId, filters = {}) {
  try {
    const { targetType, targetId, userId, page = 1, limit = 50 } = filters;
    const query = { orgId };

    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;
    if (userId) query.userId = userId;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Get audit logs error: ${error.message}`);
    throw error;
  }
}

// Middleware to capture changes
export function auditMiddleware(action, targetType) {
  return async (req, res, next) => {
    // Store original response.json to capture the result
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Log after successful operation
      if (res.statusCode >= 200 && res.statusCode < 300) {
        createAuditLog({
          orgId: req.user?.orgId,
          userId: req.user?.userId,
          action,
          targetType,
          targetId: req.params.id || data?.invoice?._id || data?.client?._id,
          metadata: {
            endpoint: req.originalUrl,
            method: req.method,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
      }

      return originalJson(data);
    };

    next();
  };
}