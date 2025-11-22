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

