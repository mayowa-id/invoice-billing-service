import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Client name is required'],
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      lowercase: true,
    },
    address: String,
    city: String,
    country: String,
    postalCode: String,
    taxId: String,
    contact: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

clientSchema.index({ orgId: 1, email: 1 });
clientSchema.index({ orgId: 1 });

export default mongoose.model('Client', clientSchema);

