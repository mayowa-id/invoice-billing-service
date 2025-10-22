import { z } from 'zod';

// Auth Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// Invoice Schemas
export const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be positive'),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client ID required'),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  dueDate: z.string().optional().or(z.date().optional()),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

// Client Schemas
export const createClientSchema = z.object({
  name: z.string().min(1, 'Client name required'),
  email: z.string().email('Invalid email'),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  contact: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// Payment Schemas
export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  paymentMethod: z.enum(['stripe', 'bank_transfer', 'cash']),
});

// Validation middleware
export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.validated = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}