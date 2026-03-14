import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { AppError } from '../utils/errors';
import User, { IUser } from '../models/User';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}

export const authenticate = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('Authentication required. Please provide a valid token.', 401);
        }

        const token = authHeader.split(' ')[1];
        const payload = verifyAccessToken(token);

        const user = await User.findById(payload.userId).select('-password');
        if (!user) {
            throw new AppError('User not found. Token may be invalid.', 401);
        }

        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};
