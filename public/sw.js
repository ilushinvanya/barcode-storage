// Service Worker для кеширования приложения
const CACHE_NAME = 'barcode-storage-v1.4';
const urlsToCache = [
  '/barcode-storage/',
  '/barcode-storage/index.html',
  '/barcode-storage/favicon.svg'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('[Service Worker] Cache failed:', error);
      })
  );
  // Не активируем немедленно, ждем сигнала от клиента
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
    }).then(() => {
      // Немедленный контроль над всеми страницами
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  // Игнорируем запросы не-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Для навигационных запросов используем Network First стратегию
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Клонируем и кешируем успешный ответ
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // Если сеть недоступна, берем из кеша
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/barcode-storage/index.html');
          });
        })
    );
    return;
  }

  // Для статических ресурсов используем Cache First стратегию
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Возвращаем кеш, но проверяем обновления в фоне
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(event.request, response.clone());
                });
              }
            })
            .catch(() => {
              // Игнорируем ошибки фоновых обновлений
            });

          return cachedResponse;
        }

        // Если нет в кеше, загружаем из сети
        return fetch(event.request)
          .then((response) => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200) {
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
            // Если запрос не удался и это документ, возвращаем index.html
            if (event.request.destination === 'document') {
              return caches.match('/barcode-storage/index.html');
            }
          });
      })
  );
});

// Обработка сообщений от клиента
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

