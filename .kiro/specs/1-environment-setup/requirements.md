# Настройка окружения разработчика — Requirements

## Введение

Шаблон проекта должен поддерживать разработку на разных операционных системах (macOS, Linux, Windows). Выбор ОС влияет на то, какие скрипты используются (.sh или .ps1/PowerShell), какие команды доступны, и как устанавливаются зависимости.

Эта спека — первый шаг при работе с шаблоном. Определяет ОС разработчика, устанавливает необходимые инструменты, создаёт PowerShell-версии скриптов, сохраняет конфигурацию в `.kiro/settings/`, и обновляет steering-файлы.

### Связь со спеками

```
Спека 1: environment-setup (ОС, зависимости, shell) ← ЭТА СПЕКА
    └── Спека 2: initial-setup (переименование, общая инициализация)
        ├── Спека 3.1: yc-setup (облачное окружение)       ← по выбору
        └── Спека 3.2: local-development-support (локальное окружение) ← по выбору
```

## Глоссарий

- **OS_Config** — файл `.kiro/settings/environment.json`, хранящий выбранную ОС и тип shell
- **Shell_Type** — тип командной оболочки: `bash` (macOS/Linux) или `powershell` (Windows)
- **Script_Type** — тип скриптов: `.sh` (bash) или `.ps1` (PowerShell)
- **Required_Tools** — набор инструментов, необходимых для работы с проектом

---

## Требования

### Требование 1: Определение ОС разработчика

**User Story:** Как разработчик, я хочу указать свою операционную систему при первоначальной настройке, чтобы все инструкции и скрипты соответствовали моему окружению.

#### Acceptance Criteria

1. WHEN разработчик начинает настройку проекта, THE System SHALL спросить какая у него операционная система с вариантами: macOS, Linux, Windows
2. WHEN разработчик выбирает ОС, THE System SHALL определить Shell_Type: `bash` для macOS/Linux, `powershell` для Windows
3. WHEN разработчик выбирает ОС, THE System SHALL определить Script_Type: `.sh` для macOS/Linux, `.ps1` для Windows

### Требование 2: Сохранение конфигурации окружения

**User Story:** Как разработчик, я хочу чтобы выбор ОС сохранялся в проекте, чтобы Kiro всегда знал какие команды использовать.

#### Acceptance Criteria

1. WHEN разработчик выбирает ОС, THE System SHALL создать файл `.kiro/settings/environment.json` с полями: `os` (macos/linux/windows), `shell` (bash/powershell), `scriptExtension` (.sh/.ps1)
2. WHEN файл OS_Config уже существует, THE System SHALL предложить обновить его
3. THE System SHALL добавить `.kiro/settings/` в `.gitignore` (настройки индивидуальны для каждого разработчика)

### Требование 3: Установка необходимых инструментов

**User Story:** Как разработчик, я хочу получить пошаговую инструкцию по установке всех необходимых инструментов, чтобы не искать их самостоятельно.

#### Acceptance Criteria

1. THE System SHALL проверить наличие каждого Required_Tool и вывести статус (установлен / не установлен)
2. WHEN инструмент не установлен, THE System SHALL вывести команду установки для выбранной ОС
3. THE Required_Tools SHALL включать:
  - **Homebrew** (только macOS) — пакетный менеджер для установки остальных инструментов
  - **Node.js** (v20+) — для frontend
  - **Yarn** — пакетный менеджер frontend
  - **Go** (v1.22+) — для backend
  - **Task** (go-task) — таск-раннер для backend, frontend, contract
  - **Docker** и **Docker Compose** — для контейнеризации
  - **Protobuf compiler** (protoc) — для генерации gRPC кода
  - **protoc-gen-go** — Go плагин для protoc (генерация Go кода из proto)
  - **protoc-gen-go-grpc** — Go gRPC плагин для protoc
  - **protoc-gen-grpc-web** — gRPC-Web плагин для protoc (генерация TypeScript кода)
  - **buf** — линтер и генератор proto
  - **jq** — парсер JSON (используется в deployment скриптах)
  - **YC CLI** — Yandex Cloud CLI (опционально, только для yc-setup)
4. WHEN ОС = macOS, THE System SHALL проверить наличие Homebrew и предлагать установку инструментов через `brew`
5. WHEN ОС = Linux, THE System SHALL предлагать установку через `apt`/`snap` или прямые ссылки
6. WHEN ОС = Windows, THE System SHALL предлагать установку через `winget`, `choco` или прямые ссылки

### Требование 4: Обновление tech.md

**User Story:** Как разработчик, я хочу чтобы tech.md содержал информацию о моей ОС, чтобы Kiro давал правильные команды.

#### Acceptance Criteria

1. WHEN разработчик выбирает ОС, THE System SHALL добавить в `tech.md` секцию с информацией об ОС и shell
2. WHEN ОС = Windows, THE System SHALL обновить секцию Commands в `tech.md`: все примеры команд в формате PowerShell
3. WHEN ОС = macOS или Linux, THE System SHALL сохранить секцию Commands в `tech.md` в формате bash (текущее поведение)

### Требование 5: PowerShell-версии скриптов

**User Story:** Как разработчик, я хочу иметь PowerShell-версии всех deployment скриптов, чтобы проект поддерживал Windows из коробки.

#### Acceptance Criteria

1. THE System SHALL создать PowerShell-версии (.ps1) для всех .sh скриптов:
  - `backend/deployment/scripts/1-initial-deploy.ps1`
  - `backend/deployment/scripts/2-setup-stage.ps1`
  - `backend/deployment/scripts/update-container.ps1`
  - `frontend/deployment/scripts/deploy-frontend.ps1`
2. THE PowerShell-скрипты SHALL выполнять ту же логику что и .sh версии
3. THE PowerShell-скрипты SHALL использовать `$ErrorActionPreference = "Stop"` для аналога `set -e`
4. THE .ps1 скрипты SHALL храниться в репозитории рядом с .sh версиями (не генерироваться динамически)

### Требование 6: Taskfile совместимость с Windows

**User Story:** Как Windows-разработчик, я хочу чтобы Taskfile команды работали на моей ОС.

#### Acceptance Criteria

1. WHEN команда в Taskfile использует bash-специфичный синтаксис (pipe, `if [ ... ]`, `lsof`), THE System SHALL добавить альтернативную задачу с суффиксом `:win`
2. THE System SHALL добавить `:win` версии для задач: `migrate`, `migrate:stage`, `migrate:prod`, `kill`
3. THE `:win` задачи SHALL использовать PowerShell синтаксис

### Требование 7: Проверка готовности окружения

**User Story:** Как разработчик, я хочу убедиться что всё установлено правильно перед переходом к следующему шагу.

#### Acceptance Criteria

1. WHEN все Required_Tools установлены, THE System SHALL вывести сообщение "Окружение готово" и предложить перейти к `initial-setup`
2. WHEN какой-то Required_Tool не установлен, THE System SHALL вывести список недостающих инструментов и НЕ предлагать переход к следующему шагу
3. THE System SHALL проверять минимальные версии: Node.js >= 20, Go >= 1.22
