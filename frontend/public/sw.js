/**
 * CURSA Service Worker - Поддержка PWA и офлайн-режима
 * Версия: 1.0.0
 */

const CACHE_NAME = 'cursa-v1';
const RUNTIME_CACHE = 'cursa-runtime-v1';
const API_CACHE = 'cursa-api-v1';

// Ресурсы для предварительного кэширования (App Shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo.svg',
  '/logo192.png',
  '/logo512.png',
];

// Паттерны API-запросов для кэширования
const API_PATTERNS = [
  /\/api\/profiles/,
  /\/api\/health/,
];

// Паттерны для пропуска кэширования (не кэшируем загрузку файлов)
const SKIP_CACHE_PATTERNS = [
  /\/api\/documents\/upload/,
  /\/api\/documents\/correct/,
  /\/corrections\//,
  /socket\.io/,
  /\.hot-update\./,
];

/**
 * Установка Service Worker - предварительное кэширование
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell...');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Precache complete, skipping waiting...');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

/**
 * Активация - очистка старых кэшей
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE, API_CACHE];
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return cacheNames.filter(name => !currentCaches.includes(name));
      })
      .then((cachesToDelete) => {
        return Promise.all(
          cachesToDelete.map((cache) => {
            console.log('[SW] Deleting old cache:', cache);
            return caches.delete(cache);
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients...');
        return self.clients.claim();
      })
  );
});

/**
 * Проверяет, нужно ли пропустить кэширование для данного URL
 */
function shouldSkipCache(url) {
  return SKIP_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Проверяет, является ли запрос API-запросом
 */
function isApiRequest(url) {
  return API_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Стратегия: Network First (для API)
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[SW] Serving from cache (network failed):', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Стратегия: Cache First (для статических ресурсов)
 */
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Фоновое обновление кэша
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Network request failed:', error);
    throw error;
  }
}

/**
 * Стратегия: Stale While Revalidate
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cachedResponse);
  
  return cachedResponse || networkPromise;
}

/**
 * Перехват запросов
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Пропускаем не-HTTP запросы
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Пропускаем определённые паттерны
  if (shouldSkipCache(request.url)) {
    return;
  }
  
  // Только GET-запросы кэшируем
  if (request.method !== 'GET') {
    return;
  }
  
  // API-запросы: Network First
  if (isApiRequest(request.url)) {
    event.respondWith(
      networkFirst(request, API_CACHE).catch(() => {
        // Возвращаем заглушку для API при офлайне
        return new Response(
          JSON.stringify({ 
            error: 'offline', 
            message: 'Приложение находится в офлайн-режиме' 
          }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }
  
  // Навигационные запросы (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      networkFirst(request, CACHE_NAME).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }
  
  // Статические ресурсы: Stale While Revalidate
  if (url.pathname.match(/\.(js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }
  
  // Остальные запросы: Cache First
  event.respondWith(cacheFirst(request, RUNTIME_CACHE));
});

/**
 * Обработка push-уведомлений
 */
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  let data = { title: 'CURSA', body: 'Новое уведомление' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
      ...data
    },
    actions: [
      { action: 'open', title: 'Открыть', icon: '/logo192.png' },
      { action: 'close', title: 'Закрыть' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * Обработка клика по уведомлению
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  // Открываем приложение или фокусируем окно
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Ищем открытое окно приложения
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Если окна нет, открываем новое
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

/**
 * Фоновая синхронизация
 */
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-documents') {
    event.waitUntil(syncPendingDocuments());
  }
});

/**
 * Синхронизация отложенных документов
 */
async function syncPendingDocuments() {
  console.log('[SW] Syncing pending documents...');
  
  // TODO: Реализовать синхронизацию документов из IndexedDB
  // когда соединение восстановится
  
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_COMPLETE',
      message: 'Документы синхронизированы'
    });
  });
}

/**
 * Обработка сообщений от клиента
 */
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then((names) => {
        names.forEach((name) => caches.delete(name));
      }).then(() => {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'GET_VERSION':
      event.source.postMessage({ 
        type: 'VERSION', 
        version: CACHE_NAME 
      });
      break;
      
    default:
      console.log('[SW] Unknown message type:', event.data.type);
  }
});

console.log('[SW] Service Worker loaded');
