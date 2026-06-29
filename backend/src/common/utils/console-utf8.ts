import { exec } from 'child_process';

export function setConsoleToUTF8() {
  if (process.platform === 'win32') {
    exec('chcp 65001', (error, _stdout, _stderr) => {
      if (error) {
        console.warn('Не удалось установить кодировку UTF-8:', error.message);
      }
    });
  }
}
