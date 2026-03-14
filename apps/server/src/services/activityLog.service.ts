import ActivityLog from '../models/ActivityLog';
import mongoose from 'mongoose';

export const logActivity = async (
    projectId: string,
    userId: string,
    action: string,
    metadata?: Record<string, unknown>
): Promise<void> => {
    try {
        await ActivityLog.create({
            project: new mongoose.Types.ObjectId(projectId),
            user: new mongoose.Types.ObjectId(userId),
            action,
            metadata,
        });
    } catch (error) {
        // Log errors should not crash the main request
        console.error('Failed to write activity log:', error);
    }
};
