import apiClient from '@/shared/api/axios';

export async function saveFcmToken(token: string): Promise<void> {
  // TODO: 백엔드 엔드포인트 확정 후 경로 수정
  await apiClient.post('/api/fcm/token', { token });
}
