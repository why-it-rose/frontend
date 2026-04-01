import apiClient from '@/shared/api/axios';
import axios from 'axios';

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

export type LoginUser = {
    userId: number;
    email: string;
    nickname: string;
};

export type AuthUser = LoginUser & {
    pushEnabled: boolean;
};

export type SignupRequest = {
    name: string;
    nickname: string;
    email: string;
    password: string;
};

export type SignupResult = {
    userId: number;
    email: string;
    nickname: string;
};

type ErrorResponseBody = {
    responseCode?: number;
};

export type LoginResponse = BaseResponse<AuthUser>;
export type SignupResponse = BaseResponse<SignupResult>;

// UI 쪽에서 공통으로 에러코드 분기할 때 사용
export function getApiResponseCode(error: unknown): number | undefined {
    if (!axios.isAxiosError(error)) return undefined;

    const body = error.response?.data as ErrorResponseBody | undefined;
    return typeof body?.responseCode === 'number' ? body.responseCode : undefined;
}

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

export async function updateMyNickname(nickname: string): Promise<AuthUser> {
    const { data } = await apiClient.patch<BaseResponse<AuthUser>>('/auth/me', { nickname });
    return data.result;
}

export async function deleteMyAccount(): Promise<string> {
    const { data } = await apiClient.delete<BaseResponse<string>>('/auth/me');
    return data.result;
}

export async function logoutFromServer(): Promise<void> {
    await apiClient.post('/auth/logout');
}

export async function signupWithEmail(payload: SignupRequest): Promise<SignupResponse> {
    const { data } = await apiClient.post<SignupResponse>('/auth/signup', payload);
    return data;
}

export async function updateMyPushEnabled(enabled: boolean): Promise<void> {
    await apiClient.patch('/auth/me/push-enabled', { enabled });
}