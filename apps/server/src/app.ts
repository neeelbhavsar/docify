import 'dotenv/config';
import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import credentialRoutes from './routes/credential.routes';
import activityRoutes from './routes/activity.routes';
import { errorHandler } from './utils/errors';

const app: Application = express();

// Trust proxy for rate limiting (Vercel)
app.set('trust proxy', 1);


// Security middleware
app.use(helmet());

// CORS
app.use(
    cors({
        origin: (origin, callback) => {
            // allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            return callback(null, origin);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS', "PUT"],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Rate limiting
const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: Number(process.env.RATE_LIMIT_MAX) || 100,
    message: { success: false, message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Health check
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ success: true, message: 'DevVault API is running 🚀' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/credentials', credentialRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    errorHandler(err, req, res, next);
});

export default app;
