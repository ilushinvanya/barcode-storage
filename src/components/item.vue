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
const showExportMenu = ref(false);

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
        const exportData = `${props.barcode.name}\n${props.barcode.format}\n${props.barcode.code}`;

        // Пытаемся использовать Web Share API
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Штрихкод: ${props.barcode.name}`,
                    text: exportData
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
            await navigator.clipboard.writeText(exportData);
            error.value = '';
            successMessage.value = 'Штрихкод скопирован в буфер обмена';
            setTimeout(() => {
                successMessage.value = '';
            }, 3000);
        } else {
            // Старый способ для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = exportData;
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

const handleExportData = async () => {
    showExportMenu.value = false;
    await handleExport();
};

const handleExportImage = async () => {
    showExportMenu.value = false;
    try {
        if (!barcodeSvgRef.value) {
            error.value = 'Штрихкод не загружен';
            return;
        }

        // Создаём canvas для рендеринга SVG
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            error.value = 'Не удалось создать canvas';
            return;
        }

        // Получаем размеры SVG
        const svgRect = barcodeSvgRef.value.getBoundingClientRect();
        const svg = barcodeSvgRef.value.cloneNode(true) as SVGSVGElement;

        // Устанавливаем размеры canvas
        canvas.width = Math.ceil(svgRect.width);
        canvas.height = Math.ceil(svgRect.height);

        // Устанавливаем белый фон
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Конвертируем SVG в изображение
        const svgString = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = async () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            // Конвертируем canvas в blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    error.value = 'Не удалось создать изображение';
                    return;
                }

                // Пытаемся поделиться через Web Share API
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], `barcode-${props.barcode.name}.png`, { type: 'image/png' })] })) {
                    try {
                        await navigator.share({
                            title: `Штрихкод: ${props.barcode.name}`,
                            files: [new File([blob], `barcode-${props.barcode.name}.png`, { type: 'image/png' })]
                        });
                        return;
                    } catch (shareErr) {
                        if ((shareErr as Error).name !== 'AbortError') {
                            console.error('Ошибка при шаринге:', shareErr);
                        }
                    }
                }

                // Fallback: копирование в буфер обмена
                if (navigator.clipboard && navigator.clipboard.write) {
                    try {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        error.value = '';
                        successMessage.value = 'Изображение скопировано в буфер обмена';
                        setTimeout(() => {
                            successMessage.value = '';
                        }, 3000);
                    } catch (err) {
                        // Если не смогли скопировать изображение, скачиваем файл
                        downloadImage(blob);
                    }
                } else {
                    // Если нет API для работы с буфером обмена, скачиваем файл
                    downloadImage(blob);
                }
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            error.value = 'Ошибка при обработке штрихкода';
        };

        img.src = url;
    } catch (err) {
        error.value = 'Ошибка при экспорте изображения';
        console.error('Ошибка экспорта изображения:', err);
    }
};

const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcode-${props.barcode.name}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    error.value = '';
    successMessage.value = 'Изображение скачано';
    setTimeout(() => {
        successMessage.value = '';
    }, 3000);
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
                <div class="flex items-center justify-end gap-2 relative">
                    <button
                        @click="showExportMenu = !showExportMenu"
                        class="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded transition"
                        title="Поделиться"
                    >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                    </button>

                    <!-- Меню экспорта -->
                    <div v-if="showExportMenu" class="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 top-full">
                        <button
                            @click="handleExportImage"
                            class="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-200 first:rounded-t-lg"
                        >
                            📷 Поделиться изображением
                        </button>
                        <button
                            @click="handleExportData"
                            class="block w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 last:rounded-b-lg"
                        >
                            📋 Поделиться данными для сайта
                        </button>
                    </div>

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
