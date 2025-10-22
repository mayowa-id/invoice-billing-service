import nodemailer from 'nodemailer';
import logger from '../lib/logger.js';

// Create transporter
let transporter;

if (process.env.SENDGRID_API_KEY) {
  // SendGrid configuration
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY,
    },
  });
} else {
  // Fallback to ethereal for development (fake SMTP)
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'ethereal.user@ethereal.email',
      pass: 'ethereal.pass',
    },
  });
  logger.warn('Using Ethereal email (development mode). Set SENDGRID_API_KEY for production.');
}

export async function sendInvoiceEmail(invoice, pdfBuffer) {
  try {
    const client = invoice.clientId;
    const org = invoice.orgId;

    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@invoicing.com',
      to: client.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${org.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invoice from ${org.name}</h2>
          <p>Dear ${client.name},</p>
          <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Invoice Number:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${invoice.invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${invoice.currency} ${invoice.total.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Due Date:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
            </tr>
          </table>

          ${invoice.notes ? `<p><strong>Notes:</strong><br/>${invoice.notes}</p>` : ''}

          <p>Thank you for your business!</p>
          <p>Best regards,<br/>${org.name}</p>
        </div>
      `,
      attachments: [
        {
          filename: `invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    
    // Log preview URL for development
    if (info.previewURL) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error(`Email sending error: ${error.message}`);
    throw error;
  }
}

export async function sendWelcomeEmail(user, organization) {
  try {
    const mailOptions = {
      from: process.env.MAIL_FROM || 'noreply@invoicing.com',
      to: user.email,
      subject: 'Welcome to Invoice & Billing Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Invoice & Billing Platform!</h2>
          <p>Hi ${user.name},</p>
          <p>Your account has been created successfully.</p>
          <p><strong>Organization:</strong> ${organization.name}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p>You can now start creating and managing invoices.</p>
          <p>Best regards,<br/>Invoice & Billing Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Welcome email error: ${error.message}`);
    // Don't throw - welcome emails are non-critical
  }
}