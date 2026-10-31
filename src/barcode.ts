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

// Получить список кодов, которые были забэкапены
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

// Сохранить список кодов текущего бэкапа
function saveBackupCodes(barcodes: Barcode[]): void {
    const codes = barcodes.map(b => b.code);
    localStorage.setItem(BACKUP_CODES_KEY, JSON.stringify(codes));
}

// Проверить актуален ли бэкап
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

// Экспортировать все штрихкоды в JSON и скачать
export function downloadBackup(): void {
    const barcodes = loadBarcodes();
    const backupData = barcodes.map(({ id, ...rest }) => rest); // Исключаем id
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

// Интерфейс для результата импорта
export interface ImportResult {
    imported: Barcode[];
    duplicates: Array<{
        code: string;
        importName: string;
        existingName: string;
    }>;
    errors: string[];
}

// Импортировать штрихкоды из JSON файла
export function importBackup(fileContent: string): ImportResult {
    const result: ImportResult = {
        imported: [],
        duplicates: [],
        errors: []
    };

    try {
        const importedData = JSON.parse(fileContent);

        // Проверяем что это массив
        if (!Array.isArray(importedData)) {
            result.errors.push('Файл должен содержать массив штрихкодов');
            return result;
        }

        const currentBarcodes = loadBarcodes();
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
                if (existingName === item.name) {
                    result.duplicates.push({
                        code: item.code,
                        importName: item.name,
                        existingName: item.name
                    });
                } else {
                    result.duplicates.push({
                        code: item.code,
                        importName: item.name,
                        existingName: existingName
                    });
                }
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

