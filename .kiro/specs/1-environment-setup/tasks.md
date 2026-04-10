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

- [ ] 3.1 Добавить секцию "Операционная система" в `tech.md` с выбранной ОС, shell и типом скриптов
- [ ] 3.2 (Windows) Обновить секцию Commands в `tech.md` на PowerShell формат

### 4. Создание PowerShell скриптов

- [ ] 4.1 Создать `backend/deployment/scripts/1-initial-deploy.ps1` — PowerShell версия 1-initial-deploy.sh
- [ ] 4.2 Создать `backend/deployment/scripts/2-setup-stage.ps1` — PowerShell версия 2-setup-stage.sh
- [ ] 4.3 Создать `backend/deployment/scripts/update-container.ps1` — PowerShell версия update-container.sh
- [ ] 4.4 Создать `frontend/deployment/scripts/deploy-frontend.ps1` — PowerShell версия deploy-frontend.sh

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
