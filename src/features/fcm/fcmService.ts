import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/shared/lib/firebase';

export function initForegroundMessage() {
  onMessage(messaging, (payload) => {
    console.log('[FCM] 포그라운드 메시지 수신:', payload);
    const title = payload.notification?.title ?? '알림';
    const body = payload.notification?.body ?? '';
    new Notification(title, { body, icon: '/favicon.svg' });
  });
}

export async function requestFcmToken(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[FCM] 알림 권한이 거부되었습니다.');
      return null;
    }

    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const swRegistration = await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });

    console.log('[FCM] 토큰 발급 성공:', token);
    return token;
  } catch (error) {
    console.error('[FCM] 토큰 발급 실패:', error);
    return null;
  }
}
