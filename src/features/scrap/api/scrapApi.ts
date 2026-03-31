import axios from 'axios';
import apiClient from '@/shared/api/axios';

type ApiEnvelope<T> = {
    isSuccess: boolean;
    responseCode: number;
    responseMessage: string;
    result: T;
};

export type ScrapEventDto = {
    eventId: number;
    stockName: string;
    ticker: string;
    eventType: 'SURGE' | 'DROP' | string;
    startDate: string;
    changePct: number;
    isScrapped?: boolean;
    scrapped?: boolean;
};

export type ScrapApiError = Error & { responseCode?: number };

function toScrapApiError(error: unknown): ScrapApiError {
    if (!axios.isAxiosError(error)) return new Error('스크랩 요청 중 오류가 발생했습니다.');
    const message = String(error.response?.data?.responseMessage ?? error.message);
    const responseCode = error.response?.data?.responseCode as number | undefined;
    const e = new Error(message) as ScrapApiError;
    e.responseCode = responseCode;
    return e;
}

export async function addScrap(eventId: number): Promise<void> {
    try {
        await apiClient.post<ApiEnvelope<unknown>>(`/events/${eventId}/scraps`);
    } catch (error) {
        throw toScrapApiError(error);
    }
}

export async function removeScrap(eventId: number): Promise<void> {
    try {
        await apiClient.delete<ApiEnvelope<unknown>>(`/events/${eventId}/scraps`);
    } catch (error) {
        throw toScrapApiError(error);
    }
}

export async function fetchMyScraps(): Promise<ScrapEventDto[]> {
    // 백엔드 스펙에 맞춰 경로만 조정
    const { data } = await apiClient.get<ApiEnvelope<{ items: ScrapEventDto[] } | ScrapEventDto[]>>('/events/scraps');
    const result = data?.result;
    if (Array.isArray(result)) return result;
    return Array.isArray(result?.items) ? result.items : [];
}