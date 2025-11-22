<script setup lang="ts">
import { ref } from 'vue';
import List from './components/list.vue';
import Create from './components/create.vue';

const currentView = ref<'list' | 'create'>('list');

const showCreate = () => {
    currentView.value = 'create';
};

const showList = () => {
    currentView.value = 'list';
};
</script>

<template>
    <List v-if="currentView === 'list'" @create="showCreate" />
    <Create v-else @saved="showList" @cancel="showList" />
</template>

<style scoped>
</style>
