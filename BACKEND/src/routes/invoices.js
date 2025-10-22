import express from 'express';
import {
  create,
  list,
  getOne,
  update,
  send,
  markPaid,
  remove,
  exportCSV,
  downloadPDF,
  emailInvoice,
} from '../controllers/invoiceController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../lib/validators.js';
import { createInvoiceSchema, updateInvoiceSchema } from '../lib/validators.js';
import { auditMiddleware } from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../lib/constants.js';

const router = express.Router();

// All invoice routes require authentication
router.use(authenticateToken);

router.post('/', validateRequest(createInvoiceSchema), auditMiddleware(AUDIT_ACTIONS.CREATE, 'invoice'), create);
router.get('/', list);
router.get('/export/csv', exportCSV);
router.get('/:id', getOne);
router.get('/:id/pdf', downloadPDF);
router.post('/:id/email', emailInvoice);
router.put('/:id', validateRequest(updateInvoiceSchema), auditMiddleware(AUDIT_ACTIONS.UPDATE, 'invoice'), update);
router.post('/:id/send', auditMiddleware(AUDIT_ACTIONS.SEND, 'invoice'), send);
router.post('/:id/mark-paid', auditMiddleware(AUDIT_ACTIONS.MARK_PAID, 'invoice'), markPaid);
router.delete('/:id', auditMiddleware(AUDIT_ACTIONS.DELETE, 'invoice'), remove);

export default router;