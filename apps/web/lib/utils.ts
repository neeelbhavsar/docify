import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CredentialType } from '@/types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const seconds = Math.floor(diff / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

export const CREDENTIAL_ICONS: Record<CredentialType, string> = {
    AWS: '☁️',
    REDIS: '⚡',
    SES: '📧',
    SENDGRID: '📨',
    STRIPE: '💳',
    PAYPAL: '💰',
    MONGODB: '🍃',
    POSTGRESQL: '🐘',
    MYSQL: '🐬',
    API_KEY: '🔑',
    DEVOPS: '⚙️',
    ENV_FRONTEND: '🌐',
    ENV_BACKEND: '🖥️',
    OTHER: '📦',
};

export const CREDENTIAL_COLORS: Record<CredentialType, string> = {
    AWS: 'from-orange-500/20 to-orange-600/10 border-orange-500/30',
    REDIS: 'from-red-500/20 to-red-600/10 border-red-500/30',
    SES: 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30',
    SENDGRID: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
    STRIPE: 'from-violet-500/20 to-violet-600/10 border-violet-500/30',
    PAYPAL: 'from-blue-600/20 to-blue-700/10 border-blue-600/30',
    MONGODB: 'from-green-500/20 to-green-600/10 border-green-500/30',
    POSTGRESQL: 'from-sky-500/20 to-sky-600/10 border-sky-500/30',
    MYSQL: 'from-teal-500/20 to-teal-600/10 border-teal-500/30',
    API_KEY: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
    DEVOPS: 'from-slate-500/20 to-slate-600/10 border-slate-500/30',
    ENV_FRONTEND: 'from-pink-500/20 to-pink-600/10 border-pink-500/30',
    ENV_BACKEND: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30',
    OTHER: 'from-gray-500/20 to-gray-600/10 border-gray-500/30',
};

export function maskValue(value: string): string {
    if (value.length <= 4) return '••••';
    return '•'.repeat(Math.min(value.length - 4, 12)) + value.slice(-4);
}
