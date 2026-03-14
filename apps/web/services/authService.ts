import api from '@/lib/api';
import { ApiResponse, AuthResponse } from '@/types';

export const authService = {
    register: (data: { name: string; email: string; password: string }) =>
        api.post<ApiResponse<AuthResponse>>('/auth/register', data),

    login: (data: { email: string; password: string }) =>
        api.post<ApiResponse<AuthResponse>>('/auth/login', data),

    refreshToken: (refreshToken: string) =>
        api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
            refreshToken,
        }),

    getMe: () => api.get<ApiResponse<{ user: AuthResponse['user'] }>>('/auth/me'),
};
