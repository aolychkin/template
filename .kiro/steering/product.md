---
inclusion: always
---

# Product Overview - [PROJECT_NAME]

## Purpose

[Описание продукта и его назначения]

## Scale & Context

- **Масштаб:** [Описание масштаба проекта]
- **Аудитория:** [Целевая аудитория]
- **Язык:** Русский (код, комментарии, документация, коммиты)
- **Compliance:** [Требования к соответствию, например 152-ФЗ]

## Target Users

**Роли пользователей:**
- user — Обычный пользователь
- admin — Администратор

[Добавьте дополнительные роли по необходимости]

## Key Features

**Реализовано:**
- Auth: JWT (15 мин) + Refresh (7 дней)
- Multi-step регистрация (2 шага)
- Профили пользователей
- Security: Rate limiting, CSRF, XSS protection

**Запланировано:**
- [Feature 1] - приоритет 1
- [Feature 2] - приоритет 2
- [Feature 3] - приоритет 3

## Data Models

```
User → UserProfile (1:1, user_profiles.user_id)
User → RefreshToken (1:N, refresh_tokens.user_id)
User → RegistrationProgress (по phone, временная)
```

## Critical Requirements

- [Требование 1]
- [Требование 2]
- [Требование 3]

## Status

**Development** - В разработке
