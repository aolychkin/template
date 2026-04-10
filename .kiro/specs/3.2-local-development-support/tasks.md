# Поддержка локальной разработки — Tasks

## Task List

### 1. Docker Compose для локальной БД

- [ ] 1.1 Создать `docker-compose.yml` в корне проекта с PostgreSQL 16, volume, healthcheck, порт 5432
- [ ] 1.2 Добавить `docker-compose.yml` в корневой `.gitignore`

### 2. Environment Config

- [ ] 2.1 Создать `backend/.env` — копия `backend/.env.example` (DATABASE_URL уже на localhost:5432)
- [ ] 2.2 Создать `frontend/.env` — копия `frontend/.env.example` (VITE_GRPC_HOST уже на localhost:44044)
- [ ] 2.3 Проверить что `backend/.env` в `backend/.gitignore` (уже есть)
- [ ] 2.4 Проверить что `frontend/.env` в `frontend/.gitignore` (уже есть)

### 3. Корневой Taskfile

- [ ] 3.1 Создать корневой `Taskfile.yml` с задачами:
  - `local:up` — запуск docker-compose + ожидание healthcheck
  - `local:down` — остановка docker-compose
  - `local:reset` — пересоздание БД (down -v + up -d)

### 4. Миграции для локальной БД

- [ ] 4.1 Добавить задачу `migrate:local` в `backend/Taskfile.yml` с `dotenv: [.env]` для автоматического чтения DATABASE_URL из .env

### 5. Обновление Steering-файлов

- [ ] 5.1 Обновить `tech.md`:
  - Добавить строку `local` в таблицу окружений (backend localhost:44044, БД localhost:5432)
  - Убрать "Backend НИКОГДА не запускается локально"
  - Добавить `cd backend && task dev` в секцию Commands
- [ ] 5.2 Обновить `structure.md`:
  - Добавить `docker-compose.yml` в корневую структуру
  - Добавить корневой `Taskfile.yml` в структуру

### 6. Проверка (выполнять последовательно)

- [ ] 6.1 Запустить `task local:up` — PostgreSQL доступен
- [ ] 6.2 Запустить `cd backend && task migrate:local` — таблицы созданы
- [ ] 6.3 Запустить `cd backend && task seed` — данные заполнены
- [ ] 6.4 Запустить `cd backend && task dev` — сервер стартует на :44044 (оставить запущенным)
- [ ] 6.5 В новом терминале: `cd frontend && task dev` — фронтенд открывается на :3000 и подключается к локальному бекенду
- [ ] 6.6 Открыть http://localhost:3000 в браузере — страница входа отображается
- [ ] 6.7 Войти тестовым пользователем (из seed данных)

---

## Notes

- Предполагается что `initial-setup` уже выполнен (проект переименован)
- Docker и docker-compose должны быть установлены на машине разработчика
- Все дефолтные значения в `.env.example` уже настроены на localhost — копирование достаточно
- `task migrate` (без :local) по-прежнему требует явный DATABASE_URL — для обратной совместимости с YC
