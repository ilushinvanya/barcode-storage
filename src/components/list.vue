<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { loadBarcodes } from '../barcode';
import type { Barcode } from '../barcode';
import Item from './item.vue';
import { useDraggableFloatingAction } from '../composables/useDraggableFloatingAction';
import { CREATE_BUTTON_POSITION_KEY } from '../constants';

// URL репозитория GitHub (можно настроить через переменную окружения)
const GITHUB_REPO_URL = import.meta.env.VITE_GITHUB_REPO_URL || 'https://github.com/ilushinvanya/barcode-storage';
const README_URL = `${GITHUB_REPO_URL}/blob/main/README.md`;

const barcodes = ref<Barcode[]>([]);
const selectedBarcodeId = ref<string | null>(null);

const {
    containerRef,
    elementRef: createButtonRef,
    style: createButtonStyle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    allowClick,
} = useDraggableFloatingAction({
    storageKey: CREATE_BUTTON_POSITION_KEY,
});

const load = () => {
    barcodes.value = loadBarcodes();
};

const selectBarcode = (id: string) => {
    selectedBarcodeId.value = selectedBarcodeId.value === id ? null : id;
};

const handleDeleted = () => {
    load();
    selectedBarcodeId.value = null;
};

const emit = defineEmits<{
    create: [];
}>();

const handleCreateClick = () => {
	console.log('allowClick()', allowClick())
    if (!allowClick()) {
        return;
    }

    emit('create');
};

onMounted(() => {
    load();
});
</script>

<template>
    <div ref="containerRef" class="min-h-screen bg-gray-50 relative">
        <!-- Заголовок -->
        <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div class="w-full max-w-[600px] mx-auto px-4 py-4 flex items-center gap-4">
                <a
                    :href="README_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="Открыть README на GitHub"
                >
                    <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                </a>
                <h1 class="text-2xl font-bold text-gray-800 flex-1">Штрихкоды</h1>
            </div>
        </div>

        <!-- Список -->
        <div class="w-full max-w-[600px] mx-auto p-4">
            <div v-if="barcodes.length === 0" class="text-center py-12 text-gray-500">
                <p class="text-lg mb-2">Нет штрихкодов</p>
                <p class="text-sm">Создайте первый штрихкод</p>
            </div>

            <div v-else class="space-y-2">
                <div
                    v-for="barcode in barcodes"
                    :key="barcode.id"
                    class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                    <!-- Заголовок с именем -->
                    <button
                        @click="selectBarcode(barcode.id)"
                        class="w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition"
                    >
                        <span class="font-medium text-gray-800">{{ barcode.name }}</span>
                        <svg
                            :class="['w-5 h-5 text-gray-400 transition-transform', selectedBarcodeId === barcode.id ? 'transform rotate-180' : '']"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    <!-- Детали штрихкода -->
                    <div v-if="selectedBarcodeId === barcode.id" class="border-t border-gray-200">
                        <Item
                            :barcode="barcode"
                            @deleted="handleDeleted"
                            @updated="load"
                        />
                    </div>
                </div>
            </div>
        </div>

        <button
            ref="createButtonRef"
            @click="handleCreateClick"
            @pointerdown.stop="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="handlePointerUp"
            class="absolute bottom-24 right-6 w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-3xl font-bold shadow-lg flex items-center justify-center transition touch-none select-none"
            :style="createButtonStyle"
            aria-label="Создать"
        >
            +
        </button>
    </div>
</template>

<style scoped>
</style>
