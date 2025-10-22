import mongoose from 'mongoose';
import { INVOICE_STATUS } from '../lib/constants.js';

const invoiceItemSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const invoiceSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    items: [invoiceItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(INVOICE_STATUS),
      default: INVOICE_STATUS.DRAFT,
    },
    dueDate: Date,
    sentAt: Date,
    paidAt: Date,
    notes: String,
    pdfUrl: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
invoiceSchema.index({ orgId: 1, status: 1 });
invoiceSchema.index({ orgId: 1, clientId: 1 });
invoiceSchema.index({ orgId: 1, createdAt: -1 });
invoiceSchema.index({ invoiceNumber: 1 });

export default mongoose.model('Invoice', invoiceSchema);