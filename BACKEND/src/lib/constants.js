export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
};

export const INVOICE_STATUS = {
  DRAFT: 'draft',
  SENT: 'sent',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const AUDIT_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  SEND: 'send',
  MARK_PAID: 'mark_paid',
};

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: ['read', 'create', 'update', 'delete', 'manage_users', 'manage_settings'],
  [ROLES.ADMIN]: ['read', 'create', 'update', 'delete', 'manage_users'],
  [ROLES.ACCOUNTANT]: ['read', 'create', 'update', 'manage_payments'],
  [ROLES.VIEWER]: ['read'],
};
