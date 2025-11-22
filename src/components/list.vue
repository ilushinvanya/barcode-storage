<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { loadBarcodes } from '../barcode';
import type { Barcode } from '../barcode';
import Item from './item.vue';

const barcodes = ref<Barcode[]>([]);
const selectedBarcodeId = ref<string | null>(null);

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

onMounted(() => {
    load();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Заголовок -->
        <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div class="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
                <h1 class="text-2xl font-bold text-gray-800">Штрихкоды</h1>
                <button
                    @click="emit('create')"
                    class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
                >
                    + Создать
                </button>
            </div>
        </div>

        <!-- Список -->
        <div class="max-w-md mx-auto p-4">
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
    </div>
</template>

<style scoped>
</style>
