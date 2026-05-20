import { exec } from 'child_process';

import { LOG_MESSAGE } from '@common/strings';

export function setConsoleToUTF8() {
  if (process.platform === 'win32') {
    exec('chcp 65001', (error, _stdout, _stderr) => {
      if (error) {
        console.warn(LOG_MESSAGE.CONSOLE_UTF8_FAILED, error.message);
      }
    });
  }
}
