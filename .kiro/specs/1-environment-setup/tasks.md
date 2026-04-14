# Настройка окружения разработчика — Tasks

## Task List

### 1. Определение ОС

- [ ] 1.1 Спросить у разработчика какая ОС: macOS, Linux, Windows
- [ ] 1.2 Создать файл `.kiro/settings/environment.json` с полями `os`, `shell`, `scriptExtension`
- [ ] 1.3 Добавить `.kiro/settings/` в корневой `.gitignore`

### 2. Проверка и установка инструментов

- [ ] 2.1 Запустить скрипт установки:
  - macOS/Linux: `bash scripts/install-tools.sh`
  - Windows: `powershell scripts/install-tools.ps1`
- [ ] 2.2 Скрипт автоматически проверит и предложит установить:
  - (macOS) Homebrew
  - Node.js (v20+)
  - Yarn
  - Go (v1.22+)
  - Task (go-task)
  - Docker и Docker Compose
  - protoc
  - buf
  - jq (опционально)
- [ ] 2.3 (Опционально) Установить YC CLI — нужен только для yc-setup

### 3. Обновление tech.md

- [ ] 3.1 В `.kiro/steering/tech.md` после строки `## Stack` добавить секцию:
  ```markdown
  ## Операционная система
  
  **ОС:** {выбранная ОС}
  **Shell:** {bash или powershell}
  **Скрипты:** {.sh или .ps1}
  ```
- [ ] 3.2 (Windows) В `.kiro/steering/tech.md` секция `## Commands` — заменить все `bash` примеры на PowerShell:
  - `cd frontend && task dev` → `cd frontend; task dev`
  - `bash scripts/install-tools.sh` → `powershell scripts/install-tools.ps1`
  - Все `.sh` ссылки → `.ps1`

### 4. PowerShell скрипты (УЖЕ СОЗДАНЫ)

- [x] 4.1 `backend/deployment/scripts/1-initial-deploy.ps1` — создан
- [x] 4.2 `backend/deployment/scripts/2-setup-stage.ps1` — создан
- [x] 4.3 `backend/deployment/scripts/update-container.ps1` — создан
- [x] 4.4 `frontend/deployment/scripts/deploy-frontend.ps1` — создан

### 5. Taskfile совместимость (Windows)

- [ ] 5.1 Добавить `migrate:win` в `backend/Taskfile.yml`
- [ ] 5.2 Добавить `kill:win` в `backend/Taskfile.yml`
- [ ] 5.3 Добавить `migrate:stage:win` в `backend/Taskfile.yml`
- [ ] 5.4 Добавить `migrate:prod:win` в `backend/Taskfile.yml`

### 6. Проверка готовности

- [ ] 6.1 Запустить проверку всех Required_Tools — вывести статус каждого
- [ ] 6.2 Проверить минимальные версии: Node.js >= 20, Go >= 1.22
- [ ] 6.3 Вывести итог: "Окружение готово, переходите к initial-setup" или список недостающих инструментов

---

## Notes

- Эта спека выполняется ПЕРВОЙ, до всех остальных
- PowerShell скрипты (задачи 4.x) создаются для ВСЕХ ОС — хранятся в репозитории
- Taskfile :win задачи (задачи 5.x) создаются для ВСЕХ ОС — хранятся в репозитории
- Команды установки зависят от ОС: brew (macOS), apt/snap (Linux), winget/choco (Windows)
- YC CLI опционален — нужен только если разработчик пойдёт в yc-setup
- После завершения → переход к `initial-setup`
