import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export interface JwtPayload {
    userId: string;
    email: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

function getSecret(key: 'JWT_ACCESS_SECRET' | 'JWT_REFRESH_SECRET'): string {
    const secret = process.env[key];
    if (!secret) throw new Error(`${key} is not defined`);
    return secret;
}

export function generateTokens(userId: mongoose.Types.ObjectId, email: string): TokenPair {
    const payload: JwtPayload = { userId: userId.toString(), email };

    const accessToken = jwt.sign(payload, getSecret('JWT_ACCESS_SECRET'), {
        expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign(payload, getSecret('JWT_REFRESH_SECRET'), {
        expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    });

    return { accessToken, refreshToken };
}

export function verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, getSecret('JWT_ACCESS_SECRET')) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, getSecret('JWT_REFRESH_SECRET')) as JwtPayload;
}
