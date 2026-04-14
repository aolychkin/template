package postgres

import (
	"context"
	"fmt"
	"log/slog"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// ConnectionConfig содержит настройки подключения к БД
type ConnectionConfig struct {
	URL             string
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
	LogLevel        logger.LogLevel
}

// DefaultConnectionConfig возвращает конфигурацию по умолчанию
func DefaultConnectionConfig(url string) *ConnectionConfig {
	return &ConnectionConfig{
		URL:             url,
		MaxOpenConns:    25,
		MaxIdleConns:    10,
		ConnMaxLifetime: 5 * time.Minute,
		ConnMaxIdleTime: 10 * time.Minute,
		LogLevel:        logger.Warn,
	}
}

// Connect создаёт подключение к PostgreSQL
func Connect(ctx context.Context, cfg *ConnectionConfig, log *slog.Logger) (*gorm.DB, error) {
	if cfg == nil {
		return nil, fmt.Errorf("connection config is nil")
	}
	if cfg.URL == "" {
		return nil, fmt.Errorf("database URL is empty")
	}

	// Настройка логгера GORM
	gormLogger := logger.New(
		&slogAdapter{log: log},
		logger.Config{
			SlowThreshold:             200 * time.Millisecond,
			LogLevel:                  cfg.LogLevel,
			IgnoreRecordNotFoundError: true,
			Colorful:                  false,
		},
	)

	// Подключение к БД
	db, err := gorm.Open(postgres.Open(cfg.URL), &gorm.Config{
		Logger:                 gormLogger,
		SkipDefaultTransaction: true,
		PrepareStmt:            true,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Настройка connection pool
	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get sql.DB: %w", err)
	}

	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)
	sqlDB.SetConnMaxLifetime(cfg.ConnMaxLifetime)
	sqlDB.SetConnMaxIdleTime(cfg.ConnMaxIdleTime)

	// Проверка подключения
	if err := sqlDB.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Info("connected to database",
		"max_open_conns", cfg.MaxOpenConns,
		"max_idle_conns", cfg.MaxIdleConns,
	)

	return db, nil
}

// Close закрывает подключение к БД
func Close(db *gorm.DB) error {
	if db == nil {
		return nil
	}
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}

// slogAdapter адаптирует slog для GORM logger
type slogAdapter struct {
	log *slog.Logger
}

func (a *slogAdapter) Printf(format string, args ...any) {
	a.log.Debug(fmt.Sprintf(format, args...))
}
