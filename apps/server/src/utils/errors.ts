import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    public statusCode: number;
    public isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: AppError | Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
        });
        return;
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: err.message,
        });
        return;
    }

    // Mongoose duplicate key error
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0];
        res.status(409).json({
            success: false,
            message: `${field} already exists`,
        });
        return;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({ success: false, message: 'Invalid token' });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({ success: false, message: 'Token expired' });
        return;
    }

    // Generic 500 error
    console.error('💥 Unhandled Error:', err);
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
};

export const asyncHandler =
    (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
        (req: Request, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
