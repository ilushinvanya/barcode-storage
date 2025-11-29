<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { editBarcode, deleteBarcode, moveBarcodeUp, moveBarcodeDown } from '../barcode';
import type { Barcode } from '../barcode';

const props = defineProps<{
    barcode: Barcode;
}>();

const barcodeSvgRef = ref<SVGSVGElement | null>(null);
const isEditing = ref(false);
const editName = ref('');
const error = ref('');
const successMessage = ref('');

const renderBarcode = async () => {
    await nextTick();
    if (barcodeSvgRef.value && props.barcode.code) {
        try {
            // Очистка предыдущего содержимого
            barcodeSvgRef.value.innerHTML = '';

            // Проверяем, является ли формат QR кодом
            const format = props.barcode.format.toLowerCase();
            if (format === 'qr_code') {
                // Используем node-qrcode для генерации QR кода
                const svgString = await QRCode.toString(props.barcode.code, {
                    type: 'svg',
                    width: 300,
                    margin: 2,
                    color: {
                        dark: '#000000',
                        light: '#FFFFFF'
                    }
                });
                // Парсим SVG строку и извлекаем содержимое
                const parser = new DOMParser();
                const svgDoc = parser.parseFromString(svgString, 'image/svg+xml');
                const svgElement = svgDoc.querySelector('svg');
                if (svgElement) {
                    // Копируем атрибуты и содержимое в существующий SVG элемент
                    barcodeSvgRef.value.setAttribute('viewBox', svgElement.getAttribute('viewBox') || '');
                    barcodeSvgRef.value.setAttribute('width', '100%');
                    barcodeSvgRef.value.removeAttribute('height');
                    barcodeSvgRef.value.innerHTML = svgElement.innerHTML;
                }
            } else {
                // Используем JsBarcode для остальных форматов
                JsBarcode(barcodeSvgRef.value, props.barcode.code, {
                    format: mapFormat(props.barcode.format),
                    width: 2,
                    height: 120,
                    displayValue: true,
                    fontSize: 16,
                    margin: 10,
                });
            }
            barcodeSvgRef.value.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            barcodeSvgRef.value.setAttribute('width', '100%');
            barcodeSvgRef.value.removeAttribute('height');
            barcodeSvgRef.value.style.width = '100%';
            barcodeSvgRef.value.style.height = 'auto';
        } catch (err) {
            console.error('Ошибка рендеринга штрихкода:', err);
        }
    }
};

// Маппинг форматов из Barcode Detection API в JsBarcode
const mapFormat = (format: string): string => {
    const formatMap: Record<string, string> = {
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

const handleExport = async () => {
    try {
        const exportData = {
            name: props.barcode.name,
            format: props.barcode.format,
            code: props.barcode.code
        };
        const jsonString = JSON.stringify(exportData, null, 2);

        // Пытаемся использовать Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Штрихкод: ${props.barcode.name}`,
                    text: jsonString
                });
                return;
            } catch (shareErr) {
                // Если пользователь отменил шаринг, просто продолжаем с копированием
                if ((shareErr as Error).name !== 'AbortError') {
                    console.error('Ошибка при шаринге:', shareErr);
                }
            }
        }

        // Fallback: копирование в буфер обмена
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(jsonString);
            error.value = '';
            successMessage.value = 'Штрихкод скопирован в буфер обмена';
            setTimeout(() => {
                successMessage.value = '';
            }, 3000);
        } else {
            // Старый способ для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = jsonString;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                error.value = '';
                successMessage.value = 'Штрихкод скопирован в буфер обмена';
                setTimeout(() => {
                    successMessage.value = '';
                }, 3000);
            } catch (err) {
                error.value = 'Не удалось скопировать в буфер обмена';
            } finally {
                document.body.removeChild(textArea);
            }
        }
    } catch (err) {
        error.value = 'Ошибка при экспорте';
        console.error('Ошибка экспорта:', err);
    }
};

const handleMoveUp = () => {
    const success = moveBarcodeUp(props.barcode.id);
    if (success) {
        emit('moved');
    }
};

const handleMoveDown = () => {
    const success = moveBarcodeDown(props.barcode.id);
    if (success) {
        emit('moved');
    }
};

const emit = defineEmits<{
    deleted: [];
    updated: [];
    moved: [];
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

        <!-- Успешные сообщения -->
        <div v-if="successMessage" class="mb-3 p-2 bg-green-100 border border-green-400 text-green-700 text-sm rounded">
            {{ successMessage }}
        </div>

        <!-- Кнопки управления -->
        <div class="mb-4">
            <div v-if="!isEditing" class="flex justify-between">
                <div class="flex items-center gap-2">
                    <button
                        @click="handleMoveUp"
                        class="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition"
                        title="Переместить вверх"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                        </svg>
                    </button>
                    <button
                        @click="handleMoveDown"
                        class="p-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded transition"
                        title="Переместить вниз"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                <div class="flex items-center justify-end gap-2">
                    <button
                        @click="handleExport"
                        class="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded transition"
                        title="Экспорт"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>
                    <button
                        @click="startEdit"
                        class="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition"
                        title="Редактировать"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        @click="handleDelete"
                        class="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
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
        <div class="bg-white p-4 rounded-lg border border-gray-200">
            <svg ref="barcodeSvgRef" class="w-full h-auto block"></svg>
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
