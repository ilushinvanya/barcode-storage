#!/usr/bin/env node

/**
 * Скрипт для автоматического обновления версии Service Worker
 * Использование: node scripts/bump-sw-version.js
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');

try {
  // Читаем файл service worker
  let content = fs.readFileSync(SW_PATH, 'utf8');

  // Ищем текущую версию
  const versionMatch = content.match(/const CACHE_NAME = 'barcode-storage-v(\d+)\.(\d+)';/);

  if (!versionMatch) {
    console.error('❌ Не удалось найти версию в sw.js');
    process.exit(1);
  }

  const currentMajor = parseInt(versionMatch[1], 10);
  const currentMinor = parseInt(versionMatch[2], 10);
  const newMinor = currentMinor + 1;

  const oldVersion = `barcode-storage-v${currentMajor}.${currentMinor}`;
  const newVersion = `barcode-storage-v${currentMajor}.${newMinor}`;

  // Заменяем версию
  content = content.replace(
    /const CACHE_NAME = 'barcode-storage-v\d+\.\d+';/,
    `const CACHE_NAME = '${newVersion}';`
  );

  // Записываем обратно
  fs.writeFileSync(SW_PATH, content, 'utf8');

  console.log('✅ Версия Service Worker обновлена');
  console.log(`   ${oldVersion} → ${newVersion}`);
  console.log('');
  console.log('Следующие шаги:');
  console.log('  1. npm run build');
  console.log('  2. Разверните приложение');
  console.log('  3. Откройте приложение в браузере');
  console.log('  4. Подождите до 60 секунд для автоматического обнаружения обновления');

} catch (error) {
  console.error('❌ Ошибка:', error.message);
  process.exit(1);
}
