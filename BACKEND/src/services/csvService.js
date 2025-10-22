import Invoice from '../models/Invoice.js';
import logger from '../lib/logger.js';

export async function exportInvoicesToCSV(orgId, filters = {}) {
  try {
    const query = { orgId };
    if (filters.status) query.status = filters.status;
    if (filters.clientId) query.clientId = filters.clientId;

    const invoices = await Invoice.find(query)
      .populate('clientId', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    // CSV Header
    const headers = [
      'Invoice Number',
      'Client Name',
      'Client Email',
      'Status',
      'Subtotal',
      'Tax Rate',
      'Tax Amount',
      'Total',
      'Currency',
      'Due Date',
      'Sent At',
      'Paid At',
      'Created By',
      'Created At',
    ];

    // CSV Rows
    const rows = invoices.map(inv => [
      inv.invoiceNumber,
      inv.clientId?.name || '',
      inv.clientId?.email || '',
      inv.status,
      inv.subtotal,
      inv.taxRate,
      inv.taxAmount,
      inv.total,
      inv.currency,
      inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
      inv.sentAt ? new Date(inv.sentAt).toISOString() : '',
      inv.paidAt ? new Date(inv.paidAt).toISOString() : '',
      inv.createdBy?.name || '',
      new Date(inv.createdAt).toISOString(),
    ]);

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape commas and quotes
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ),
    ].join('\n');

    logger.info(`CSV export completed: ${invoices.length} invoices`);
    return csvContent;
  } catch (error) {
    logger.error(`CSV export error: ${error.message}`);
    throw error;
  }
}