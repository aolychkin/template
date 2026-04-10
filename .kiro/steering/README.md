---
inclusion: auto
name: steering-readme
description: Overview of steering files structure and navigation. Use when onboarding or understanding how steering files are organized.
---

# Kiro Steering - Контекст и правила проекта

> Эта папка содержит документацию которая автоматически загружается в контекст Kiro AI

## 📁 Структура

### 🎯 Всегда загружается (inclusion: always)

- **product.md** - Продукт, пользователи, фичи, статус
- **tech.md** - Стек, команды, критичные правила
- **structure.md** - Структура проекта, навигация по steering

### 📂 По типу файла (inclusion: fileMatch)

- **backend-patterns.md** - при работе с `**/*.go`
- **frontend-patterns.md** - при работе с `**/*.tsx,**/*.ts`
- **design-system.md** - при работе с `**/*.tsx`
- **architecture-invariants.md** - при работе с `**/*.go,**/*.ts,**/*.tsx`

### 🔧 По запросу (inclusion: manual)

- **quick-reference.md** - gRPC шаблоны, частые ошибки
- **decision-making.md** - алгоритм принятия решений
- **commit-checklist.md** - перед коммитом
- **grpc-workflow.md** - добавление gRPC методов
- **security-checklist.md** - security checklist
- **lessons-learned.md** - технические детали проекта
- **development-workflow.md** - workflow разработки
- **investigation-methods.md** - методы диагностики
- **yc-operations.md** - Yandex Cloud операции

## 🤖 How AI should work with steering

### Что загружается всегда
- `product.md`, `tech.md`, `structure.md` (~15KB total)
- Содержат минимальный контекст для начала работы

### Что никогда не загружается автоматически
- Все файлы с `inclusion: manual`
- Загружаются только по явному запросу через `#file-name`

### Как найти нужный файл
1. Посмотри `structure.md` → Steering Navigation
2. Используй `#file-name` в чате для загрузки

## ❌ Анти-паттерны

**НЕ ДЕЛАЙ:**
- Loading all steering files at once (перегрузка контекста)
- Copying rules into task context (дублирование)
- Modifying product.md/tech.md/structure.md без review
- Auto-loading manual files "just in case"

## 🔄 Обновление документации

### Когда обновлять

**product.md:** После завершения большой фичи, при изменении статуса
**tech.md:** При изменении стека или критичных правил
**structure.md:** При изменении структуры проекта или steering

### Как обновлять

```bash
cd .kiro
git add -A && git commit -m "docs: обновить steering" && git push
```
