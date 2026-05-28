# Установка и запуск `registry-functions` на macOS

Полная инструкция: от свежего Mac'а до запущенного приложения с открытым
браузером. Шаги выполняются один за другим.

---

## 1. Установить системные зависимости

### 1.1 Homebrew (если ещё нет)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1.2 Node.js + pnpm

```bash
brew install node
corepack enable
corepack prepare pnpm@10.33.2 --activate
```

Проверка:

```bash
node --version       # должно быть v22+
pnpm --version       # должно быть 10.33.2
```

### 1.3 MySQL (или MariaDB — оба подходят)

```bash
brew install mysql
brew services start mysql
```

Проверка:

```bash
brew services list | grep mysql      # статус "started"
```

---

## 2. Создать БД и пользователя

> ⚠️ **Важно для MySQL 8**: проект использует MariaDB-совместимый
> Node-драйвер. Указываем `mysql_native_password` явно, иначе
> `ER_NOT_SUPPORTED_AUTH_MODE` или `Authentication plugin
'caching_sha2_password' cannot be loaded`.

```bash
mysql -uroot <<'EOF'
CREATE DATABASE fts_functions CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'registry'@'localhost' IDENTIFIED WITH mysql_native_password BY 'changeme';
GRANT ALL PRIVILEGES ON fts_functions.* TO 'registry'@'localhost';
FLUSH PRIVILEGES;
EOF
```

(Пароль `changeme` поменять на свой и потом подставить в `.env`.)

Если у root уже есть пароль:

```bash
mysql -uroot -p < init.sql
```

---

## 3. Распаковать проект и установить зависимости

```bash
unzip registry-functions-*.zip
cd registry-functions
pnpm install
```

`pnpm install` автоматически:

- сгенерирует Prisma Client (через `postinstall` в `apps/api`)
- соберёт `packages/shared/dist/` (через `postinstall` в `packages/shared`)

Никаких дополнительных команд после `pnpm install` не нужно.

---

## 4. Настроить переменные окружения

```bash
cp apps/api/.env.example apps/api/.env
```

Открыть `apps/api/.env` в любом редакторе и проставить:

```
DATABASE_USER=registry
DATABASE_PASSWORD=changeme
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_NAME=fts_functions
```

Остальные ключи (`NODE_*`, `JWT_*`, `THROTTLE_*`) уже есть в `.env.example`
с разумными дефолтами для локалки — можно не трогать.

---

## 5. Применить миграции и засеять БД

```bash
pnpm db:setup
```

Это сделает `db:migrate` (применит все миграции из `apps/api/db/migrations/`)
и затем `db:seed` (наполнит таблицы `Type` и `User` стартовыми данными).

Если хочется по отдельности:

```bash
pnpm db:migrate     # только миграции
pnpm db:seed        # только сидинг
```

---

## 6. Запустить приложение

Один терминал, оба сервиса параллельно:

```bash
pnpm dev
```

Или по отдельности (в разных терминалах):

```bash
pnpm dev:api        # NestJS на http://localhost:3000
pnpm dev:web        # Vite на http://localhost:8787
```

Открыть в браузере:

| URL                             | Что          |
| ------------------------------- | ------------ |
| http://localhost:8787/          | приложение   |
| http://localhost:3000/api/docs  | Swagger UI   |
| http://localhost:3000/v1/health | health-check |

---

## Полный список команд (из корня проекта)

### Разработка

```bash
pnpm dev               # оба сервиса
pnpm dev:api           # только бэк
pnpm dev:web           # только фронт
pnpm dev:debug         # бэк с отладчиком (порт 9229)
```

### Сборка

```bash
pnpm build             # все воркспейсы
pnpm build:api         # только бэк
pnpm build:web         # только фронт
pnpm build:shared      # только shared
pnpm preview           # запустить prod-build фронта
pnpm start             # запустить prod-build бэка
```

### Качество

```bash
pnpm check             # tsc по всем
pnpm check:api / check:web
pnpm lint              # ESLint по всем
pnpm lint:fix          # ESLint --fix
pnpm lint:api / lint:web
pnpm format            # prettier --write
pnpm knip              # неиспользуемые зависимости / экспорты
```

### Тесты

```bash
pnpm test              # все unit-тесты (api + web)
pnpm test:e2e          # все e2e
pnpm test:cov          # с coverage отчётом
pnpm test:watch        # watch mode для всех

pnpm api:test          # только api unit
pnpm api:test:watch
pnpm api:test:cov
pnpm api:test:e2e      # api e2e (нужна работающая БД)
pnpm api:test:debug    # с отладчиком

pnpm web:test          # только web unit
pnpm web:test:watch
pnpm web:test:cov      # с coverage
pnpm web:test:ui       # Vitest UI
pnpm web:test:e2e      # Playwright e2e
pnpm web:test:e2e:ui   # Playwright UI mode
pnpm web:test:e2e:report
```

### База данных (Prisma)

```bash
pnpm db:setup          # = db:migrate + db:seed
pnpm db:migrate        # применить миграции
pnpm db:dev            # создать новую миграцию из изменений schema.prisma
pnpm db:seed           # засеять Type + User
pnpm db:reset          # снести БД и пересоздать (УДАЛИТ ВСЁ)
pnpm db:status         # статус миграций
pnpm db:gen            # перегенерировать Prisma Client
pnpm db:studio         # открыть Prisma Studio в браузере
pnpm db:format         # форматировать schema.prisma
pnpm db:validate       # проверить schema.prisma
```

### Деплой

```bash
pnpm deploy:cats       # на cats-сервер (Linux + systemd)
pnpm deploy:fts        # на fts-server (Windows + nssm)
```

### Утилиты

```bash
pnpm setup             # = pnpm install + pnpm db:setup (для свежего клона)
pnpm fresh             # снести node_modules + dist + .turbo, переустановить
pnpm secret:generate   # сгенерить случайный JWT secret
pnpm web:codegen       # перегенерировать RTK Query из OpenAPI
```

---

## Если что-то не работает

| Проблема                                                                                                 | Решение                                                                                                                         |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm: command not found`                                                                                | `corepack enable`, перезапустить терминал                                                                                       |
| `brew: command not found`                                                                                | Не установлен Homebrew — см. шаг 1.1                                                                                            |
| `Failed to resolve entry for package "@registry/shared"`                                                 | `pnpm build:shared` (или `pnpm install` заново)                                                                                 |
| `Access denied for user 'registry'` или `Authentication plugin 'caching_sha2_password' cannot be loaded` | MySQL 8 auth-plugin: `ALTER USER 'registry'@'localhost' IDENTIFIED WITH mysql_native_password BY 'changeme'; FLUSH PRIVILEGES;` |
| `Cannot find module '@prisma/client'`                                                                    | `pnpm install` (тригернёт postinstall с `prisma generate`)                                                                      |
| `Argument "url" is missing in data source block "db"`                                                    | В `apps/api/.env` нет `DATABASE_USER`/`PASSWORD`/`HOST`/`PORT`/`NAME`. URL собирается из них автоматически                      |
| `Port 3000 / 8787 already in use`                                                                        | `lsof -ti:3000 \| xargs kill -9` (заменить порт)                                                                                |
| `tsc` ругается на Zod в `AddItemForm.tsx` / `useFunctionForm.ts`                                         | Известный баг (Zod 3 ↔ 4 коллизия через `knip`) — задокументирован в коде, сборка проходит                                      |
| MySQL не запускается                                                                                     | `brew services restart mysql`; логи: `tail -f /opt/homebrew/var/mysql/*.err`                                                    |
| Хочется снести всё и переустановить                                                                      | `pnpm fresh`, потом снова `pnpm install`                                                                                        |
| Backend стартует, но 500 на любом запросе                                                                | Проверить что `pnpm db:setup` отработал (миграции + сидинг применены)                                                           |
| Frontend крашится с "Cannot read properties of undefined" в AddItemForm                                  | Это сегодняшний фикс — обновись до последнего HEAD (есть регрессионные тесты)                                                   |

---

## Документация проекта

- `README.md` — обзор + быстрый старт
- `docs/architecture.md` — слои, поток запросов, ER-диаграмма
- `docs/patterns.md` — библиотека из 33 классов кода-смеллов с примерами
- `docs/quality-scorecard.md` — внутренний аудит качества
- `docs/improvement-potential.md` — приоритизированный roadmap
- `docs/refactor-journey.md` — история рефакторинга
- `docs/known-limitations.md` — что не реализовано и что разблокирует каждый пункт
- `docs/open-questions.md` — вопросы требующие решения тимлида
- `CONTRIBUTING.md` — соглашения и пример "как добавить фичу"
