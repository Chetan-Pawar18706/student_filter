import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import './config/env.js';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quizzes.js';
import attemptRoutes from './routes/attempts.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requireAuth } from './middleware/auth.js';

export const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:4200'
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);

app.use('/api/quizzes', async (req, res, next) => {
  if (!req.headers.authorization) {
    return next();
  }

  return requireAuth(req, res, next);
}, quizRoutes);

app.use('/api/attempts', attemptRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
