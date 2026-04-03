import { useEffect, useRef, useState } from 'react';
import {
    fetchMyScraps,
    fetchMyScrapsSearch,
    type MyScrapSearchItemDto,
    type ScrapEventDto,
} from '@/features/scrap/api/scrapApi';
import { subscribeScrapSync } from '@/features/scrap/scrapSync';

type UseMyScrapSearchParams = {
    query: string;
    page?: number;
    size?: number;
    sort?: string;
    debounceMs?: number;
};

type PageInfo = {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
};

function isRequestCanceled(error: unknown): boolean {
    if (error instanceof DOMException && error.name === 'AbortError') return true;
    if (typeof error === 'object' && error !== null && 'code' in error) {
        return (error as { code?: string }).code === 'ERR_CANCELED';
    }
    return false;
}

function toSearchItem(item: ScrapEventDto): MyScrapSearchItemDto {
    return {
        eventId: item.eventId,
        stockName: item.stockName,
        ticker: item.ticker,
        eventType: item.eventType,
        startDate: item.startDate,
        changePct: item.changePct,
        logoUrl: item.logoUrl ?? null,
        isScrapped: item.isScrapped ?? item.scrapped ?? true,
    };
}

export function useMyScrapSearch({
                                     query,
                                     page = 0,
                                     size = 20,
                                     sort = 'updatedAt,desc',
                                     debounceMs = 300,
                                 }: UseMyScrapSearchParams) {
    const [items, setItems] = useState<MyScrapSearchItemDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pageInfo, setPageInfo] = useState<PageInfo>({
        page: 0,
        size,
        totalElements: 0,
        totalPages: 0,
    });
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    const requestSeqRef = useRef(0);
    const [refreshTick, setRefreshTick] = useState(0);

    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedQuery(query), debounceMs);
        return () => window.clearTimeout(t);
    }, [query, debounceMs]);

    useEffect(() => {
        return subscribeScrapSync(() => {
            setRefreshTick((v) => v + 1);
        });
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        const reqSeq = ++requestSeqRef.current;

        setLoading(true);
        setError('');

        const keyword = debouncedQuery.trim();

        if (!keyword) {
            fetchMyScraps()
                .then((list) => {
                    if (reqSeq !== requestSeqRef.current) return;
                    const normalized = list.map(toSearchItem);
                    setItems(normalized);
                    setPageInfo({
                        page: 0,
                        size,
                        totalElements: normalized.length,
                        totalPages: Math.max(1, Math.ceil(normalized.length / size)),
                    });
                })
                .catch((e: unknown) => {
                    if (reqSeq !== requestSeqRef.current) return;
                    setError(e instanceof Error ? e.message : '스크랩 목록을 불러오지 못했습니다.');
                })
                .finally(() => {
                    if (reqSeq === requestSeqRef.current) setLoading(false);
                });

            return () => controller.abort();
        }

        fetchMyScrapsSearch({
            q: keyword,
            page,
            size,
            sort,
            signal: controller.signal,
        })
            .then((res) => {
                if (reqSeq !== requestSeqRef.current) return;
                setItems(res.content);
                setPageInfo({
                    page: res.page,
                    size: res.size,
                    totalElements: res.totalElements,
                    totalPages: res.totalPages,
                });
            })
            .catch((e: unknown) => {
                if (isRequestCanceled(e)) return;
                if (reqSeq !== requestSeqRef.current) return;
                setError(e instanceof Error ? e.message : '스크랩 목록을 불러오지 못했습니다.');
            })
            .finally(() => {
                if (reqSeq === requestSeqRef.current) setLoading(false);
            });

        return () => controller.abort();
    }, [debouncedQuery, page, size, sort, refreshTick]);

    const refresh = () => setRefreshTick((v) => v + 1);

    return { items, loading, error, pageInfo, debouncedQuery, refresh };
}
