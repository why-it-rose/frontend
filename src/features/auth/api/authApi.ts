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

export type LoginResult = {
    userId: number;
    email: string;
    nickname: string;
    accessToken: string;
    refreshToken: string;
};

export async function loginWithEmail(payload: LoginRequest): Promise<LoginResult> {
    const { data } = await apiClient.post<BaseResponse<LoginResult>>('/auth/login', payload);
    return data.result;
}
