import express from 'express';
import {
  createClient,
  listClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/clientController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../lib/validators.js';
import { createClientSchema, updateClientSchema } from '../lib/validators.js';

const router = express.Router();

// All client routes require authentication
router.use(authenticateToken);

router.post('/', validateRequest(createClientSchema), createClient);
router.get('/', listClients);
router.get('/:id', getClient);
router.put('/:id', validateRequest(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);

export default router;
