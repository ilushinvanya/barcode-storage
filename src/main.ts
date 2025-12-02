import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  let refreshing = false;

  navigator.serviceWorker.register('/barcode-storage/sw.js')
    .then((registration) => {
      console.log('[Service Worker] Registered successfully:', registration.scope);

      // Проверка обновлений каждые 60 секунд
      setTimeout(() => {
        registration.update();
      }, 10000);

      // Обработка обновления service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Новый service worker установлен, перезагружаем страницу
              console.log('[Service Worker] New version available, reloading...');
              if (!refreshing) {
                refreshing = true;
                window.location.reload();
              }
            }
          });
        }
      });

      // Обработка сообщений от service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    })
    .catch((error) => {
      console.error('[Service Worker] Registration failed:', error);
    });
}

createApp(App).mount('#app')
