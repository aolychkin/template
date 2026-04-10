---
inclusion: auto
name: security-checklist
description: Security guidelines and production checklist. Use when reviewing security, handling authentication, or preparing for production deployment.
---

# Security Guide - Защита проекта

## ⚠️ CRITICAL - Production Checklist

### 1. Секреты
```bash
# Генерация JWT secret (64 байта)
openssl rand -base64 64

# .env
JWT_SECRET=<generated_64_bytes>
ENV=production
```

### 2. CORS Origins
```go
// main.go - только production домены
allowedOrigins := map[string]bool{
    "https://your-domain.com": true,
}
```

### 3. HTTPS + Headers
- ✅ Reverse proxy (nginx/caddy)
- ✅ Force HTTPS redirect
- ✅ HSTS headers

### 4. Database
- ✅ PostgreSQL в production (не SQLite)
- ✅ SSL connections
- ✅ Regular backups

## ✅ Реализованная защита

### Backend Security
- [x] **Пароли:** Bcrypt (cost 12)
- [x] **Токены:** SHA256 для refresh, JWT для access
- [x] **Сессии:** JWT (15 мин) + refresh (7 дней)
- [x] **Блокировка:** Account lockout (5 попыток, 15 мин)
- [x] **Rate limiting:** 100 req/min по IP + userID
- [x] **CORS:** Whitelist + preflight обработка
- [x] **Headers:** CSP, X-Frame-Options, Permissions-Policy
- [x] **SQL:** Prepared statements (GORM)
- [x] **Timing:** Constant-time comparison

### Frontend Security
- [x] **XSS:** Sanitization
- [x] **JWT:** Validation (структура + expiration)
- [x] **Cookies:** Secure + SameSite=Strict
- [x] **Storage:** Минимизация данных
- [x] **Errors:** Try-catch везде
- [x] **CSP:** Content-Security-Policy
- [x] **Boundaries:** Error boundaries в React

## 🛡️ Принципы безопасности

### 1. Аутентификация
```go
// Всегда используй функции из lib/auth
if err := auth.ComparePassword(user.PasswordHash, password); err != nil {
    return ErrInvalidCredentials
}

if err := auth.CompareToken(*user.RefreshToken, refreshToken); err != nil {
    return ErrInvalidRefresh
}
```

### 2. Валидация входных данных
```go
// Backend - всегда проверяй
if userID == "" {
    return nil, errors.New("userID is required")
}

// Frontend - валидируй структуру
if (!user || typeof user !== 'object') return null;
```

### 3. Nil pointer checks
```go
// Backend
if user == nil {
    return nil, errors.New("user not found")
}

// Frontend
const user = response.getUser();
if (!user) {
    return { error: { status: 'CUSTOM_ERROR', error: 'User data missing' } };
}
```

### 4. Try-catch для внешних API
```typescript
// Cookies, localStorage, document
export const setCookie = (name: string, value: string) => {
    try {
        document.cookie = `${name}=${value}; Secure; SameSite=Strict`;
    } catch (error) {
        console.error('Failed to set cookie:', error);
        throw error;
    }
};
```

### 5. Context timeouts
```go
// Всегда устанавливай timeout
ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
defer cancel()
```

### 6. Generic error messages
```go
// Клиенту - общие сообщения
return nil, status.Error(codes.Internal, "operation failed")

// В логи - детальные
s.log.Error("failed to get user", slog.String("error", err.Error()))
```

## 🔒 CSRF Protection

### Backend
```go
// Генерация токена
func GenerateCSRFToken() (string, error) {
    bytes := make([]byte, 32)
    if _, err := rand.Read(bytes); err != nil {
        return "", err
    }
    return hex.EncodeToString(bytes), nil
}

// Проверка токена (timing attack safe)
func ValidateCSRFToken(stored, provided string) bool {
    return subtle.ConstantTimeCompare([]byte(stored), []byte(provided)) == 1
}
```

### Frontend
```typescript
// Получение токена перед критичной операцией
const { data: csrfToken } = useGetCSRFTokenQuery();

// Использование в запросе
const updateProfile = async (data) => {
    await grpcClient.user.updateProfile({
        ...data,
        csrfToken
    });
};
```

## 🚨 Известные ограничения (gRPC-Web)

1. **Токены в cookies** - стандарт gRPC-Web, httpOnly невозможен
2. **localStorage флаг** - только для UX, данные в Redux
3. **Авторизация на backend** - клиент только отображение
4. **XSS может украсть флаг** - но не токены, не данные

## 🎯 Production CSP

### Development (текущий)
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
  connect-src 'self' http://localhost:44044 ws://localhost:3000;
" />
```

### Production
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self'; 
  connect-src 'self' https://api.your-domain.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
" />
```

## 📝 Pre-Release Checklist

### 🔴 КРИТИЧНО - Секреты и окружение
- [ ] JWT_SECRET - 64+ символов (сгенерировать новый для production)
- [ ] ENV=production
- [ ] PostgreSQL вместо SQLite

### 🔴 КРИТИЧНО - CORS и домены
- [ ] Backend `config.go` - production AllowedOrigins настроены
- [ ] Frontend CSP - production домены (без localhost)

### 🟡 ВАЖНО - HTTP Headers
- [ ] **HSTS Header:** `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] HTTPS через reverse proxy

### 🟢 ПРОВЕРЕНО - Реализовано в коде
- [x] XSS protection
- [x] Rate limiting
- [x] Brute force protection
- [x] Timing attack protection

### 🔵 РЕКОМЕНДУЕТСЯ - После релиза
- [ ] WAF (Web Application Firewall)
- [ ] Penetration testing
- [ ] Dependency vulnerability scan (`npm audit`, `go mod verify`)
- [ ] Regular security updates

## 🔗 Полезные ссылки

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
