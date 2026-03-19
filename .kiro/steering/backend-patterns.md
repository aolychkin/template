---
inclusion: fileMatch
fileMatchPattern: "**/*.go"
---

# Backend Guide - Go + gRPC + GORM

## 🏗️ Архитектура (Clean Architecture)

```
cmd → grpc (handlers) → services (логика) → storage (БД)
                              ↓
                         domain (модели)
```

## 📁 Структура

```
internal/
├── domain/models/             # GORM модели
├── grpc/service/              # gRPC handlers + converters
├── services/service/          # Бизнес-логика
├── storage/postgres/          # БД реализация (PostgreSQL)
└── lib/                       # Утилиты
    ├── auth/                  # JWT, bcrypt, SHA256
    ├── validate/              # Бизнес-правила + SQL injection protection
    ├── errutil/               # Стратегии обработки
    └── interceptors/          # gRPC middleware
```

## 🎯 Модели (GORM)

### Base
```go
type Base struct {
    ID        string     `gorm:"type:uuid;primary_key"`
    CreatedAt time.Time
    UpdatedAt time.Time
    DeletedAt *time.Time `sql:"index"`
}

func (b *Base) BeforeCreate(tx *gorm.DB) error {
    b.ID = uuid.New().String()
    return nil
}
```

## ⚡ GORM Best Practices

### Preload с лимитами
```go
db.Preload("Relations", func(db *gorm.DB) *gorm.DB {
    return db.Order("created_at DESC").Limit(50)
}).First(&item, "id = ?", id)
```

### Context timeouts
```go
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
result, err := s.storage.GetItem(ctx, id)
```

## 🔧 gRPC Handlers

### Паттерн handler
```go
func (s *API) Method(ctx context.Context, req *pb.Request) (*pb.Response, error) {
    // 1. Валидация сервера
    if err := s.validateServer(); err != nil {
        return nil, err
    }
    
    // 2. Валидация входных данных
    if err := validateRequiredFields(map[string]string{
        "field": req.GetField(),
    }); err != nil {
        return nil, err
    }
    
    // 3. Timeout
    ctx, cancel, err := withTimeout(ctx, 5*time.Second)
    if err != nil {
        return nil, err
    }
    defer cancel()
    
    // 4. Бизнес-логика
    result, err := s.service.DoSomething(ctx, req.GetField())
    if err != nil {
        s.log.Error("failed", slog.String("error", err.Error()))
        return nil, status.Error(codes.Internal, "operation failed")
    }
    
    // 5. Конвертация
    return &pb.Response{Item: s.itemToProto(result)}, nil
}
```

## 🔒 Обработка ошибок (3 уровня)

### 1. lib/validate - ЧТО проверять
```go
validate.Email("test@test.com")           // error или nil
validate.RequiredFields(map[string]string{...}) // error или nil
```

### 2. lib/errutil - КАК обрабатывать
```go
// Критичные (panic)
errutil.Must(err)
db := errutil.MustWithValue(gorm.Open(...))

// Некритичные (log + return)
return errutil.LogError(log, "msg", err)
```

### 3. grpc/validation - gRPC helpers
```go
validateServer()                    // s.log, s.service != nil
withTimeout(ctx, 5*time.Second)     // context с timeout
validateRequiredFields(fields)      // обязательные поля
```

## 🛡️ Security

### Аутентификация
- JWT access (15 мин) + refresh (7 дней)
- Bcrypt пароли (cost 12)
- SHA256 refresh tokens
- Account lockout (5 попыток, 15 мин)

### Защита
- Rate limiting
- CORS whitelist
- SQL injection (GORM prepared statements)
- CSRF tokens (критичные операции)

### Правила
- Всегда валидируй входные данные
- Nil checks везде
- Generic error messages клиенту
- Логируй с контекстом
- Context timeouts везде

## 📊 Logging

```go
// Используй structured logging с slog
log := logger.FromContext(ctx, s.logger)

// Логируй с контекстом
log.Info("user created",
    slog.String("user_id", user.ID.String()),
    slog.String("email", user.Email))

// Ошибки с деталями
log.Error("failed to create user",
    slog.String("error", err.Error()),
    slog.String("email", req.GetEmail()))

// НЕ логируй чувствительные данные
// ❌ log.Info("login", slog.String("password", password))
// ❌ log.Info("user", slog.String("passport", passport))
```

## 🐘 PostgreSQL Specifics

### Connection Pool (Serverless-optimized)
```go
sqlDB, _ := db.DB()
sqlDB.SetMaxOpenConns(10)       // Serverless-optimized
sqlDB.SetMaxIdleConns(5)
sqlDB.SetConnMaxLifetime(time.Hour)
```

## 🎯 Best Practices

1. **Context timeout** везде (5-10s)
2. **Preload с лимитами** (избежать N+1)
3. **Handlers тонкие** - логика в services
4. **Валидация 3 уровня** - validate → errutil → grpc
5. **Security первым** - всегда проверяй входные данные
6. **Логирование** с контекстом (slog)
