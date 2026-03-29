import apiClient from '@/shared/api/axios';

type BaseResponse<T> = {
    isSuccess: boolean;
    responseCode: number;
    responseMessage: string;
    result: T;
};

export type LoginRequest = {
    email: string;
    password: string;
};

export type AuthUser = {
    userId: number;
    email: string;
    nickname: string;
};

export type LoginResponse = BaseResponse<AuthUser>;

export async function loginWithEmail(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<LoginResponse>('/auth/login', payload);
    return data;
}

export async function getMe(): Promise<AuthUser> {
    const { data } = await apiClient.get<BaseResponse<AuthUser>>('/auth/me', {
        headers: { 'Cache-Control': 'no-store' },
    });
    return data.result;
}

export async function logoutFromServer(): Promise<void> {
    await apiClient.post('/auth/logout');
}

