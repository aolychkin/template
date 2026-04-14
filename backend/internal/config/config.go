package config

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
)

const defaultJWTSecret = "change-me-in-production-use-32-chars-min"

// Config содержит конфигурацию приложения
type Config struct {
	// Server
	ServerPort string
	ServerHost string

	// Database
	DatabaseURL string

	// JWT
	JWTSecret            string
	AccessTokenDuration  time.Duration
	RefreshTokenDuration time.Duration

	// Security
	BcryptCost          int
	MaxFailedAttempts   int
	AccountLockDuration time.Duration
	RateLimitRequests   int
	RateLimitWindow     time.Duration

	// CORS
	AllowedOrigins []string

	// Environment
	Environment string // development, staging, production
}

// Load загружает конфигурацию из environment variables
func Load() *Config {
	// Определяем какой DATABASE_URL использовать
	databaseURL := getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/app?sslmode=disable")

	// Если USE_LOCAL_DB=true, используем DATABASE_URL_LOCAL (для stage)
	if getEnv("USE_LOCAL_DB", "false") == "true" {
		if localURL := os.Getenv("DATABASE_URL_LOCAL"); localURL != "" {
			databaseURL = localURL
		}
	}

	return &Config{
		// Server (gRPC-Web over HTTP)
		ServerPort: getEnv("SERVER_PORT", "44044"),
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),

		// Database
		DatabaseURL: databaseURL,

		// JWT
		JWTSecret:            getEnv("JWT_SECRET", "change-me-in-production-use-32-chars-min"),
		AccessTokenDuration:  getDurationEnv("ACCESS_TOKEN_DURATION", 15*time.Minute),
		RefreshTokenDuration: getDurationEnv("REFRESH_TOKEN_DURATION", 7*24*time.Hour),

		// Security
		BcryptCost:          getIntEnv("BCRYPT_COST", 12),
		MaxFailedAttempts:   getIntEnv("MAX_FAILED_ATTEMPTS", 5),
		AccountLockDuration: getDurationEnv("ACCOUNT_LOCK_DURATION", 30*time.Minute),
		RateLimitRequests:   getIntEnv("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:     getDurationEnv("RATE_LIMIT_WINDOW", time.Minute),

		// CORS
		AllowedOrigins: getSliceEnv("ALLOWED_ORIGINS", []string{"http://localhost:3000"}),

		// Environment
		Environment: getEnv("ENVIRONMENT", "development"),
	}
}

// IsDevelopment возвращает true если окружение development
func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// IsProduction возвращает true если окружение production
func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

// Validate проверяет критичные настройки конфигурации
// В production окружении паникует если JWT_SECRET не изменён
func (c *Config) Validate(log *slog.Logger) {
	// Критичная проверка для production
	if c.IsProduction() && c.JWTSecret == defaultJWTSecret {
		log.Error("CRITICAL: JWT_SECRET must be changed in production!")
		fmt.Fprintln(os.Stderr, "FATAL: JWT_SECRET is set to default value in production environment")
		panic("JWT_SECRET must be changed in production")
	}

	// Warning для dev/stage
	if c.JWTSecret == defaultJWTSecret {
		log.Warn("JWT_SECRET is using default value - change for production!")
	}

	// Проверка минимальной длины JWT секрета
	if len(c.JWTSecret) < 32 {
		log.Warn("JWT_SECRET is too short, recommended minimum is 32 characters")
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getIntEnv(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getDurationEnv(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
	}
	return defaultValue
}

func getSliceEnv(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		var result []string
		for _, item := range strings.Split(value, ",") {
			trimmed := strings.TrimSpace(item)
			if trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return defaultValue
}
