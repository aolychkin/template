# Initial Project Setup - Requirements

## Overview

Этот spec описывает шаги для первоначальной настройки проекта на базе fullstack-grpc шаблона. Спека покрывает ТОЛЬКО общую инициализацию, не зависящую от выбора окружения (YC или Local).

После выполнения этой спеки разработчик выбирает одну из двух спек:
- `yc-setup` — настройка облачного окружения (Yandex Cloud)
- `local-development-support` — настройка локального окружения (docker-compose + локальный бекенд)

### Связь со спеками

```
Спека 1: environment-setup (ОС, зависимости, shell)
    └── Спека 2: initial-setup (общая инициализация) ← ЭТА СПЕКА
        ├── Спека 3.1: yc-setup (облачное окружение)       ← по выбору
        └── Спека 3.2: local-development-support (локальное окружение) ← по выбору
```

## Glossary

- **PROJECT_NAME** — имя проекта, заменяющее `my-project` во всех конфигурациях
- **Steering_Files** — файлы в `.kiro/steering/`, описывающие правила и архитектуру проекта
- **VITE_APP_NAME** — переменная окружения, используемая как префикс для cookies (изоляция между проектами на localhost)

---

## 1. Переименование проекта

### 1.1 Замена PROJECT_NAME

**User Story:** Как разработчик, я хочу переименовать проект под свои нужды, чтобы все конфигурации использовали правильное имя.

**Acceptance Criteria:**
- 1.1.1 WHEN разработчик меняет PROJECT_NAME в скриптах THE System SHALL использовать новое имя для всех ресурсов
- 1.1.2 WHEN разработчик обновляет `package.json` THE System SHALL содержать правильное имя пакета
- 1.1.3 WHEN разработчик обновляет `backend/Taskfile.yml` THE System SHALL содержать правильное имя в переменной `LOCKBOX_SECRET`
- 1.1.4 WHEN разработчик обновляет deployment скрипты (.sh И .ps1) THE System SHALL содержать правильное имя в переменной `PROJECT_NAME`
- 1.1.5 WHEN разработчик обновляет `backend/go.mod` THE System SHALL содержать правильное имя модуля (если нужно)

### 1.2 Обновление steering-файлов

**User Story:** Как разработчик, я хочу обновить steering-файлы, чтобы Kiro знал контекст проекта.

**Acceptance Criteria:**
- 1.2.1 WHEN разработчик обновляет `product.md` THE System SHALL отражать название и описание проекта
- 1.2.2 WHEN разработчик обновляет `tech.md` THE System SHALL содержать актуальное имя проекта

---

## 2. Установка зависимостей проекта

### 2.1 Загрузка пакетов

**User Story:** Как разработчик, я хочу установить все зависимости проекта, чтобы он компилировался и работал.

**Acceptance Criteria:**
- 2.1.1 WHEN разработчик запускает `go mod download` в backend THE System SHALL загрузить все Go зависимости
- 2.1.2 WHEN разработчик запускает `yarn install` в frontend THE System SHALL установить все npm зависимости
- 2.1.3 WHEN разработчик запускает `yarn install` в contract THE System SHALL установить зависимости для proto генерации
- 2.1.4 WHEN разработчик запускает `task generate` в contract THE System SHALL сгенерировать gRPC типы для backend (Go) и frontend (TypeScript)

---

## 3. Конфигурация проекта

### 3.1 Настройка переменных окружения

**User Story:** Как разработчик, я хочу настроить базовые переменные окружения, чтобы проект корректно работал.

**Acceptance Criteria:**
- 3.1.1 WHEN разработчик устанавливает VITE_APP_NAME в frontend `.env` THE System SHALL использовать его как префикс для cookies (изоляция между проектами на localhost)

---

## 4. Проверка базовой работоспособности

### 4.1 Компиляция

**User Story:** Как разработчик, я хочу убедиться что проект компилируется после переименования.

**Acceptance Criteria:**
- 4.1.1 WHEN разработчик запускает `go build` THE System SHALL успешно скомпилировать backend
- 4.1.2 WHEN разработчик запускает `yarn type-check` THE System SHALL успешно проверить типы frontend
- 4.1.3 WHEN разработчик запускает `yarn lint` THE System SHALL не показать ошибок линтера

---

## 5. Выбор окружения

### 5.1 Инструкция по следующему шагу

**User Story:** Как разработчик, я хочу понимать какой следующий шаг после общей инициализации.

**Acceptance Criteria:**
- 5.1.1 WHEN разработчик завершает initial-setup THE System SHALL вывести инструкцию с выбором: выполнить `yc-setup` (облачное окружение) или `local-development-support` (локальное окружение)
- 5.1.2 THE System SHALL описать разницу между режимами: YC требует аккаунт Yandex Cloud, Local работает полностью на машине разработчика
