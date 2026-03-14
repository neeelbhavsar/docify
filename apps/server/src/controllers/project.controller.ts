import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import Project from '../models/Project';
import User from '../models/User';
import { AppError, asyncHandler } from '../utils/errors';
import { logActivity } from '../services/activityLog.service';

const createProjectSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    frontendUrl: z.string().max(500).optional(),
    backendUrl: z.string().max(500).optional(),
    notes: z.string().max(50000).optional(),
});

const updateProjectSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    frontendUrl: z.string().max(500).optional(),
    backendUrl: z.string().max(500).optional(),
    notes: z.string().max(50000).optional(),
});

const updateNotesSchema = z.object({
    notes: z.string().max(50000),
});

// GET /api/projects
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!._id;
    const projects = await Project.find({ 'members.user': userId })
        .populate('owner', 'name email')
        .populate('members.user', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: projects });
});

// POST /api/projects
export const createProject = asyncHandler(async (req: Request, res: Response) => {
    const parsed = createProjectSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

    const { name, description } = parsed.data;
    const userId = req.user!._id;

    const project = await Project.create({
        name,
        description,
        owner: userId,
        members: [{ user: userId, role: 'OWNER' }],
    });

    await logActivity(project._id.toString(), userId.toString(), 'PROJECT_CREATED', { name });

    const populated = await project.populate([
        { path: 'owner', select: 'name email' },
        { path: 'members.user', select: 'name email' },
    ]);

    res.status(201).json({ success: true, data: populated });
});

// GET /api/projects/:projectId
export const getProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.projectId)
        .populate('owner', 'name email')
        .populate('members.user', 'name email');

    if (!project) throw new AppError('Project not found', 404);
    res.status(200).json({ success: true, data: project });
});

// PATCH /api/projects/:projectId
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateProjectSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

    const project = await Project.findByIdAndUpdate(
        req.params.projectId,
        { $set: parsed.data },
        { new: true, runValidators: true }
    )
        .populate('owner', 'name email')
        .populate('members.user', 'name email');

    if (!project) throw new AppError('Project not found', 404);

    await logActivity(project._id.toString(), req.user!._id.toString(), 'PROJECT_UPDATED', parsed.data);
    res.status(200).json({ success: true, data: project });
});

// DELETE /api/projects/:projectId
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new AppError('Project not found', 404);

    // Only owner can delete
    if (project.owner.toString() !== req.user!._id.toString()) {
        throw new AppError('Only the project owner can delete this project', 403);
    }

    await Project.findByIdAndDelete(req.params.projectId);
    res.status(200).json({ success: true, message: 'Project deleted successfully' });
});

// POST /api/projects/:projectId/members - Add member
export const addMember = asyncHandler(async (req: Request, res: Response) => {
    const { email, role } = req.body;
    if (!email) throw new AppError('Email is required', 400);

    const targetUser = await User.findOne({ email });
    if (!targetUser) throw new AppError('User with that email not found', 404);

    const project = await Project.findById(req.params.projectId);
    if (!project) throw new AppError('Project not found', 404);

    const alreadyMember = project.members.some(
        (m) => m.user.toString() === targetUser._id.toString()
    );
    if (alreadyMember) throw new AppError('User is already a member', 409);

    project.members.push({
        user: targetUser._id as mongoose.Types.ObjectId,
        role: role || 'MEMBER',
    });
    await project.save();

    await logActivity(project._id.toString(), req.user!._id.toString(), 'MEMBER_ADDED', {
        addedUser: targetUser.email,
        role: role || 'MEMBER',
    });

    const populated = await project.populate('members.user', 'name email');
    res.status(200).json({ success: true, data: populated });
});

// DELETE /api/projects/:projectId/members/:userId - Remove member
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
    const project = await Project.findById(req.params.projectId);
    if (!project) throw new AppError('Project not found', 404);

    const memberUserId = req.params.userId;
    if (project.owner.toString() === memberUserId) {
        throw new AppError('Cannot remove the project owner', 400);
    }

    project.members = project.members.filter(
        (m) => m.user.toString() !== memberUserId
    );
    await project.save();

    await logActivity(project._id.toString(), req.user!._id.toString(), 'MEMBER_REMOVED', {
        removedUserId: memberUserId,
    });

    res.status(200).json({ success: true, message: 'Member removed successfully' });
});

// PATCH /api/projects/:projectId/notes
export const updateProjectNotes = asyncHandler(async (req: Request, res: Response) => {
    const parsed = updateNotesSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(parsed.error.errors[0].message, 400);

    const project = await Project.findByIdAndUpdate(
        req.params.projectId,
        { $set: { notes: parsed.data.notes } },
        { new: true, runValidators: true }
    )
        .populate('owner', 'name email')
        .populate('members.user', 'name email');

    if (!project) throw new AppError('Project not found', 404);

    await logActivity(
        project._id.toString(),
        req.user!._id.toString(),
        'NOTES_UPDATED',
        { length: parsed.data.notes.length }
    );

    res.status(200).json({ success: true, data: project });
});

// GET /api/projects/:projectId/activity
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
    const ActivityLog = (await import('../models/ActivityLog')).default;
    const logs = await ActivityLog.find({ project: req.params.projectId })
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .limit(50);

    res.status(200).json({ success: true, data: logs });
});
