export type EventDetailApiResponse<T = unknown> = {
  isSuccess: boolean;
  responseCode: number;
  responseMessage: string;
  result: T;
};

export async function fetchEventDetail<T = unknown>(
  eventId: number,
): Promise<EventDetailApiResponse<T>> {
  const response = await fetch(`/api/events/${eventId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`이벤트 상세 요청 실패: ${response.status}`);
  }

  return response.json() as Promise<EventDetailApiResponse<T>>;
}
