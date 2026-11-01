<script setup lang="ts">
import { ref, onMounted } from 'vue';
import List from './components/list.vue';
import Create from './components/create.vue';
import UpdateNotification from './components/update-notification.vue';

const currentView = ref<'list' | 'create'>('list');
const updateNotificationRef = ref<InstanceType<typeof UpdateNotification> | null>(null);

const showCreate = () => {
    currentView.value = 'create';
};

const showList = () => {
    currentView.value = 'list';
};

// Экспорт функции для показа уведомления о обновлении
// Это позволит вызывать её из sw-register.ts
onMounted(() => {
    // Делаем функцию глобально доступной для sw-register
    (window as any).showPWAUpdateNotification = (onUpdate: () => void) => {
        updateNotificationRef.value?.show(onUpdate);
    };
});
</script>

<template>
    <List v-if="currentView === 'list'" @create="showCreate" />
    <Create v-else @saved="showList" @cancel="showList" />
    <UpdateNotification ref="updateNotificationRef" />
</template>

<style scoped>
</style>
