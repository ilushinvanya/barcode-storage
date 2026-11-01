# Быстрое тестирование обновлений PWA

## Локальный тест (за 2 минуты)

### 1. Первый запуск
```bash
npm run build
npm run preview
```
Откройте http://localhost:4173/barcode-storage/ в браузере

### 2. Проверка регистрации SW
- Откройте DevTools (F12)
- Application → Service Workers
- Должен быть зарегистрирован `barcode-storage-v1.4`

### 3. Симуляция обновления
```bash
# В новом терминале обновите версию
npm run bump-sw

# Пересоберите
npm run build
```

### 4. Проверка обновления
- **НЕ** перезагружайте страницу вручную
- Подождите до 60 секунд (обычно 5-10 секунд)
- Внизу появится уведомление "Доступна новая версия приложения"
- Нажмите "Обновить" или подождите 30 секунд

### 5. Проверка логов
В консоли браузера должны быть:
```
[PWA] Service Worker зарегистрирован
[PWA] Проверка обновлений...
[PWA] Обнаружено обновление Service Worker
[PWA] Состояние нового worker: installed
[PWA] Новая версия доступна
[Service Worker] Installing...
[Service Worker] Activating...
[Service Worker] Removing old cache: barcode-storage-v1.4
[PWA] Контроллер изменен, перезагружаем страницу
```

## Принудительная проверка обновления

Если хотите проверить сразу, не дожидаясь 60 секунд:

```javascript
// В консоли браузера
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) reg.update();
});
```

## Быстрое тестирование через DevTools

1. **Application → Service Workers**
2. Нажмите **Update** рядом с активным SW
3. Если есть новая версия, увидите "waiting to activate"
4. Уведомление должно появиться автоматически

## Проверка кнопок уведомления

### Кнопка "Обновить"
- Нажмите → страница должна перезагрузиться сразу
- В DevTools проверьте новую версию кеша

### Кнопка "Позже"
- Нажмите → уведомление исчезнет
- Через 30 секунд страница обновится автоматически

## Сброс для повторного теста

```javascript
// В консоли браузера
// 1. Удалить все кеши
caches.keys().then(names => names.forEach(name => caches.delete(name)));

// 2. Отменить регистрацию SW
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
);

// 3. Перезагрузить страницу
location.reload();
```

Или в DevTools:
- Application → Storage → Clear site data
- Перезагрузить страницу

## Известные проблемы

### Уведомление не появляется
**Причина:** Vue компонент не успел смонтироваться
**Решение:** Будет использован fallback с нативным HTML

### Обновление не обнаруживается
**Причина:** Версия кеша не изменилась
**Решение:** Запустите `npm run bump-sw` перед сборкой

### SW не регистрируется
**Причина:** Неправильный путь или не HTTPS
**Решение:** Проверьте путь `/barcode-storage/sw.js` в `src/sw-register.ts`

## Полезные команды

```bash
# Обновить версию и собрать
npm run bump-sw && npm run build

# Запустить preview
npm run preview

# Проверить версию в sw.js
grep CACHE_NAME public/sw.js
```
