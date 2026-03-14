export interface User {
    _id: string;
    name: string;
    email: string;
    createdAt?: string;
}

export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ProjectMember {
    user: User;
    role: ProjectRole;
}

export interface Project {
    _id: string;
    name: string;
    description?: string;
    frontendUrl?: string;
    backendUrl?: string;
    notes?: string;
    owner: User;
    members: ProjectMember[];
    createdAt: string;
    updatedAt: string;
}

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

export interface Credential {
    _id: string;
    project: string;
    type: CredentialType;
    title: string;
    environment: CredentialEnvironment;
    createdBy: User;
    keyCount?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CredentialWithData extends Credential {
    data: Record<string, string>;
}

export interface ActivityLog {
    _id: string;
    project: string;
    user: User;
    action: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: unknown;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}
