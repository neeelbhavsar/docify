import api from '@/lib/api';
import { ApiResponse, Credential, CredentialType, CredentialWithData } from '@/types';

export const credentialService = {
    getAll: (projectId: string) =>
        api.get<ApiResponse<Credential[]>>(`/projects/${projectId}/credentials`),

    create: (projectId: string, data: { type: CredentialType; title: string; environment?: string; data: Record<string, string> }) =>
        api.post<ApiResponse<Credential>>(`/projects/${projectId}/credentials`, data),

    reveal: (projectId: string, credentialId: string) =>
        api.get<ApiResponse<CredentialWithData>>(`/projects/${projectId}/credentials/${credentialId}/reveal`),

    update: (projectId: string, credentialId: string, data: { title?: string; environment?: string; data?: Record<string, string> }) =>
        api.patch<ApiResponse<Credential>>(`/projects/${projectId}/credentials/${credentialId}`, data),

    delete: (projectId: string, credentialId: string) =>
        api.delete<ApiResponse>(`/projects/${projectId}/credentials/${credentialId}`),
};
