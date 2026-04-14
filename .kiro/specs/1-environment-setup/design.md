# Настройка окружения разработчика — Design

## Architecture Overview

```
environment-setup
    │
    ├── 1. Вопрос: какая ОС?
    │   ├── macOS → bash, .sh, brew
    │   ├── Linux → bash, .sh, apt/snap
    │   └── Windows → powershell, .ps1, winget/choco
    │
    ├── 2. Сохранение в .kiro/settings/environment.json
    │
    ├── 3. Проверка и установка инструментов
    │   ├── (macOS) Homebrew
    │   ├── Node.js (v20+)
    │   ├── Yarn
    │   ├── Go (v1.22+)
    │   ├── Task (go-task)
    │   ├── Docker + Docker Compose
    │   ├── protoc
    │   ├── buf
    │   ├── jq
    │   └── YC CLI (опционально)
    │
    ├── 4. Обновление tech.md
    │   ├── Секция ОС
    │   └── Формат команд (bash / PowerShell)
    │
    ├── 5. Создание .ps1 скриптов (все ОС — хранятся в репо)
    │
    ├── 6. (Windows) Taskfile :win задачи
    │
    └── 7. Проверка готовности → переход к initial-setup
```

## Формат OS_Config

```json
// .kiro/settings/environment.json
{
  "os": "macos",           // macos | linux | windows
  "shell": "bash",         // bash | powershell
  "scriptExtension": ".sh" // .sh | .ps1
}
```

## Установка инструментов по ОС

### macOS (brew)

```bash
# Node.js
brew install node@20

# Yarn
corepack enable && corepack prepare yarn@stable --activate

# Go
brew install go

# Task
brew install go-task

# Docker
brew install --cask docker

# Protobuf
brew install protobuf

# buf
brew install bufbuild/buf/buf

# YC CLI (опционально)
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

### Linux (apt/snap)

```bash
# Node.js (через NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Yarn
corepack enable && corepack prepare yarn@stable --activate

# Go
sudo snap install go --classic
# или: wget https://go.dev/dl/go1.22.linux-amd64.tar.gz

# Task
sudo snap install task --classic
# или: sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d -b /usr/local/bin

# Docker
sudo apt-get install docker.io docker-compose-v2

# Protobuf
sudo apt-get install protobuf-compiler

# buf
# https://buf.build/docs/installation

# YC CLI (опционально)
curl -sSL https://storage.yandexcloud.net/yandexcloud-yc/install.sh | bash
```

### Windows (winget/choco)

```powershell
# Node.js
winget install OpenJS.NodeJS.LTS

# Yarn
corepack enable; corepack prepare yarn@stable --activate

# Go
winget install GoLang.Go

# Task
winget install Task.Task
# или: choco install go-task

# Docker Desktop
winget install Docker.DockerDesktop

# Protobuf
choco install protoc

# buf
# https://buf.build/docs/installation

# YC CLI (опционально)
# https://cloud.yandex.ru/docs/cli/quickstart#install
```

## Проверка установки

```bash
# Проверка всех инструментов (bash)
node --version    # >= 20.x
yarn --version    # >= 1.x
go version        # >= 1.22
task --version    # любая
docker --version  # любая
docker compose version  # любая
protoc --version  # любая
buf --version     # любая
```

```powershell
# Проверка всех инструментов (PowerShell)
node --version    # >= 20.x
yarn --version    # >= 1.x
go version        # >= 1.22
task --version    # любая
docker --version  # любая
docker compose version  # любая
protoc --version  # любая
buf --version     # любая
```

## PowerShell скрипты

Создаются .ps1 версии для ВСЕХ .sh скриптов и хранятся в репозитории:

| Bash (.sh) | PowerShell (.ps1) |
|-----------|-------------------|
| `backend/deployment/scripts/1-initial-deploy.sh` | `backend/deployment/scripts/1-initial-deploy.ps1` |
| `backend/deployment/scripts/2-setup-stage.sh` | `backend/deployment/scripts/2-setup-stage.ps1` |
| `backend/deployment/scripts/update-container.sh` | `backend/deployment/scripts/update-container.ps1` |
| `frontend/deployment/scripts/deploy-frontend.sh` | `frontend/deployment/scripts/deploy-frontend.ps1` |

### Ключевые отличия .ps1 от .sh

| Bash | PowerShell |
|------|-----------|
| `set -e` | `$ErrorActionPreference = "Stop"` |
| `echo "text"` | `Write-Host "text"` |
| `read -p "prompt" VAR` | `$VAR = Read-Host "prompt"` |
| `read -t 5 -p "prompt" VAR` | `# таймаут через отдельную логику` |
| `${VAR}` | `$VAR` |
| `$(command)` | `$(command)` (работает) |
| `if [ -z "$VAR" ]` | `if (-not $VAR)` |
| `command 2>/dev/null \|\| echo "fallback"` | `try { command } catch { Write-Host "fallback" }` |
| `jq -r '.id'` | `(ConvertFrom-Json $json).id` |
| `cd "$(dirname "$0")/../.."` | `$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path; Set-Location "$ScriptDir/../.."` |
| `lsof -ti:8080 \| xargs kill -9` | `Get-NetTCPConnection -LocalPort 8080 \| Stop-Process` |

## Taskfile :win задачи

```yaml
  migrate:win:
    desc: Миграции БД (Windows PowerShell)
    cmds:
      - powershell -Command "if (-not $env:DATABASE_URL) { Write-Error 'DATABASE_URL не установлен'; exit 1 }; go run ./cmd/migrate"

  kill:win:
    desc: Остановка backend (Windows)
    cmds:
      - powershell -Command "Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }; Get-NetTCPConnection -LocalPort 44044 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
```

## Влияние на tech.md

Добавляется секция в начало файла:

```markdown
## Операционная система

**ОС:** macOS (или Linux / Windows)
**Shell:** bash (или powershell)
**Скрипты:** .sh (или .ps1)
```

Для Windows обновляется секция Commands с PowerShell синтаксисом.

## .gitignore

Добавить в корневой `.gitignore`:
```
.kiro/settings/
```

## Correctness Properties

### Property 1: Консистентность shell
*Для любой* команды в tech.md, она ДОЛЖНА соответствовать выбранному Shell_Type из OS_Config.

**Validates:** Requirements 4

### Property 2: Функциональная эквивалентность скриптов
*Для любого* .ps1 скрипта, он ДОЛЖЕН выполнять ту же логику что и соответствующий .sh скрипт.

**Validates:** Requirements 5

### Property 3: Полнота проверки инструментов
*Для любого* Required_Tool, система ДОЛЖНА проверить его наличие и вывести статус.

**Validates:** Requirements 3, 7

## Testing Strategy

### Automated Checks
- Проверка наличия всех .ps1 файлов рядом с .sh
- Проверка что `.kiro/settings/environment.json` валидный JSON
- Проверка версий инструментов

### Manual Verification
- Запуск .ps1 скриптов на Windows
- Запуск :win задач в Taskfile на Windows
