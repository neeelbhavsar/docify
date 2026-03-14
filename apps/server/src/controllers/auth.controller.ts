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

export const getMe = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({
        success: true,
        data: { user: req.user },
    });
});
