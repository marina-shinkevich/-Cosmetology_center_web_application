#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Запуск автоматизированного тестирования косметологического центра "SKIN CODE"\n');

// Запуск тестов API
console.log('📋 Тестирование API сервера...');
exec('npm run test:api', { cwd: __dirname }, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Ошибка при выполнении тестов API:', error.message);
    return;
  }
  
  console.log(stdout);
  
  if (stderr) {
    console.error('⚠️  Предупреждения:', stderr);
  }
  
  console.log('\n✅ Автоматизированное тестирование завершено!');
  console.log('📊 Результаты тестирования сохранены в файле AUTOMATED_TESTS.md');
  console.log('📈 Отчет о покрытии кода доступен в директории coverage/');
});