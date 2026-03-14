import mongoose, { Document, Schema } from 'mongoose';

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface IProjectMember {
    user: mongoose.Types.ObjectId;
    role: ProjectRole;
}

export interface IProject extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    description?: string;
    frontendUrl?: string;
    backendUrl?: string;
    notes?: string; // Stores HTML from rich-text editor
    owner: mongoose.Types.ObjectId;
    members: IProjectMember[];
    createdAt: Date;
    updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMember>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['OWNER', 'ADMIN', 'MEMBER'],
            default: 'MEMBER',
        },
    },
    { _id: false }
);

const projectSchema = new Schema<IProject>(
    {
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            minlength: [2, 'Project name must be at least 2 characters'],
            maxlength: [100, 'Project name cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        frontendUrl: {
            type: String,
            trim: true,
            maxlength: [500, 'Frontend URL cannot exceed 500 characters'],
        },
        backendUrl: {
            type: String,
            trim: true,
            maxlength: [500, 'Backend URL cannot exceed 500 characters'],
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [50000, 'Notes cannot exceed 50000 characters'],
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [projectMemberSchema],
    },
    {
        timestamps: true,
    }
);

// Index for efficient member lookups
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ owner: 1 });

const Project = mongoose.model<IProject>('Project', projectSchema);
export default Project;
