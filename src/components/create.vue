<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { saveBarcode } from '../barcode';

const name = ref('');
const code = ref('');
const format = ref('');
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const stream = ref<MediaStream | null>(null);
const scanning = ref(false);
const error = ref('');

// Проверка поддержки Barcode Detection API
const isSupported = () => {
    return 'BarcodeDetector' in window;
};

// Сканирование с камеры
const startCamera = async () => {
    try {
        error.value = '';
        if (!isSupported()) {
            error.value = 'Barcode Detection API не поддерживается в вашем браузере';
            return;
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
        });
        stream.value = mediaStream;

        if (videoRef.value) {
            videoRef.value.srcObject = mediaStream;
            videoRef.value.play();
            scanning.value = true;
            detectBarcode();
        }
    } catch (err) {
        error.value = 'Не удалось получить доступ к камере';
        console.error(err);
    }
};

// Остановка камеры
const stopCamera = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop());
        stream.value = null;
    }
    if (videoRef.value) {
        videoRef.value.srcObject = null;
    }
    scanning.value = false;
};

// Обнаружение штрихкода
const detectBarcode = async () => {
    if (!videoRef.value || !canvasRef.value || !isSupported()) return;

    const video = videoRef.value;
    const canvas = canvasRef.value;
    const context = canvas.getContext('2d');

	console.log('context')
    if (!context) return;

    const detect = async () => {
		console.log('video', video)
        if (!scanning.value || !video) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        try {
            const BarcodeDetectorClass = window.BarcodeDetector;
            if (!BarcodeDetectorClass) {
                throw new Error('BarcodeDetector не поддерживается');
            }
            const barcodeDetector = new BarcodeDetectorClass({
                formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'codabar', 'upc_a', 'upc_e']
            });

            const barcodes = await barcodeDetector.detect(canvas);
			console.log(canvas)
			console.log(barcodes)
            if (barcodes.length > 0) {
                const detected = barcodes[0];
                if (detected) {
                    code.value = detected.rawValue;
                    format.value = detected.format;
                    stopCamera();
                }
            } else if (scanning.value) {
                requestAnimationFrame(detect);
            }
        } catch (err) {
            console.error('Ошибка обнаружения:', err);
            if (scanning.value) {
                requestAnimationFrame(detect);
            }
        }
    };

    detect();
};

// Сканирование с изображения
const scanFromImage = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file || !isSupported()) {
        error.value = 'Barcode Detection API не поддерживается';
        return;
    }

    try {
        error.value = '';
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();

        img.onload = async () => {
            if (!canvasRef.value) return;

            const canvas = canvasRef.value;
            const context = canvas.getContext('2d');

            if (!context) return;

            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0);

            try {
                const BarcodeDetectorClass = window.BarcodeDetector;
                if (!BarcodeDetectorClass) {
                    throw new Error('BarcodeDetector не поддерживается');
                }
                const barcodeDetector = new BarcodeDetectorClass({
                    formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'codabar', 'upc_a', 'upc_e']
                });

                const barcodes = await barcodeDetector.detect(canvas);

                if (barcodes.length > 0) {
                    const detected = barcodes[0];
                    if (detected) {
                        code.value = detected.rawValue;
                        format.value = detected.format;
                    }
                } else {
                    error.value = 'Штрихкод не найден на изображении';
                }
            } catch (err) {
                error.value = 'Ошибка при сканировании изображения';
                console.error(err);
            }

            URL.revokeObjectURL(imageUrl);
        };

        img.src = imageUrl;
    } catch (err) {
        error.value = 'Ошибка при загрузке изображения';
        console.error(err);
    }
};

// Сохранение штрихкода
const save = () => {
    if (!name.value.trim()) {
        error.value = 'Введите название';
        return;
    }
    if (!code.value) {
        error.value = 'Сначала отсканируйте штрихкод';
        return;
    }

    try {
        saveBarcode({
            name: name.value.trim(),
            code: code.value,
            format: format.value,
        });

        // Сброс формы
        name.value = '';
        code.value = '';
        format.value = '';
        error.value = '';

        // Возврат к списку
        emit('saved');
    } catch (err) {
        error.value = 'Ошибка при сохранении';
        console.error(err);
    }
};

const emit = defineEmits<{
    saved: [];
    cancel: [];
}>();

const cancel = () => {
    stopCamera();
    emit('cancel');
};

onUnmounted(() => {
    stopCamera();
});
</script>

<template>
    <div class="min-h-screen bg-gray-50">
        <!-- Заголовок -->
        <div class="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
            <div class="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
                <button
                    @click="cancel"
                    class="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="Назад"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 class="text-2xl font-bold text-gray-800 flex-1">Создать штрихкод</h1>
            </div>
        </div>

        <div class="max-w-md mx-auto p-4">

            <!-- Ошибки -->
            <div v-if="error" class="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {{ error }}
            </div>

            <!-- Камера -->
            <div class="mb-6">
                <div class="mb-4">
                    <video
                        v-show="scanning"
                        ref="videoRef"
                        class="w-full rounded-lg border-2 border-gray-300 bg-black"
                        autoplay
                        playsinline
                    ></video>
                    <canvas ref="canvasRef" class="hidden"></canvas>
                </div>

                <div class="flex gap-2 mb-4">
                    <button
                        v-if="!scanning"
                        @click="startCamera"
                        class="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                        Открыть камеру
                    </button>
                    <button
                        v-else
                        @click="stopCamera"
                        class="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                        Остановить камеру
                    </button>
                </div>

                <div class="text-center text-gray-600 mb-4">или</div>

                <label class="block">
                    <input
                        ref="fileInputRef"
                        type="file"
                        accept="image/*"
                        @change="scanFromImage"
                        class="hidden"
                    />
                    <div class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg cursor-pointer text-center transition">
                        Загрузить изображение
                    </div>
                </label>
            </div>

            <!-- Результат сканирования -->
            <div v-if="code" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p class="text-sm text-gray-600 mb-1">Код:</p>
                <p class="font-mono text-lg font-semibold text-gray-800 mb-2">{{ code }}</p>
                <p class="text-sm text-gray-600 mb-1">Формат:</p>
                <p class="text-sm font-semibold text-gray-700">{{ format }}</p>
            </div>

            <!-- Название -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    Название
                </label>
                <input
                    v-model="name"
                    type="text"
                    placeholder="Введите название"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
            </div>

            <!-- Кнопка сохранения -->
            <button
                @click="save"
                :disabled="!name.trim() || !code"
                class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition"
            >
                Сохранить
            </button>
        </div>
    </div>
</template>

<style scoped>
</style>
