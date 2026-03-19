package ratelimit

import (
	"log/slog"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	DefaultMaxIPVisitors   = 50000  // Максимум IP в памяти
	DefaultMaxUserVisitors = 100000 // Максимум users в памяти
)

type visitor struct {
	count      int
	lastSeen   time.Time
	resetAfter time.Time
}

type RateLimiter struct {
	mu              sync.RWMutex
	ipVisitors      map[string]*visitor // Rate limiting по IP
	userVisitors    map[string]*visitor // Rate limiting по userID
	ipLimit         int                 // Лимит для IP (100 req/min)
	userLimit       int                 // Лимит для users (200 req/min)
	maxIPVisitors   int                 // Лимит размера ipVisitors map
	maxUserVisitors int                 // Лимит размера userVisitors map
	window          time.Duration
	stopChan        chan struct{}
	wg              sync.WaitGroup
	log             *slog.Logger
}

// New создаёт RateLimiter с одинаковым лимитом для IP и users (для обратной совместимости)
func New(limit int, window time.Duration) *RateLimiter {
	return NewWithLimits(limit, limit, window, slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelWarn})))
}

// NewWithLimits создаёт RateLimiter с разными лимитами для IP и users
func NewWithLimits(ipLimit, userLimit int, window time.Duration, log *slog.Logger) *RateLimiter {
	rl := &RateLimiter{
		ipVisitors:      make(map[string]*visitor),
		userVisitors:    make(map[string]*visitor),
		ipLimit:         ipLimit,
		userLimit:       userLimit,
		maxIPVisitors:   DefaultMaxIPVisitors,
		maxUserVisitors: DefaultMaxUserVisitors,
		window:          window,
		stopChan:        make(chan struct{}),
		log:             log,
	}
	rl.wg.Add(1)
	go rl.cleanup()
	return rl
}

// evictOldestVisitors удаляет записи при превышении лимита
func (rl *RateLimiter) evictOldestVisitors(visitors map[string]*visitor, maxSize int) {
	if len(visitors) < maxSize {
		return
	}

	// Удаляем 10% записей (random eviction через map iteration order)
	toDelete := maxSize / 10
	if toDelete < 1 {
		toDelete = 1
	}

	deleted := 0
	for key := range visitors {
		if deleted >= toDelete {
			break
		}
		delete(visitors, key)
		deleted++
	}

	rl.log.Warn("rate limiter eviction",
		slog.Int("evicted", deleted),
		slog.Int("remaining", len(visitors)),
	)
}

// Allow проверяет rate limit по IP (для обратной совместимости)
func (rl *RateLimiter) Allow(ip string) bool {
	return rl.AllowIP(ip)
}

// AllowIP проверяет rate limit по IP для неаутентифицированных запросов
func (rl *RateLimiter) AllowIP(ip string) bool {
	if ip == "" {
		return true
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Проверяем лимит размера map
	rl.evictOldestVisitors(rl.ipVisitors, rl.maxIPVisitors)

	now := time.Now()
	v, exists := rl.ipVisitors[ip]

	if !exists || now.After(v.resetAfter) {
		rl.ipVisitors[ip] = &visitor{
			count:      1,
			lastSeen:   now,
			resetAfter: now.Add(rl.window),
		}
		return true
	}

	if v.count >= rl.ipLimit {
		rl.log.Warn("IP rate limit exceeded",
			slog.String("ip", ip),
			slog.Int("count", v.count),
			slog.Int("limit", rl.ipLimit),
		)
		return false
	}

	v.count++
	v.lastSeen = now
	return true
}

// AllowUser проверяет rate limit для аутентифицированного пользователя
func (rl *RateLimiter) AllowUser(userID string) bool {
	if userID == "" {
		return true // Не ограничиваем если userID пустой
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Проверяем лимит размера map
	rl.evictOldestVisitors(rl.userVisitors, rl.maxUserVisitors)

	now := time.Now()
	v, exists := rl.userVisitors[userID]

	if !exists || now.After(v.resetAfter) {
		rl.userVisitors[userID] = &visitor{
			count:      1,
			lastSeen:   now,
			resetAfter: now.Add(rl.window),
		}
		return true
	}

	if v.count >= rl.userLimit {
		rl.log.Warn("user rate limit exceeded",
			slog.String("user_id", userID),
			slog.Int("count", v.count),
			slog.Int("limit", rl.userLimit),
		)
		return false
	}

	v.count++
	v.lastSeen = now
	return true
}

// AllowWithLimit проверяет rate limit с кастомным лимитом (для чувствительных методов)
func (rl *RateLimiter) AllowWithLimit(key string, limit int) bool {
	if key == "" {
		return true
	}

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Используем ipVisitors map для хранения (можно создать отдельную map если нужно)
	rl.evictOldestVisitors(rl.ipVisitors, rl.maxIPVisitors)

	now := time.Now()
	v, exists := rl.ipVisitors[key]

	if !exists || now.After(v.resetAfter) {
		rl.ipVisitors[key] = &visitor{
			count:      1,
			lastSeen:   now,
			resetAfter: now.Add(rl.window),
		}
		return true
	}

	if v.count >= limit {
		return false
	}

	v.count++
	v.lastSeen = now
	return true
}

const cleanupInterval = time.Minute

func (rl *RateLimiter) cleanup() {
	defer rl.wg.Done()
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			rl.cleanupExpiredVisitors()
		case <-rl.stopChan:
			return
		}
	}
}

func (rl *RateLimiter) cleanupExpiredVisitors() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()

	// Cleanup IP visitors
	for ip, v := range rl.ipVisitors {
		if v != nil && now.Sub(v.lastSeen) > rl.window {
			delete(rl.ipVisitors, ip)
		}
	}

	// Cleanup user visitors
	for userID, v := range rl.userVisitors {
		if v != nil && now.Sub(v.lastSeen) > rl.window {
			delete(rl.userVisitors, userID)
		}
	}
}

// Stop останавливает cleanup goroutine и ждёт завершения
func (rl *RateLimiter) Stop() {
	close(rl.stopChan)
	rl.wg.Wait()
}

const unknownIP = "unknown"

func getClientIP(r *http.Request) string {
	if r == nil || r.Header == nil {
		return unknownIP
	}

	if forwardedFor := r.Header.Get("X-Forwarded-For"); forwardedFor != "" {
		if idx := strings.Index(forwardedFor, ","); idx != -1 {
			return strings.TrimSpace(forwardedFor[:idx])
		}
		return strings.TrimSpace(forwardedFor)
	}

	if realIP := r.Header.Get("X-Real-IP"); realIP != "" {
		return realIP
	}

	if r.RemoteAddr != "" {
		if idx := strings.LastIndex(r.RemoteAddr, ":"); idx != -1 {
			return r.RemoteAddr[:idx]
		}
		return r.RemoteAddr
	}

	return unknownIP
}

const (
	retryAfterSeconds = "60"
	rateLimitMessage  = "Too many requests"
)

func (rl *RateLimiter) handleRateLimitExceeded(w http.ResponseWriter, ip string) {
	if w == nil {
		rl.log.Error("handleRateLimitExceeded: ResponseWriter is nil")
		return
	}

	if header := w.Header(); header != nil {
		header.Set("Retry-After", retryAfterSeconds)
	}
	w.WriteHeader(http.StatusTooManyRequests)

	if _, err := w.Write([]byte(rateLimitMessage)); err != nil {
		rl.log.Error("failed to write rate limit response", slog.String("error", err.Error()), slog.String("ip", ip))
	}
}

func (rl *RateLimiter) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				rl.log.Error("panic in rate limiter middleware", slog.Any("error", err))
				if w != nil {
					http.Error(w, "Internal server error", http.StatusInternalServerError)
				}
			}
		}()

		if w == nil || r == nil {
			return
		}

		ip := getClientIP(r)

		if !rl.AllowIP(ip) {
			rl.handleRateLimitExceeded(w, ip)
			return
		}

		if next != nil {
			next.ServeHTTP(w, r)
		}
	})
}
