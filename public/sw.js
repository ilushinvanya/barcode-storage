// Service Worker для кеширования приложения
const CACHE_NAME = 'barcode-storage-v1.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.svg'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        // Кешируем только основные файлы, остальное будет кешироваться при запросах
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  // Принудительная активация нового service worker
  self.skipWaiting();
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Немедленный контроль над всеми страницами
  return self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Игнорируем запросы не-GET и внешние домены
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Если есть кешированный ответ, возвращаем его
        if (cachedResponse) {
          return cachedResponse;
        }

        // Иначе загружаем из сети
        return fetch(event.request)
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Клонируем ответ для кеширования
            const responseToCache = response.clone();

            // Кешируем успешные ответы
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Если запрос не удался и это запрос документа, возвращаем index.html
            if (event.request.destination === 'document' ||
                (event.request.mode === 'navigate' && event.request.url.indexOf('http') === 0)) {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Обработка сообщений от клиента для обновления
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

