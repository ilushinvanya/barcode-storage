// Регистрация и управление обновлениями Service Worker
export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker не поддерживается');
    return;
  }

  let refreshing = false;

  // Предотвращаем множественные перезагрузки
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      console.log('[PWA] Контроллер изменен, перезагружаем страницу');
      refreshing = true;
      window.location.reload();
    }
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/barcode-storage/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker зарегистрирован:', registration.scope);

        // Проверяем обновления при загрузке
        registration.update();

        // Периодическая проверка обновлений каждые 60 секунд
        setInterval(() => {
          console.log('[PWA] Проверка обновлений...');
          registration.update();
        }, 60000);

        // Отслеживаем новые версии service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[PWA] Обнаружено обновление Service Worker');

          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            console.log('[PWA] Состояние нового worker:', newWorker.state);

            // Если новый worker установлен и есть активный контроллер
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                // Есть старая версия, показываем уведомление об обновлении
                console.log('[PWA] Новая версия доступна');
                showUpdateNotification(registration);
              } else {
                // Первая установка
                console.log('[PWA] Контент кеширован для оффлайн использования');
              }
            }
          });
        });
      })
      .catch((error) => {
        console.error('[PWA] Ошибка регистрации Service Worker:', error);
      });
  });
}

// Показываем уведомление о доступном обновлении
function showUpdateNotification(registration: ServiceWorkerRegistration): void {
  // Используем Vue компонент если доступен
  if (typeof (window as any).showPWAUpdateNotification === 'function') {
    (window as any).showPWAUpdateNotification(() => {
      console.log('[PWA] Пользователь запросил обновление через Vue компонент');
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    });

    // Автоматическое обновление через 30 секунд
    setTimeout(() => {
      console.log('[PWA] Автоматическое обновление после таймаута');
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }, 30000);

    return;
  }

  // Fallback: создаем уведомление напрямую если Vue не готов
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #000;
    color: #fff;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
  `;

  notification.innerHTML = `
    <span>Доступна новая версия приложения</span>
    <button id="update-button" style="
      background: #fff;
      color: #000;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      font-size: 13px;
    ">Обновить</button>
    <button id="dismiss-button" style="
      background: transparent;
      color: #fff;
      border: 1px solid #fff;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    ">Позже</button>
  `;

  document.body.appendChild(notification);

  // Обработчик кнопки обновления
  const updateButton = notification.querySelector('#update-button');
  updateButton?.addEventListener('click', () => {
    console.log('[PWA] Пользователь запросил обновление');

    // Отправляем сообщение новому service worker для немедленной активации
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    notification.remove();
  });

  // Обработчик кнопки отмены
  const dismissButton = notification.querySelector('#dismiss-button');
  dismissButton?.addEventListener('click', () => {
    notification.remove();
  });

  // Автоматическое обновление через 30 секунд если пользователь не ответил
  setTimeout(() => {
    if (notification.parentElement) {
      console.log('[PWA] Автоматическое обновление после таймаута');
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      notification.remove();
    }
  }, 30000);
}
