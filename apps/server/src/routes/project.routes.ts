import { Router } from 'express';
import {
    getProjects,
    createProject,
    getProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    getActivityLogs,
    updateProjectNotes,
} from '../controllers/project.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireProjectAccess, requireRole } from '../middlewares/rbac';

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);

// Project-specific routes — check membership
router.get('/:projectId', requireProjectAccess, getProject);
router.patch('/:projectId', requireProjectAccess, requireRole('OWNER', 'ADMIN'), updateProject);
router.delete('/:projectId', requireProjectAccess, requireRole('OWNER'), deleteProject);

// Member management
router.post('/:projectId/members', requireProjectAccess, requireRole('OWNER', 'ADMIN'), addMember);
router.delete('/:projectId/members/:userId', requireProjectAccess, requireRole('OWNER', 'ADMIN'), removeMember);

// Activity logs
router.get('/:projectId/activity', requireProjectAccess, getActivityLogs);

// Notes (dedicated endpoint for auto-save)
router.patch('/:projectId/notes', requireProjectAccess, requireRole('OWNER', 'ADMIN'), updateProjectNotes);

export default router;
