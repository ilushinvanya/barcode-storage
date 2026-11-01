<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { loadBarcodes, isBackupActual, downloadBackup } from '../barcode';
import type { Barcode } from '../barcode';
import Item from './item.vue';

// URL репозитория GitHub (можно настроить через переменную окружения)
const GITHUB_REPO_URL = import.meta.env.VITE_GITHUB_REPO_URL || 'https://github.com/ilushinvanya/barcode-storage';
const README_URL = `${GITHUB_REPO_URL}/blob/main/README.md`;

const barcodes = ref<Barcode[]>([]);
const selectedBarcodeId = ref<string | null>(null);
const backupActual = ref(true);

const load = () => {
    barcodes.value = loadBarcodes();
    backupActual.value = isBackupActual();
};

const selectBarcode = (id: string) => {
    selectedBarcodeId.value = selectedBarcodeId.value === id ? null : id;
};

const handleDeleted = () => {
    load();
    selectedBarcodeId.value = null;
};

const handleBackupClick = async () => {
    await downloadBackup();
    load();
};

const emit = defineEmits<{
    create: [];
}>();

onMounted(() => {
    load();
});
</script>

<template>
    <div ref="containerRef" class="h-dvh bg-gray-50 relative">
        <!-- Заголовок -->
        <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div class="w-full max-w-[600px] mx-auto px-4 py-4 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h1 class="text-2xl font-bold text-gray-800 flex-1">Штрихкоды</h1>
				</div>
				<button
					@click="emit('create')"
					class="p-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition flex"
					title="Назад"
				>
					+ Добавить
				</button>
            </div>
        </div>

        <!-- Плашка предупреждения о бэкапе -->
        <div v-if="!backupActual && barcodes.length > 0" class="w-full max-w-[600px] mx-auto px-4 pt-4">
            <button
                @click="handleBackupClick"
                class="w-full p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg hover:bg-yellow-100 transition cursor-pointer"
            >
                <div class="flex items-start gap-3">
                    <svg class="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                    </svg>
                    <div class="text-left flex-1">
                        <p class="font-semibold text-yellow-800">Требуется резервная копия</p>
                        <p class="text-sm text-yellow-700 mt-1">Штрихкоды изменились с момента последнего бэкапа. Нажмите для скачивания актуальной копии.</p>
                    </div>
                </div>
            </button>
        </div>

        <!-- Список -->
        <div class="w-full max-w-[600px] mx-auto p-4">
            <!-- Промо-экран для первого запуска -->
            <div v-if="barcodes.length === 0" class="text-center py-8">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                    <!-- Иконка -->
                    <div class="w-20 h-20 mx-auto mb-6 bg-blue-50 rounded-full flex items-center justify-center">
                        <svg class="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>

                    <!-- Заголовок -->
                    <h2 class="text-2xl font-bold text-gray-800 mb-3">Добро пожаловать!</h2>

                    <!-- Описание возможностей -->
                    <div class="text-gray-600 space-y-2 mb-6">
                        <p class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Сканируйте штрихкоды камерой
                        </p>
                        <p class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Загружайте картинки со штрихкодами
                        </p>
                        <p class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                            </svg>
                            Делитесь штрихкодами с другими
                        </p>
                    </div>

                    <!-- Кнопка добавления -->
                    <button
                        @click="emit('create')"
                        class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition inline-flex items-center gap-2"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Добавить первый штрихкод
                    </button>
                </div>
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
                            @moved="load"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>

