import axios from 'axios';

type BaseResponse<T> = {
    isSuccess: boolean;
    responseCode: number;
    responseMessage: string;
    result: T;
};

type RefreshResult = {
    userId: number;
    email: string;
    nickname: string;
    accessToken: string;
    refreshToken: string;
};

type RetryableConfig = {
    _retry?: boolean;
    headers?: Record<string, string>;
    url?: string;
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/';

const apiClient = axios.create({
    baseURL: apiBaseUrl,
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error: unknown) => {
        if (!axios.isAxiosError(error)) {
            return Promise.reject(error);
        }

        const originalConfig = error.config as RetryableConfig | undefined;
        const status = error.response?.status;

        if (!originalConfig || status !== 401 || originalConfig._retry) {
            return Promise.reject(error);
        }

        if (originalConfig.url?.includes('/auth/refresh')) {
            return Promise.reject(error);
        }

        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('nickname');
            window.location.href = '/home';
            return Promise.reject(error);
        }

        try {
            originalConfig._retry = true;

            const refreshUrl =
                apiBaseUrl === '/' ? '/auth/refresh' : `${apiBaseUrl}/auth/refresh`;

            const { data } = await axios.post<BaseResponse<RefreshResult>>(
                refreshUrl,
                { refreshToken },
                { headers: { 'Content-Type': 'application/json' } },
            );

            const nextAccessToken = data.result.accessToken;
            const nextRefreshToken = data.result.refreshToken;
            const nextNickname = data.result.nickname;

            localStorage.setItem('accessToken', nextAccessToken);
            localStorage.setItem('refreshToken', nextRefreshToken);
            localStorage.setItem('nickname', nextNickname);

            originalConfig.headers = originalConfig.headers ?? {};
            originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`;

            return apiClient(originalConfig);
        } catch (refreshError) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('nickname');
            window.location.href = '/home';
            return Promise.reject(refreshError);
        }
    },
);

export default apiClient;
