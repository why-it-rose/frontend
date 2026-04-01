import apiClient from '@/shared/api/axios';

interface ApiResponse<T> {
    isSuccess: boolean;
    responseCode: number;
    responseMessage: string;
    result: T;
}

export type ScrapApiError = Error & { responseCode?: number };

export type ScrapEventDto = {
    eventId: number;
    stockName: string;
    ticker: string;
    eventType: 'SURGE' | 'DROP' | string;
    startDate: string;
    changePct: number;
    logoUrl?: string | null;
    isScrapped?: boolean;
    scrapped?: boolean;
};

export type MyScrapSearchItemDto = {
    eventId: number;
    stockName: string;
    ticker: string;
    eventType: 'SURGE' | 'DROP' | string;
    startDate: string;
    changePct: number;
    logoUrl?: string | null;
    isScrapped: boolean;
};

export type MyScrapSearchPageDto = {
    content: MyScrapSearchItemDto[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

export type MyScrapSearchParams = {
    q?: string;
    page?: number;
    size?: number;
    sort?: string;
    signal?: AbortSignal;
};

export async function addEventScrap(eventId: number): Promise<void> {
    try {
        await apiClient.post<ApiResponse<unknown>>(`/events/${eventId}/scraps`);
    } catch (error: unknown) {
        const e = error as { response?: { status?: number; data?: { responseCode?: number; responseMessage?: string } }; message?: string };
        const status = e.response?.status;
        const responseCode = e.response?.data?.responseCode;

        if (status === 409 || responseCode === 4022) return;

        const wrapped = new Error(e.response?.data?.responseMessage || e.message || 'event request failed') as ScrapApiError;
        wrapped.responseCode = responseCode;
        throw wrapped;
    }
}

export async function removeEventScrap(eventId: number): Promise<void> {
    try {
        await apiClient.delete<ApiResponse<unknown>>(`/events/${eventId}/scraps`);
    } catch (error: unknown) {
        const e = error as { response?: { status?: number; data?: { responseCode?: number; responseMessage?: string } }; message?: string };
        const status = e.response?.status;
        const responseCode = e.response?.data?.responseCode;

        if (status === 404 || responseCode === 4020) return;

        const wrapped = new Error(e.response?.data?.responseMessage || e.message || 'event request failed') as ScrapApiError;
        wrapped.responseCode = responseCode;
        throw wrapped;
    }
}

export async function fetchMyScraps(): Promise<ScrapEventDto[]> {
    const { data } = await apiClient.get<ApiResponse<
        ScrapEventDto[] | { items?: ScrapEventDto[]; content?: ScrapEventDto[]; scraps?: ScrapEventDto[] }
    >>('/scraps/my');

    if (!data?.isSuccess) {
        const e = new Error(data?.responseMessage || '스크랩 목록 조회 실패') as ScrapApiError;
        e.responseCode = data?.responseCode;
        throw e;
    }

    const result = data.result;
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.content)) return result.content;
    if (Array.isArray(result?.scraps)) return result.scraps;
    return [];
}

export async function fetchMyScrapsSearch({
                                              q = '',
                                              page = 0,
                                              size = 20,
                                              sort = 'updatedAt,desc',
                                              signal,
                                          }: MyScrapSearchParams = {}): Promise<MyScrapSearchPageDto> {
    const qs = new URLSearchParams();
    const keyword = q.trim();

    if (keyword) qs.set('q', keyword);
    qs.set('page', String(page));
    qs.set('size', String(size));
    qs.set('sort', sort);

    const { data } = await apiClient.get<ApiResponse<MyScrapSearchPageDto>>(
        `/scraps/my/search?${qs.toString()}`,
        { signal },
    );

    if (!data?.isSuccess) {
        const e = new Error(data?.responseMessage || '스크랩 검색 조회 실패') as ScrapApiError;
        e.responseCode = data?.responseCode;
        throw e;
    }

    return data.result;
}
