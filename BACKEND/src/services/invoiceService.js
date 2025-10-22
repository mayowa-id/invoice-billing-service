import Invoice from '../models/Invoice.js';
import Organization from '../models/Organization.js';
import Client from '../models/Client.js';
import logger from '../lib/logger.js';
import { INVOICE_STATUS } from '../lib/constants.js';

// Generate next invoice number
export async function generateInvoiceNumber(orgId) {
  try {
    const org = await Organization.findById(orgId);
    if (!org) {
      const error = new Error('Organization not found');
      error.statusCode = 404;
      throw error;
    }

    const prefix = org.settings.invoicePrefix || 'INV';
    const nextNumber = org.settings.invoiceNumberStart || 1000;

    // Update invoice number for next time
    org.settings.invoiceNumberStart = nextNumber + 1;
    await org.save();

    return `${prefix}-${nextNumber}`;
  } catch (error) {
    logger.error(`Invoice number generation error: ${error.message}`);
    throw error;
  }
}

// Calculate totals
function calculateTotals(items, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  return { subtotal, taxAmount, total };
}

// Create invoice
export async function createInvoice(orgId, userId, data) {
  try {
    // Validate client exists
    const client = await Client.findOne({ _id: data.clientId, orgId });
    if (!client) {
      const error = new Error('Client not found');
      error.statusCode = 404;
      throw error;
    }

    // Calculate item amounts and totals
    const items = data.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    const { subtotal, taxAmount, total } = calculateTotals(items, data.taxRate || 0);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(orgId);

    // Create invoice
    const invoice = new Invoice({
      orgId,
      clientId: data.clientId,
      invoiceNumber,
      items,
      subtotal,
      taxRate: data.taxRate || 0,
      taxAmount,
      total,
      currency: data.currency || 'USD',
      dueDate: data.dueDate,
      notes: data.notes,
      createdBy: userId,
    });

    await invoice.save();
    await invoice.populate('clientId', 'name email');

    logger.info(`Invoice created: ${invoice._id}`);
    return invoice;
  } catch (error) {
    logger.error(`Create invoice error: ${error.message}`);
    throw error;
  }
}

// Get invoices (with filters, pagination, sorting)
export async function getInvoices(orgId, filters = {}) {
  try {
    const { status, clientId, page = 1, limit = 10, sortBy = '-createdAt' } = filters;

    const query = { orgId };

    if (status) query.status = status;
    if (clientId) query.clientId = clientId;

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('clientId', 'name email')
        .populate('createdBy', 'name email')
        .sort(sortBy)
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    return {
      invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error(`Get invoices error: ${error.message}`);
    throw error;
  }
}

// Get single invoice
export async function getInvoiceById(orgId, invoiceId) {
  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, orgId })
      .populate('clientId')
      .populate('createdBy', 'name email');

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    return invoice;
  } catch (error) {
    logger.error(`Get invoice error: ${error.message}`);
    throw error;
  }
}

// Update invoice
export async function updateInvoice(orgId, invoiceId, data) {
  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, orgId });

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    // Can only edit draft invoices
    if (invoice.status !== INVOICE_STATUS.DRAFT) {
      const error = new Error('Can only update draft invoices');
      error.statusCode = 400;
      throw error;
    }

    // Update fields
    if (data.items) {
      invoice.items = data.items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
      }));

      const { subtotal, taxAmount, total } = calculateTotals(invoice.items, invoice.taxRate);
      invoice.subtotal = subtotal;
      invoice.taxAmount = taxAmount;
      invoice.total = total;
    }

    if (data.dueDate) invoice.dueDate = data.dueDate;
    if (data.notes) invoice.notes = data.notes;
    if (data.taxRate !== undefined) {
      invoice.taxRate = data.taxRate;
      const { taxAmount, total } = calculateTotals(invoice.items, data.taxRate);
      invoice.taxAmount = taxAmount;
      invoice.total = total;
    }

    await invoice.save();
    await invoice.populate('clientId', 'name email');

    logger.info(`Invoice updated: ${invoice._id}`);
    return invoice;
  } catch (error) {
    logger.error(`Update invoice error: ${error.message}`);
    throw error;
  }
}

// Send invoice
export async function sendInvoice(orgId, invoiceId) {
  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, orgId });

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status !== INVOICE_STATUS.DRAFT) {
      const error = new Error('Only draft invoices can be sent');
      error.statusCode = 400;
      throw error;
    }

    invoice.status = INVOICE_STATUS.SENT;
    invoice.sentAt = new Date();
    await invoice.save();

    logger.info(`Invoice sent: ${invoice._id}`);
    return invoice;
  } catch (error) {
    logger.error(`Send invoice error: ${error.message}`);
    throw error;
  }
}

// Mark as paid
export async function markInvoiceAsPaid(orgId, invoiceId) {
  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, orgId });

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    invoice.status = INVOICE_STATUS.PAID;
    invoice.paidAt = new Date();
    await invoice.save();

    logger.info(`Invoice marked as paid: ${invoice._id}`);
    return invoice;
  } catch (error) {
    logger.error(`Mark as paid error: ${error.message}`);
    throw error;
  }
}

// Delete invoice
export async function deleteInvoice(orgId, invoiceId) {
  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, orgId });

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    if (invoice.status !== INVOICE_STATUS.DRAFT) {
      const error = new Error('Can only delete draft invoices');
      error.statusCode = 400;
      throw error;
    }

    await Invoice.deleteOne({ _id: invoiceId });

    logger.info(`Invoice deleted: ${invoiceId}`);
    return { message: 'Invoice deleted successfully' };
  } catch (error) {
    logger.error(`Delete invoice error: ${error.message}`);
    throw error;
  }
}
