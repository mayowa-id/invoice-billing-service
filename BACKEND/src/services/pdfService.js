import PDFDocument from 'pdfkit';
import Invoice from '../models/Invoice.js';
import Organization from '../models/Organization.js';
import logger from '../lib/logger.js';

export async function generateInvoicePDF(invoiceId) {
  try {
    const invoice = await Invoice.findById(invoiceId)
      .populate('clientId')
      .populate('orgId')
      .populate('createdBy', 'name email');

    if (!invoice) {
      const error = new Error('Invoice not found');
      error.statusCode = 404;
      throw error;
    }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        // Collect PDF chunks
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc
          .fontSize(20)
          .text(invoice.orgId.name, 50, 50)
          .fontSize(10)
          .text(invoice.orgId.billingInfo?.address || '', 50, 75)
          .text(invoice.orgId.billingInfo?.city || '', 50, 90)
          .text(invoice.orgId.billingInfo?.country || '', 50, 105);

        // Invoice title
        doc
          .fontSize(24)
          .text('INVOICE', 400, 50, { align: 'right' })
          .fontSize(10)
          .text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' })
          .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 95, { align: 'right' })
          .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`, 400, 110, { align: 'right' });

        // Bill To
        doc
          .fontSize(12)
          .text('BILL TO:', 50, 150)
          .fontSize(10)
          .text(invoice.clientId.name, 50, 170)
          .text(invoice.clientId.email, 50, 185)
          .text(invoice.clientId.address || '', 50, 200)
          .text(`${invoice.clientId.city || ''} ${invoice.clientId.postalCode || ''}`, 50, 215);

        // Line
        doc.moveTo(50, 250).lineTo(550, 250).stroke();

        // Table Header
        const tableTop = 270;
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Description', 50, tableTop)
          .text('Qty', 300, tableTop, { width: 50, align: 'right' })
          .text('Unit Price', 360, tableTop, { width: 80, align: 'right' })
          .text('Amount', 450, tableTop, { width: 100, align: 'right' });

        doc.font('Helvetica');

        // Table Items
        let y = tableTop + 25;
        invoice.items.forEach(item => {
          doc
            .text(item.description, 50, y, { width: 240 })
            .text(item.quantity, 300, y, { width: 50, align: 'right' })
            .text(`${invoice.currency} ${item.unitPrice.toFixed(2)}`, 360, y, { width: 80, align: 'right' })
            .text(`${invoice.currency} ${item.amount.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
          
          y += 25;
        });

        // Line before totals
        y += 10;
        doc.moveTo(50, y).lineTo(550, y).stroke();

        // Totals
        y += 15;
        doc
          .fontSize(10)
          .text('Subtotal:', 400, y)
          .text(`${invoice.currency} ${invoice.subtotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

        y += 20;
        doc
          .text(`Tax (${invoice.taxRate}%):`, 400, y)
          .text(`${invoice.currency} ${invoice.taxAmount.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

        y += 20;
        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('Total:', 400, y)
          .text(`${invoice.currency} ${invoice.total.toFixed(2)}`, 450, y, { width: 100, align: 'right' });

        // Notes
        if (invoice.notes) {
          y += 50;
          doc
            .font('Helvetica')
            .fontSize(10)
            .text('Notes:', 50, y)
            .text(invoice.notes, 50, y + 15, { width: 500 });
        }

        // Footer
        doc
          .fontSize(8)
          .text(
            `Generated on ${new Date().toLocaleString()}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
          );

        // Finalize PDF
        doc.end();

        logger.info(`PDF generated for invoice: ${invoiceId}`);
      } catch (err) {
        reject(err);
      }
    });
  } catch (error) {
    logger.error(`PDF generation error: ${error.message}`);
    throw error;
  }
}