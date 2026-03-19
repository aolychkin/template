# Initial Project Setup - Requirements

## Overview

Этот spec описывает шаги для первоначальной настройки проекта на базе fullstack-grpc шаблона.

## Glossary

- **YC** - Yandex Cloud
- **Lockbox** - YC сервис для хранения секретов
- **Serverless Container** - YC сервис для запуска контейнеров
- **API Gateway** - YC сервис для маршрутизации HTTP/gRPC запросов
- **Object Storage** - YC S3-совместимое хранилище

---

## 1. Инфраструктура YC

### 1.1 Создание ресурсов

**User Story:** Как разработчик, я хочу создать необходимые ресурсы в YC, чтобы развернуть приложение.

**Acceptance Criteria:**
- 1.1.1 WHEN разработчик запускает скрипт `1-initial-deploy.sh` THE System SHALL создать Container Registry
- 1.1.2 WHEN разработчик запускает скрипт THE System SHALL создать Serverless Container для stage
- 1.1.3 WHEN разработчик запускает скрипт THE System SHALL создать API Gateway для stage
- 1.1.4 WHEN разработчик запускает скрипт THE System SHALL создать S3 bucket для frontend (stage)
- 1.1.5 WHEN разработчик запускает скрипт THE System SHALL создать Lockbox секрет

### 1.2 Настройка PostgreSQL

**User Story:** Как разработчик, я хочу настроить базу данных, чтобы хранить данные приложения.

**Acceptance Criteria:**
- 1.2.1 WHEN разработчик создаёт Managed PostgreSQL THE System SHALL иметь две базы: stage и production
- 1.2.2 WHEN разработчик добавляет DATABASE_URL в Lockbox THE System SHALL использовать SSL соединение
- 1.2.3 WHEN разработчик запускает миграции THE System SHALL создать все необходимые таблицы

---

## 2. Конфигурация проекта

### 2.1 Переименование проекта

**User Story:** Как разработчик, я хочу переименовать проект под свои нужды.

**Acceptance Criteria:**
- 2.1.1 WHEN разработчик меняет PROJECT_NAME в скриптах THE System SHALL использовать новое имя для всех ресурсов
- 2.1.2 WHEN разработчик обновляет product.md THE System SHALL отражать название и описание проекта
- 2.1.3 WHEN разработчик обновляет package.json THE System SHALL содержать правильное имя пакета
- 2.1.4 WHEN разработчик устанавливает VITE_APP_NAME в .env THE System SHALL использовать его как префикс для cookies (изоляция между проектами на localhost)

### 2.2 Настройка секретов

**User Story:** Как разработчик, я хочу настроить секреты, чтобы приложение работало безопасно.

**Acceptance Criteria:**
- 2.2.1 WHEN разработчик генерирует JWT_SECRET THE System SHALL использовать криптографически стойкий ключ (минимум 32 байта)
- 2.2.2 WHEN разработчик генерирует ENCRYPTION_KEY THE System SHALL использовать 32-байтный ключ для AES-256
- 2.2.3 WHEN разработчик добавляет секреты в Lockbox THE System SHALL не хранить секреты в .env файлах

---

## 3. Первый деплой

### 3.1 Backend

**User Story:** Как разработчик, я хочу задеплоить backend, чтобы API было доступно.

**Acceptance Criteria:**
- 3.1.1 WHEN разработчик запускает `task deploy` THE System SHALL собрать Docker образ
- 3.1.2 WHEN разработчик запускает `task deploy` THE System SHALL загрузить образ в Container Registry
- 3.1.3 WHEN разработчик запускает `task deploy` THE System SHALL обновить Serverless Container
- 3.1.4 WHEN контейнер запускается THE System SHALL слушать порт 8080

### 3.2 Frontend

**User Story:** Как разработчик, я хочу задеплоить frontend, чтобы UI было доступно.

**Acceptance Criteria:**
- 3.2.1 WHEN разработчик запускает `deploy-frontend.sh` THE System SHALL собрать production bundle
- 3.2.2 WHEN разработчик запускает `deploy-frontend.sh` THE System SHALL загрузить файлы в S3 bucket
- 3.2.3 WHEN S3 bucket настроен THE System SHALL поддерживать SPA routing (index.html для всех путей)

---

## 4. Проверка работоспособности

### 4.1 Health checks

**User Story:** Как разработчик, я хочу проверить что всё работает.

**Acceptance Criteria:**
- 4.1.1 WHEN разработчик вызывает /health THE System SHALL вернуть 200 OK
- 4.1.2 WHEN разработчик открывает frontend URL THE System SHALL показать страницу входа
- 4.1.3 WHEN разработчик пытается войти THE System SHALL успешно аутентифицировать тестового пользователя
