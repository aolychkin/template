---
inclusion: fileMatch
fileMatchPattern: ["**/*.go", "**/*.ts", "**/*.tsx"]
---

# Architecture Invariants - Критичные правила системы

> Нарушение любого из этих правил может привести к production incidents.

---

## 🔴 КРИТИЧНЫЕ ИНВАРИАНТЫ (MUST NOT VIOLATE)

### 1. Single Retry Layer
**Retry существует ТОЛЬКО в frontend `withRetry`.**

```typescript
// ✅ Единственное место retry
import { withRetry } from 'shared/lib/retry';
const result = await withRetry(() => grpcClient.call(req));
```

**ОТКЛЮЧЕНО:**
- RTK Query `retry` option
- Browser fetch retry
- gRPC-Web client retry

**Почему:** Иначе получим умножение попыток (3 × 3 × 3 = 27 запросов) и thundering herd.

---

### 2. No Goroutines in Timeout Interceptor
**TimeoutInterceptor НИКОГДА не запускает goroutines.**

```go
// ✅ Правильно — только добавляем deadline
ctx, cancel := context.WithTimeout(ctx, timeout)
defer cancel()
return handler(ctx, req)

// ❌ ОПАСНО — НЕ ИСПОЛЬЗОВАТЬ
go func() {
    resp, err := handler(ctx, req)
    done <- result{resp, err}
}()
```

**Почему:** Handler продолжает работу после timeout → двойные side effects, goroutine leaks.

---

### 3. Handler Context Compliance
**Все handlers ОБЯЗАНЫ проверять `ctx.Done()` перед side effects.**

```go
// ✅ Правильно
func (s *Service) DoSomething(ctx context.Context, req *Request) error {
    // Проверяем перед DB write
    select {
    case <-ctx.Done():
        return ctx.Err()
    default:
    }
    
    return s.storage.Save(ctx, data)
}
```

**Почему:** Timeout interceptor только добавляет deadline, handler сам должен его проверять.

---

### 4. No Context Background in Handlers
**Handlers ЗАПРЕЩЕНО использовать `context.Background()` или `context.TODO()`.**

```go
// ❌ ЗАПРЕЩЕНО
ctx := context.Background()
s.storage.Save(ctx, data)

// ✅ Правильно — используем переданный ctx
s.storage.Save(ctx, data)
```

**Почему:** Теряется deadline, correlation ID, user ID из context.

---

### 5. Fixed Interceptor Order
**Порядок interceptors ФИКСИРОВАН и НЕ МОЖЕТ меняться:**

```
1. Validation (ctx, req checks)
2. Correlation (request ID)
3. Timeout (safety net)
4. Auth (user identification)
5. RateLimit (requires userID from Auth)
6. Business Logic
```

**Почему:** RateLimit зависит от userID, который устанавливает Auth. Validation первым отсекает невалидные запросы.

---

### 6. Bounded Resources
**Все caches и maps ОБЯЗАНЫ иметь size limits.**

```go
// ✅ Правильно
const (
    DefaultMaxIPVisitors   = 50000
    DefaultMaxUserVisitors = 100000
)

// ❌ ЗАПРЕЩЕНО — unbounded map
cache := make(map[string]*entry)  // без лимита!
```

**Текущие лимиты:**
- Rate limiter IP: 50,000 записей
- Rate limiter User: 100,000 записей

---

### 7. Graceful Shutdown Order
**RateLimiter.Stop() ПЕРЕД gRPC GracefulStop() ПЕРЕД HTTP Shutdown().**

```go
// ✅ Правильный порядок (см. server.go GracefulStop)
rateLimiter.Stop()          // Background goroutines
grpcServer.GracefulStop()   // Ждёт завершения текущих запросов
httpServer.Shutdown(ctx)    // Graceful drain с таймаутом (10s)
```

**Почему:** gRPC GracefulStop ждёт завершения текущих запросов, rate limiter должен быть остановлен до этого. `Shutdown(ctx)` (не `Close()`) даёт активным соединениям время завершиться.

---

### 8. Retry-CircuitBreaker Order
**`withRetry` оборачивает вызов, CircuitBreaker проверяется ВНУТРИ каждой попытки.**

```typescript
// ✅ Правильный порядок
for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // 1. Проверяем CB ПЕРЕД попыткой
    if (grpcCircuitBreaker.getState() === 'open') {
        throw new Error('Service temporarily unavailable');
    }
    
    // 2. Делаем запрос
    try {
        return await fn();
    } catch (error) {
        // 3. Retry если нужно
    }
}
```

**Почему:** Если CB открыт — не тратим попытки retry.

---

## 📍 Расположение компонентов

### Backend
| Компонент | Путь |
|-----------|------|
| Graceful Shutdown | `cmd/server/main.go` |
| Correlation ID | `internal/lib/interceptors/correlation.go` |
| Timeout Interceptor | `internal/lib/interceptors/timeout.go` |
| Auth Interceptor | `internal/lib/interceptors/auth.go` |
| Rate Limiter | `internal/lib/ratelimit/ratelimit.go` |
| Validation Interceptor | `internal/lib/interceptors/validation.go` |

### Frontend
| Компонент | Путь |
|-----------|------|
| Logger | `shared/lib/logger.ts` |
| Retry | `shared/lib/retry.ts` |
| Circuit Breaker | `shared/lib/circuit-breaker.ts` |
| Error Boundaries | `shared/ui/GlobalErrorBoundary/` |

---

## ⚖️ Explicit Tradeoffs

| Решение | Tradeoff | Почему приемлемо |
|---------|----------|------------------|
| Random eviction в rate limiter | Может выкинуть активного пользователя | O(n) vs O(n log n), редкий edge case |
| Best-effort ctx.Done() | Handler может игнорировать | Code review + testing |
| Latency logging | HTTP handler latency, не e2e | Достаточно для базовой observability |
| Unordered eviction | Не LRU, pseudo-random | O(n) vs O(n log n), достаточно для защиты памяти |

---

## 🚫 Explicit Non-Goals

Следующие возможности **НЕ реализованы** (осознанно):

- Cross-instance idempotency (Redis)
- Exactly-once semantics
- Streaming RPC
- Per-endpoint rate limits
- Per-service Circuit Breakers
- Distributed tracing (Jaeger/Zipkin)
- Prometheus metrics

---

## 🔧 Rate Limits

| Тип | Лимит | Окно |
|-----|-------|------|
| IP (неаутентифицированные) | 100 req | 1 min |
| User (аутентифицированные) | 200 req | 1 min |

---

## ⏱️ Timeouts и TTL

| Параметр | Значение | Где |
|----------|----------|-----|
| Server Timeout (safety net) | 10s | `internal/lib/interceptors/timeout.go` |
| Client Timeout (per request) | 8s | `shared/lib/grpc/grpc-client.ts` |
| Shutdown Timeout | 10s | `cmd/server/main.go` |
| Circuit Breaker Cooldown | 30s | `shared/lib/circuit-breaker.ts` |
| Circuit Breaker Failure Threshold | 5 failures | `shared/lib/circuit-breaker.ts` |
| Circuit Breaker Success Threshold | 1 success | `shared/lib/circuit-breaker.ts` |
| Retry Base Delay | 1s | `shared/lib/retry.ts` |
| Retry Max Delay | 4s | `shared/lib/retry.ts` |
| Retry Max Attempts | 3 | `shared/lib/retry.ts` |
| Max Total Wait (worst case) | ~31s | 8s × 3 + 7s delays |

---

## 📝 Чеклист при добавлении нового endpoint

- [ ] Handler проверяет `ctx.Done()` перед side effects
- [ ] Не использует `context.Background()` или `context.TODO()`
- [ ] Использует переданный ctx с timeout
- [ ] Логирует с correlation ID (`GetRequestID(ctx)`)

---

## 📝 Чеклист при добавлении нового API call (frontend)

- [ ] Обёрнут в `withRetry()` если нужен retry
- [ ] НЕ включает retry в RTK Query options
- [ ] Использует `logger.error()` вместо `console.error()` в бизнес-логике
- [ ] Обрабатывает circuit breaker state

**Примечание:** `console.error` допустим в инфраструктурном коде (ErrorBoundary, sync.ts, logger.ts).

---

## 🧪 Автоматическая проверка инвариантов

### Команды для запуска

**Backend (Go):**
```bash
cd backend && go build -o /dev/null ./cmd/server && go test ./internal/lib/interceptors/... -v
```

**Frontend (TypeScript):**
```bash
cd frontend && yarn lint && yarn test --run src/shared/lib/architecture.test.ts
```

### Когда тесты упадут

| Ситуация | Тест | Что делать |
|----------|------|------------|
| Добавил публичный метод | `TestPublicMethodsWhitelist` | Добавь в `expectedPublicMethods` + `publicMethods` map |
| Добавил файл с map в lib | `TestNoUnboundedMapsInLib` | Добавь size limit или в `allowedFiles` с обоснованием |
| Handler без withTimeout | `TestNewHandlersMustUseContextTimeout` | Добавь `withTimeout(ctx, duration)` |
| Retry в RTK Query | ESLint error | Используй `withRetry()` из `shared/lib/retry.ts` |
| context.Background() в handler | `TestNoContextBackgroundInHandlers` | Используй переданный ctx |
| Неправильный порядок interceptors | `TestInterceptorOrder` | Исправь порядок в main.go |

### CI/CD интеграция

Добавь в pipeline:
```yaml
# Backend
- name: Build & Test Backend
  run: |
    cd backend
    go build -o /dev/null ./cmd/server
    go test ./... -v

# Frontend
- name: Lint & Test Frontend
  run: |
    cd frontend
    yarn lint
    yarn test --run
```

**Результат:** Нарушения инвариантов блокируют merge.
