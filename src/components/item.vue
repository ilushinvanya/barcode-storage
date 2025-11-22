<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import JsBarcode from 'jsbarcode';
import { editBarcode, deleteBarcode } from '../barcode';
import type { Barcode } from '../barcode';

const props = defineProps<{
    barcode: Barcode;
}>();

const barcodeSvgRef = ref<SVGSVGElement | null>(null);
const isEditing = ref(false);
const editName = ref('');
const error = ref('');

const renderBarcode = async () => {
    await nextTick();
    if (barcodeSvgRef.value && props.barcode.code) {
        try {
            // Очистка предыдущего содержимого
            barcodeSvgRef.value.innerHTML = '';
            
            // Рендеринг штрихкода
            JsBarcode(barcodeSvgRef.value, props.barcode.code, {
                format: mapFormat(props.barcode.format),
                width: 2,
                height: 80,
                displayValue: true,
                fontSize: 14,
                margin: 10,
            });
        } catch (err) {
            console.error('Ошибка рендеринга штрихкода:', err);
        }
    }
};

// Маппинг форматов из Barcode Detection API в JsBarcode
const mapFormat = (format: string): string => {
    const formatMap: Record<string, string> = {
        'qr_code': 'CODE128', // JsBarcode не поддерживает QR, используем CODE128
        'ean_13': 'EAN13',
        'ean_8': 'EAN8',
        'code_128': 'CODE128',
        'code_39': 'CODE39',
        'codabar': 'codabar',
        'upc_a': 'UPC',
        'upc_e': 'UPC',
    };
    return formatMap[format.toLowerCase()] || 'CODE128';
};

const startEdit = () => {
    isEditing.value = true;
    editName.value = props.barcode.name;
    error.value = '';
};

const cancelEdit = () => {
    isEditing.value = false;
    editName.value = '';
    error.value = '';
};

const saveEdit = () => {
    if (!editName.value.trim()) {
        error.value = 'Название не может быть пустым';
        return;
    }

    const success = editBarcode(props.barcode.id, editName.value.trim());
    if (success) {
        isEditing.value = false;
        error.value = '';
        emit('updated');
    } else {
        error.value = 'Ошибка при сохранении';
    }
};

const handleDelete = () => {
    if (confirm(`Удалить штрихкод "${props.barcode.name}"?`)) {
        const success = deleteBarcode(props.barcode.id);
        if (success) {
            emit('deleted');
        } else {
            error.value = 'Ошибка при удалении';
        }
    }
};

const emit = defineEmits<{
    deleted: [];
    updated: [];
}>();

onMounted(() => {
    renderBarcode();
});

watch(() => props.barcode, () => {
    renderBarcode();
}, { deep: true });
</script>

<template>
    <div class="p-4">
        <!-- Ошибки -->
        <div v-if="error" class="mb-3 p-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
            {{ error }}
        </div>

        <!-- Название -->
        <div class="mb-4">
            <div v-if="!isEditing" class="flex items-center justify-between">
                <h3 class="text-lg font-semibold text-gray-800">{{ barcode.name }}</h3>
                <div class="flex gap-2">
                    <button
                        @click="startEdit"
                        class="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                        title="Редактировать"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        @click="handleDelete"
                        class="p-2 text-red-600 hover:bg-red-50 rounded transition"
                        title="Удалить"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
            <div v-else class="space-y-2">
                <input
                    v-model="editName"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    @keyup.enter="saveEdit"
                    @keyup.esc="cancelEdit"
                />
                <div class="flex gap-2">
                    <button
                        @click="saveEdit"
                        class="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition text-sm"
                    >
                        Сохранить
                    </button>
                    <button
                        @click="cancelEdit"
                        class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition text-sm"
                    >
                        Отмена
                    </button>
                </div>
            </div>
        </div>

        <!-- Штрихкод -->
        <div class="bg-white p-4 rounded-lg border border-gray-200 flex justify-center">
            <svg ref="barcodeSvgRef" class="max-w-full h-auto"></svg>
        </div>

        <!-- Информация -->
        <div class="mt-3 text-sm text-gray-600 space-y-1">
            <p><span class="font-medium">Код:</span> {{ barcode.code }}</p>
            <p><span class="font-medium">Формат:</span> {{ barcode.format }}</p>
        </div>
    </div>
</template>

<style scoped>
</style>
