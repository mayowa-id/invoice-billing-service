import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../lib/constants.js';

const auditLogSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(AUDIT_ACTIONS),
      required: true,
    },
    targetType: {
      type: String,
      enum: ['invoice', 'client', 'payment', 'user', 'organization'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed, // Store old and new values
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Additional context
    },
    ipAddress: String,
    userAgent: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false }
);

// Indexes for efficient queries
auditLogSchema.index({ orgId: 1, createdAt: -1 });
auditLogSchema.index({ orgId: 1, targetType: 1, targetId: 1 });
auditLogSchema.index({ orgId: 1, userId: 1 });

export default mongoose.model('AuditLog', auditLogSchema);