import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import Project, { ProjectRole } from '../models/Project';
import mongoose from 'mongoose';

// Extend Request to include project member role
declare global {
    namespace Express {
        interface Request {
            projectId?: string;
            userRole?: ProjectRole;
        }
    }
}

/**
 * Middleware to verify the user is a member of the project.
 * Attaches userRole to req for downstream RBAC checks.
 */
export const requireProjectAccess = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const { projectId } = req.params;
        if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
            throw new AppError('Invalid project ID', 400);
        }

        const project = await Project.findById(projectId);
        if (!project) {
            throw new AppError('Project not found', 404);
        }

        const userId = req.user?._id?.toString();
        const member = project.members.find((m) => m.user.toString() === userId);

        if (!member) {
            throw new AppError('You do not have access to this project', 403);
        }

        req.projectId = projectId;
        req.userRole = member.role;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Middleware factory: require specific roles.
 */
export const requireRole = (...roles: ProjectRole[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            next(new AppError(`Access denied. Required role: ${roles.join(' or ')}`, 403));
            return;
        }
        next();
    };
};
