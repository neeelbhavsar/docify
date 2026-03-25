import { Router } from 'express';
import { asyncHandler } from '../utils/errors';
import { authenticate } from '../middlewares/authenticate';
import Project from '../models/Project';

const router = Router();

router.use(authenticate);

// GET /api/activity
router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user!._id;
    // Find projects where user is a member
    const projects = await Project.find({ 'members.user': userId }).select('_id');
    const projectIds = projects.map(p => p._id);
    
    const ActivityLog = (await import('../models/ActivityLog')).default;
    const logs = await ActivityLog.find({ project: { $in: projectIds } })
        .populate('user', 'name email')
        .populate('project', 'name')
        .sort({ createdAt: -1 })
        .limit(100);

    res.status(200).json({ success: true, data: logs });
}));

export default router;
