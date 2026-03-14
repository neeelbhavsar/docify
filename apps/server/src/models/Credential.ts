import mongoose, { Document, Schema } from 'mongoose';

export type CredentialType =
    | 'AWS'
    | 'REDIS'
    | 'SES'
    | 'SENDGRID'
    | 'STRIPE'
    | 'PAYPAL'
    | 'MONGODB'
    | 'POSTGRESQL'
    | 'MYSQL'
    | 'API_KEY'
    | 'DEVOPS'
    | 'ENV_FRONTEND'
    | 'ENV_BACKEND'
    | 'OTHER';

export type CredentialEnvironment = 'LOCAL' | 'DEVELOPMENT' | 'STAGE' | 'PRODUCTION';

export interface ICredential extends Document {
    _id: mongoose.Types.ObjectId;
    project: mongoose.Types.ObjectId;
    type: CredentialType;
    title: string;
    environment: CredentialEnvironment;
    encryptedData: string; // JSON stringified then AES encrypted
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const credentialSchema = new Schema<ICredential>(
    {
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'AWS', 'REDIS', 'SES', 'SENDGRID', 'STRIPE', 'PAYPAL',
                'MONGODB', 'POSTGRESQL', 'MYSQL', 'API_KEY', 'DEVOPS',
                'ENV_FRONTEND', 'ENV_BACKEND', 'OTHER',
            ],
            required: [true, 'Credential type is required'],
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        environment: {
            type: String,
            enum: ['LOCAL', 'DEVELOPMENT', 'STAGE', 'PRODUCTION'],
            default: 'PRODUCTION',
        },
        encryptedData: {
            type: String,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

credentialSchema.index({ project: 1 });
credentialSchema.index({ project: 1, type: 1 });

const Credential = mongoose.model<ICredential>('Credential', credentialSchema);
export default Credential;
