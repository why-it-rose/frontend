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

export type LoginResponse = BaseResponse<AuthUser>;
export type SignupResponse = BaseResponse<SignupResult>;

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

export async function signupWithEmail(payload: SignupRequest): Promise<SignupResponse> {
    const { data } = await apiClient.post<SignupResponse>('/auth/signup', payload);
    return data;
}