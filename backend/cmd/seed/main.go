// Package main - entry point для seed команды
package main

import (
	"context"
	"log"
	"log/slog"
	"os"
	"time"

	"github.com/joho/godotenv"

	"template/internal/config"
	"template/internal/seed"
	"template/internal/storage/postgres"
)

func main() {
	// Загружаем .env
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Проверяем окружение
	env := os.Getenv("ENVIRONMENT")
	if env == "production" {
		log.Fatal("❌ Seed запрещён в production!")
	}

	// Загружаем конфиг
	cfg := config.Load()

	// Создаём logger
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))

	// Подключаемся к БД
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	connCfg := postgres.DefaultConnectionConfig(cfg.DatabaseURL)
	db, err := postgres.Connect(ctx, connCfg, logger)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}
	defer func() {
		if err := postgres.Close(db); err != nil {
			logger.Warn("failed to close database connection", slog.String("error", err.Error()))
		}
	}()

	log.Println("🌱 Starting database seed...")

	// Запускаем seed
	if err := seed.Run(db); err != nil {
		log.Fatalf("❌ Seed failed: %v", err)
	}

	log.Println("✅ Seed completed successfully!")
}
