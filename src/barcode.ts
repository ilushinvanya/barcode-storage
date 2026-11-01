export interface Barcode {
    id: string;
    name: string;
    code: string;
    format: string;
}

const STORAGE_KEY = 'barcodes';
const ID_KEY = 'barcode_next_id';

// Загрузить все штрихкоды из localStorage
export function loadBarcodes(): Barcode[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return [];
    }
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

// Получить следующий ID
function getNextId(): string {
    const currentId = localStorage.getItem(ID_KEY);
    const nextId = currentId ? String(Number(currentId) + 1) : '1';
    localStorage.setItem(ID_KEY, nextId);
    return nextId;
}

// Сохранить штрихкод
export function saveBarcode(barcode: Omit<Barcode, 'id'>): Barcode {
    const barcodes = loadBarcodes();
    const newBarcode: Barcode = {
        ...barcode,
        id: getNextId(),
    };
    barcodes.push(newBarcode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(barcodes));
    return newBarcode;
}

// Удалить штрихкод
export function deleteBarcode(id: string): boolean {
    const barcodes = loadBarcodes();
    const filtered = barcodes.filter(b => b.id !== id);
    if (filtered.length === barcodes.length) {
        return false; // Не найден
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
}

// Редактировать штрихкод (только название)
export function editBarcode(id: string, name: string): boolean {
    const barcodes = loadBarcodes();
    const index = barcodes.findIndex(b => b.id === id);
    if (index === -1) {
        return false; // Не найден
    }
    const barcode = barcodes[index];
    if (!barcode) {
        return false;
    }
    barcode.name = name;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(barcodes));
    return true;
}

// Получить штрихкод по ID
export function getBarcodeById(id: string): Barcode | null {
    const barcodes = loadBarcodes();
    return barcodes.find(b => b.id === id) || null;
}

// Переместить штрихкод вверх
export function moveBarcodeUp(id: string): boolean {
    const barcodes = loadBarcodes();
    const index = barcodes.findIndex(b => b.id === id);
    if (index === -1 || index === 0) {
        return false; // Не найден или уже первый
    }
    // Меняем местами с предыдущим элементом
    [barcodes[index - 1], barcodes[index]] = [barcodes[index], barcodes[index - 1]];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(barcodes));
    return true;
}

// Переместить штрихкод вниз
export function moveBarcodeDown(id: string): boolean {
    const barcodes = loadBarcodes();
    const index = barcodes.findIndex(b => b.id === id);
    if (index === -1 || index === barcodes.length - 1) {
        return false; // Не найден или уже последний
    }
    // Меняем местами со следующим элементом
    [barcodes[index], barcodes[index + 1]] = [barcodes[index + 1], barcodes[index]];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(barcodes));
    return true;
}

// ===== Функции бэкапирования =====

const BACKUP_CODES_KEY = 'backup_codes';

/**
 * Получить список кодов, которые были забэкапены
 * @returns {string[]} Массив кодов из последнего бэкапа
 */
export function getBackupCodes(): string[] {
    const stored = localStorage.getItem(BACKUP_CODES_KEY);
    if (!stored) {
        return [];
    }
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

/**
 * Сохранить список кодов текущего бэкапа
 * @param {Barcode[]} barcodes Массив штрихкодов для бэкапа
 */
function saveBackupCodes(barcodes: Barcode[]): void {
    const codes = barcodes.map(b => b.code);
    localStorage.setItem(BACKUP_CODES_KEY, JSON.stringify(codes));
}

/**
 * Проверить актуален ли бэкап
 * Сравнивает текущий список кодов с сохранённым в бэкапе
 * @returns {boolean} true если бэкап актуален, false если данные изменились
 */
export function isBackupActual(): boolean {
    const currentBarcodes = loadBarcodes();
    const backupCodes = getBackupCodes();

    const currentCodes = currentBarcodes.map(b => b.code).sort();
    const sortedBackupCodes = backupCodes.sort();

    if (currentCodes.length !== sortedBackupCodes.length) {
        return false;
    }

    return currentCodes.every((code, index) => code === sortedBackupCodes[index]);
}

/**
 * Экспортировать все штрихкоды в JSON и скачать файл
 * Автоматически сохраняет текущие коды как актуальный бэкап
 */
export function downloadBackup(): void {
    const barcodes = loadBarcodes();
    // Исключаем id при экспорте, сохраняем только name, code, format
    const backupData = barcodes.map(({ id, ...rest }) => rest);
    const jsonString = JSON.stringify(backupData, null, 2);

    // Сохраняем список кодов как актуальный бэкап
    saveBackupCodes(barcodes);

    // Создаём blob и скачиваем
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barcodes-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Результат операции импорта
 */
export interface ImportResult {
    /** Успешно импортированные штрихкоды */
    imported: Barcode[];
    /** Штрихкоды которые уже существуют (дубликаты) */
    duplicates: Array<{
        code: string;
        importName: string;
        existingName: string;
    }>;
    /** Ошибки при импорте */
    errors: string[];
    /** Количество записей до импорта */
    existingCount: number;
}

/**
 * Импортировать штрихкоды из JSON файла
 * Сверка происходит по коду штрихкода, не по названию или ID
 * @param {string} fileContent JSON строка с массивом штрихкодов
 * @returns {ImportResult} Результат импорта с деталями
 */
export function importBackup(fileContent: string): ImportResult {
    const result: ImportResult = {
        imported: [],
        duplicates: [],
        errors: [],
        existingCount: 0
    };

    try {
        const importedData = JSON.parse(fileContent);

        // Проверяем что это массив
        if (!Array.isArray(importedData)) {
            result.errors.push('Файл должен содержать массив штрихкодов');
            return result;
        }

        const currentBarcodes = loadBarcodes();
        // Сохраняем количество записей до импорта
        result.existingCount = currentBarcodes.length;

        // Создаём Map для быстрого поиска существующих кодов
        const currentCodes = new Map(currentBarcodes.map(b => [b.code, b.name]));

        // Обрабатываем каждый импортируемый штрихкод
        for (const item of importedData) {
            // Проверяем обязательные поля
            if (!item.name || !item.code || !item.format) {
                result.errors.push(`Пропущена запись с недостающими полями: ${JSON.stringify(item)}`);
                continue;
            }

            // Проверяем наличие дубликата по коду
            const existingName = currentCodes.get(item.code);
            if (existingName) {
                result.duplicates.push({
                    code: item.code,
                    importName: item.name,
                    existingName: existingName
                });
                continue;
            }

            // Добавляем новый штрихкод
            const newBarcode = saveBarcode({
                name: item.name,
                code: item.code,
                format: item.format
            });
            result.imported.push(newBarcode);
            currentCodes.set(item.code, item.name);
        }

    } catch (err) {
        result.errors.push(`Ошибка при парсинге файла: ${err instanceof Error ? err.message : String(err)}`);
    }

    return result;
}

