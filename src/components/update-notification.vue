<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

// Управление состоянием уведомления
const showNotification = ref(false);
const updateHandler = ref<(() => void) | null>(null);

// Функция для показа уведомления
function show(onUpdate: () => void): void {
  showNotification.value = true;
  updateHandler.value = onUpdate;
}

// Обработка обновления
function handleUpdate(): void {
  if (updateHandler.value) {
    updateHandler.value();
  }
  showNotification.value = false;
}

// Закрытие уведомления
function dismiss(): void {
  showNotification.value = false;
}

// Экспорт функции show для внешнего использования
defineExpose({ show });

onMounted(() => {
  console.log('[UpdateNotification] Компонент смонтирован');
});

onUnmounted(() => {
  showNotification.value = false;
});
</script>

<template>
  <Transition name="slide-up">
    <div v-if="showNotification" class="update-notification">
      <div class="update-content">
        <span class="update-message">Доступна новая версия приложения</span>
        <div class="update-actions">
          <button @click="handleUpdate" class="update-button">
            Обновить
          </button>
          <button @click="dismiss" class="dismiss-button">
            Позже
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.update-notification {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #000;
  color: #fff;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  max-width: 90vw;
  width: auto;
}

.update-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.update-message {
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.update-actions {
  display: flex;
  gap: 8px;
  width: 100%;
}

.update-button,
.dismiss-button {
  flex: 1;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  white-space: nowrap;
}

.update-button {
  background: #fff;
  color: #000;
}

.update-button:hover {
  background: #f0f0f0;
}

.update-button:active {
  transform: scale(0.98);
}

.dismiss-button {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dismiss-button:hover {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.05);
}

.dismiss-button:active {
  transform: scale(0.98);
}

/* Анимация появления */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}

@media (max-width: 640px) {
  .update-notification {
    bottom: 16px;
    left: 16px;
    right: 16px;
    transform: none;
    max-width: none;
    width: auto;
  }

  .slide-up-enter-from,
  .slide-up-leave-to {
    transform: translateY(20px);
  }
}
</style>
