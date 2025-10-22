import mongoose from 'mongoose';
import { ROLES } from '../lib/constants.js';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    hashedPassword: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Don't return password by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.VIEWER,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
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

// Index for queries
userSchema.index({ orgId: 1, email: 1 });
userSchema.index({ email: 1 });

export default mongoose.model('User', userSchema);