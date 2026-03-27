importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyCOBeF6sH_7gOaxfapWEugaKvUlV4aT-wo',
  authDomain: 'why-it-rose.firebaseapp.com',
  projectId: 'why-it-rose',
  storageBucket: 'why-it-rose.firebasestorage.app',
  messagingSenderId: '864538096309',
  appId: '1:864538096309:web:69ebd5c90471fe28a384fc',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title = '알림', body = '' } = payload.notification ?? {};
  self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
  });
});
