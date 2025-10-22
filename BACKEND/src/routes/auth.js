import express from 'express';
import { register, login, refreshToken, logout, getCurrentUser } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../lib/validators.js';
import { registerSchema, loginSchema, refreshTokenSchema } from '../lib/validators.js';

const router = express.Router();

// Public routes
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticateToken, getCurrentUser);

export default router;