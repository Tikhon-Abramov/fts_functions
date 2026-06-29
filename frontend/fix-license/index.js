import { readdirSync, copyFileSync, existsSync, statSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILE_NAMES = ["DataGridPro.js", "DataGridPro.mjs"];
const SOURCE_DIR = __dirname;
const TARGET_DIR = join(__dirname, "..", "node_modules", "@mui", "x-data-grid-pro", "DataGridPro");



function main() {
  if (!existsSync(TARGET_DIR) || !statSync(TARGET_DIR).isDirectory()) {
    console.error(`Целевой путь не найден или не является директорией: ${TARGET_DIR}`);
    process.exit(1);
  }

  let replaced = 0;

  for (const name of FILE_NAMES) {
    const sourcePath = join(SOURCE_DIR, name);
    const targetPath = join(TARGET_DIR, name);

    if (!existsSync(sourcePath)) {
      console.warn(`Пропуск: исходный файл не найден — ${sourcePath}`);
      continue;
    }

    if (!existsSync(targetPath)) {
      console.warn(`Пропуск: целевой файл не найден — ${targetPath}`);
      continue;
    }

    copyFileSync(sourcePath, targetPath);
    console.log(`Заменён: ${targetPath}`);
    replaced += 1;
  }

  console.log(`Готово. Заменено файлов: ${replaced} из ${FILE_NAMES.length}.`);
}

main();
