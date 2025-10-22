import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';

import { connectDB } from './lib/db.js';
import logger from './lib/logger.js';
import errorHandler from './middleware/errorHandler.js';
import authRoutes from './routes/auth.js';
import clientRoutes from './routes/clients.js';
import invoiceRoutes from './routes/invoices.js';
import auditLogRoutes from './routes/auditLogs.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Sentry error tracking (if enabled)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(mongoSanitize());
app.use(xss());

// Cookie parsing
import cookieParser from 'cookie-parser';
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: dbStatus,
      uptime: process.uptime(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
    });
  }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      logger.info(`✓ Server running on port ${PORT}`);
      logger.info(`✓ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('✗ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;