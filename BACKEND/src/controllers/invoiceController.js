import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  sendInvoice,
  markInvoiceAsPaid,
  deleteInvoice,
} from '../services/invoiceService.js';
import { exportInvoicesToCSV } from '../services/csvService.js';
import { generateInvoicePDF } from '../services/pdfService.js';
import { sendInvoiceEmail } from '../services/emailService.js';
import logger from '../lib/logger.js';

export async function create(req, res, next) {
  try {
    const invoice = await createInvoice(req.user.orgId, req.user.userId, req.validated);
    res.status(201).json({
      message: 'Invoice created successfully',
      invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      clientId: req.query.clientId,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || '-createdAt',
    };

    const result = await getInvoices(req.user.orgId, filters);
    res.status(200).json({
      message: 'Invoices retrieved successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const invoice = await getInvoiceById(req.user.orgId, req.params.id);
    res.status(200).json({
      message: 'Invoice retrieved successfully',
      invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    const invoice = await updateInvoice(req.user.orgId, req.params.id, req.validated);
    res.status(200).json({
      message: 'Invoice updated successfully',
      invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function send(req, res, next) {
  try {
    const invoice = await sendInvoice(req.user.orgId, req.params.id);
    res.status(200).json({
      message: 'Invoice sent successfully',
      invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function markPaid(req, res, next) {
  try {
    const invoice = await markInvoiceAsPaid(req.user.orgId, req.params.id);
    res.status(200).json({
      message: 'Invoice marked as paid',
      invoice,
    });
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    const result = await deleteInvoice(req.user.orgId, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      clientId: req.query.clientId,
    };

    const csv = await exportInvoicesToCSV(req.user.orgId, filters);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="invoices-${Date.now()}.csv"`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
}