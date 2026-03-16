import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import User from '../models/User';
import { generateTokens, verifyRefreshToken } from '../utils/jwt';
import { AppError, asyncHandler } from '../utils/errors';

const registerSchema = z.object({
    name: z.string().min(2).max(50),
    email: z.string().email(),
    password: z.string().min(8),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const register = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
    }

    const { name, email, password } = parsed.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new AppError('Email already registered', 409);
    }

    const user = await User.create({ name, email, password });
    const tokens = generateTokens(user._id, user.email);

    res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
            user: { _id: user._id, name: user.name, email: user.email },
            ...tokens,
        },
    });
});

export const login = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
        throw new AppError('Invalid email or password', 401);
    }

    const tokens = generateTokens(user._id, user.email);

    res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
            user: { _id: user._id, name: user.name, email: user.email },
            ...tokens,
        },
    });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        throw new AppError('Refresh token is required', 400);
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const tokens = generateTokens(user._id, user.email);
    res.status(200).json({ success: true, data: tokens });
});

import crypto from 'crypto';
import { sendEmail } from '../utils/email';

export const getMe = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({
        success: true,
        data: { user: req.user },
    });
});

const forgotPasswordSchema = z.object({
    email: z.string().email(),
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
    }

    const { email } = parsed.data;

    // Get user
    const user = await User.findOne({ email });
    if (!user) {
        throw new AppError('There is no user with that email', 404);
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = process.env.CORS_ORIGIN || `${protocol}://${req.get('host')?.replace('5000', '3000')}`;
    
    // In production, usually the host will be the frontend URL.
    const resetUrl = `${host}/auth/reset-password?token=${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; padding: 20px; }
            .card { background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; font-size: 24px; font-weight: bold; margin-bottom: 16px; box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3); }
            .title { color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; }
            .subtitle { color: #6b7280; font-size: 15px; margin: 0; }
            .content { color: #4b5563; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 32px; }
            .button-wrapper { text-align: center; margin-bottom: 32px; }
            .button { display: inline-block; background: linear-gradient(to right, #4f46e5, #7c3aed); color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.2); transition: transform 0.2s, box-shadow 0.2s; }
            .footer { color: #9ca3af; font-size: 14px; line-height: 1.5; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 24px; }
            .link { color: #6366f1; word-break: break-all; text-decoration: none; }
            .meta { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="card">
                <div class="header">
                    <div class="logo">DV</div>
                    <h1 class="title">Password Reset Request</h1>
                    <p class="subtitle">Secure Project Credential Manager</p>
                </div>
                
                <div class="content">
                    <p>Hello,</p>
                    <p>We received a request to reset your password for your DevVault account. Click the button below to securely set a new password. This link will expire in 15 minutes.</p>
                </div>
                
                <div class="button-wrapper">
                    <a href="${resetUrl}" class="button" target="_blank" rel="noopener noreferrer">
                        Reset Your Password
                    </a>
                </div>
                
                <div class="footer">
                    <p style="margin-top: 0; margin-bottom: 8px;">If you didn't make this request, you can safely ignore this email.</p>
                    <p style="margin: 0; font-size: 13px;">Or copy and paste this link into your browser:</p>
                    <p style="margin-top: 4px;"><a href="${resetUrl}" class="link">${resetUrl}</a></p>
                </div>
            </div>
            
            <div class="meta">
                &copy; ${new Date().getFullYear()} DevVault. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'DevVault Password Reset Token',
            message,
            html,
        });

        res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
        console.error('Email could not be sent', err);
        user.resetPasswordToken = undefined as unknown as string;
        user.resetPasswordExpires = undefined as unknown as Date;
        await user.save({ validateBeforeSave: false });

        throw new AppError('Email could not be sent', 500);
    }
});

const resetPasswordSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const resetPassword = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError(parsed.error.errors[0].message, 400);
    }

    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() },
    }).select('+password');

    if (!user) {
        throw new AppError('Invalid or expired token', 400);
    }

    // Set new password
    user.password = parsed.data.password;
    user.resetPasswordToken = undefined as unknown as string;
    user.resetPasswordExpires = undefined as unknown as Date;
    await user.save();

    // Generate new access tokens
    const tokens = generateTokens(user._id, user.email);

    res.status(200).json({
        success: true,
        message: 'Password modernized successfully',
        data: {
            user: { _id: user._id, name: user.name, email: user.email },
            ...tokens,
        },
    });
});
