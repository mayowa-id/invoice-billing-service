import { ROLE_PERMISSIONS } from '../lib/constants.js';

export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.userId} with role ${req.user.role}`);
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

export function checkPermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    if (!userPermissions.includes(permission)) {
      logger.warn(
        `Permission denied for user ${req.user.userId}: required ${permission}, has ${userPermissions.join(', ')}`
      );
      return res.status(403).json({ error: 'Permission denied' });
    }

    next();
  };
}