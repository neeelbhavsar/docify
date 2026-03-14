import { Request, Response } from 'express';
import { z } from 'zod';
import Credential from '../models/Credential';
import { encryptObject, decryptObject } from '../utils/encryption';
import { AppError, asyncHandler } from '../utils/errors';
import { logActivity } from '../services/activityLog.service';

const credentialSchema = z.object({
    type: z.enum([
        'AWS', 'REDIS', 'SES', 'SENDGRID', 'STRIPE', 'PAYPAL',
        'MONGODB', 'POSTGRESQL', 'MYSQL', 'API_KEY', 'DEVOPS',
        'ENV_FRONTEND', 'ENV_BACKEND', 'OTHER',
    ]),
    title: z.string().min(1).max(200),
    environment: z.enum(['LOCAL', 'DEVELOPMENT', 'STAGE', 'PRODUCTION']).default('PRODUCTION'),
    data: z.record(z.string(), z.string()),
});

// GET /api/projects/:projectId/credentials — never decrypts
export const getCredentials = asyncHandler(async (req: Request, res: Response) => {
    const credentials = await Credential.find({ project: req.params.projectId })
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

    // Only return masked, non-decrypted data
    const safe = credentials.map((c) => ({
        _id: c._id,
        project: c.project,
        type: c.type,
        title: c.title,
        environment: c.environment,
        createdBy: c.createdBy,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        // Count of keys without revealing values
        keyCount: (() => {
            try {
                return Object.keys(decryptObject(c.encryptedData)).length;
            } catch {
                return 0;
            }
        })(),
    }));

    res.status(200).json({ success: true, data: safe });
});

// POST /api/projects/:projectId/credentials
export const createCredential = asyncHandler(async (req: Request, res: Response) => {
    const parsed = credentialSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

    const { type, title, environment, data } = parsed.data;
    const encryptedData = encryptObject(data);

    const credential = await Credential.create({
        project: req.params.projectId,
        type,
        title,
        environment,
        encryptedData,
        createdBy: req.user!._id,
    });

    await logActivity(
        req.params.projectId,
        req.user!._id.toString(),
        'CREDENTIAL_CREATED',
        { type, title, environment }
    );

    res.status(201).json({
        success: true,
        data: {
            _id: credential._id,
            type: credential.type,
            title: credential.title,
            environment: credential.environment,
            createdBy: req.user,
            createdAt: credential.createdAt,
        },
    });
});

// GET /api/projects/:projectId/credentials/:credentialId/reveal
export const revealCredential = asyncHandler(async (req: Request, res: Response) => {
    const credential = await Credential.findOne({
        _id: req.params.credentialId,
        project: req.params.projectId,
    });

    if (!credential) throw new AppError('Credential not found', 404);

    const decryptedData = decryptObject(credential.encryptedData);

    await logActivity(
        req.params.projectId,
        req.user!._id.toString(),
        'CREDENTIAL_REVEALED',
        { credentialId: credential._id, type: credential.type }
    );

    res.status(200).json({
        success: true,
        data: {
            _id: credential._id,
            type: credential.type,
            title: credential.title,
            data: decryptedData,
        },
    });
});

// PATCH /api/projects/:projectId/credentials/:credentialId
export const updateCredential = asyncHandler(async (req: Request, res: Response) => {
    const credential = await Credential.findOne({
        _id: req.params.credentialId,
        project: req.params.projectId,
    });

    if (!credential) throw new AppError('Credential not found', 404);

    if (req.body.title) credential.title = req.body.title;
    if (req.body.environment) credential.environment = req.body.environment;
    if (req.body.data) {
        credential.encryptedData = encryptObject(req.body.data);
    }

    await credential.save();

    await logActivity(
        req.params.projectId,
        req.user!._id.toString(),
        'CREDENTIAL_UPDATED',
        { credentialId: credential._id }
    );

    res.status(200).json({
        success: true,
        data: { _id: credential._id, type: credential.type, title: credential.title },
    });
});

// DELETE /api/projects/:projectId/credentials/:credentialId
export const deleteCredential = asyncHandler(async (req: Request, res: Response) => {
    const credential = await Credential.findOneAndDelete({
        _id: req.params.credentialId,
        project: req.params.projectId,
    });

    if (!credential) throw new AppError('Credential not found', 404);

    await logActivity(
        req.params.projectId,
        req.user!._id.toString(),
        'CREDENTIAL_DELETED',
        { type: credential.type, title: credential.title }
    );

    res.status(200).json({ success: true, message: 'Credential deleted successfully' });
});
