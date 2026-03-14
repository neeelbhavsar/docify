import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityLog extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    user: mongoose.Types.ObjectId;
    action: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

activityLogSchema.index({ project: 1, createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
export default ActivityLog;
