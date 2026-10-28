const CACHE_NAME = 'studymyte-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon.png',
  '/logowht.png',
  '/logodrk.png',
  '/style.css?v=1.2.0',
  '/modern.css'
];

// Firebase Background Messaging setup inside Service Worker
try {
  importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
  importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

  const firebaseConfig = {
    apiKey: "AIzaSyDMmO3BnFDMacdFtGNRllHvPc0xNS9WiHo",
    authDomain: "studymyte.firebaseapp.com",
    projectId: "studymyte",
    storageBucket: "studymyte.firebasestorage.app",
    messagingSenderId: "574883093044",
    appId: "1:574883093044:web:05cfa63fa1b46595234861",
    measurementId: "G-50D1BHD290"
  };

  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[sw.js] Received background message: ', payload);
    const notificationTitle = (payload.notification && payload.notification.title) || 'StudyMyte Update';
    const notificationOptions = {
      body: (payload.notification && payload.notification.body) || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: payload.data || {}
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[sw.js] Firebase background messaging init skipped/failed:', err);
}

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[sw.js] Pre-caching non-critical failure:', err);
      });
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Network-first with fallback to cache for offline support)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip non-origin requests (e.g., API calls, analytics, Firebase, external fonts)
  if (url.origin !== location.origin) return;

  // Cache-first for static icons/images/manifest, network-first for pages and css/js
  const isStaticImage = url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.ico') || url.pathname.endsWith('.svg');

  if (isStaticImage) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-first for HTML, JS, CSS
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) return cachedResponse;
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
      })
  );
});
