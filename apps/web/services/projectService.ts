import api from '@/lib/api';
import { ApiResponse, Project } from '@/types';

export const projectService = {
    getAll: () => api.get<ApiResponse<Project[]>>('/projects'),

    getById: (id: string) => api.get<ApiResponse<Project>>(`/projects/${id}`),

    create: (data: { name: string; description?: string; frontendUrl?: string; backendUrl?: string; notes?: string }) =>
        api.post<ApiResponse<Project>>('/projects', data),

    update: (id: string, data: { name?: string; description?: string; frontendUrl?: string; backendUrl?: string; notes?: string }) =>
        api.patch<ApiResponse<Project>>(`/projects/${id}`, data),

    updateNotes: (id: string, notes: string) =>
        api.patch<ApiResponse<Project>>(`/projects/${id}/notes`, { notes }),

    delete: (id: string) => api.delete<ApiResponse>(`/projects/${id}`),

    addMember: (projectId: string, data: { email: string; role?: string }) =>
        api.post<ApiResponse<Project>>(`/projects/${projectId}/members`, data),

    removeMember: (projectId: string, userId: string) =>
        api.delete<ApiResponse>(`/projects/${projectId}/members/${userId}`),

    getActivityLog: (projectId: string) =>
        api.get<ApiResponse>(`/projects/${projectId}/activity`),

    getGlobalActivityLog: () =>
        api.get<ApiResponse>('/activity'),
};
