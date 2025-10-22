import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    billingInfo: {
      address: String,
      city: String,
      country: String,
      postalCode: String,
      taxId: String,
    },
    settings: {
      invoicePrefix: {
        type: String,
        default: 'INV',
      },
      invoiceNumberStart: {
        type: Number,
        default: 1000,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Organization', organizationSchema);