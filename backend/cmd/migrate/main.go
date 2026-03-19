// cmd/migrate/main.go
// Отдельная команда для миграций БД
//
// Использование:
//
//	go run cmd/migrate/main.go
//	или
//	task migrate
package main

import (
	"log/slog"
	"os"

	"template/internal/domain/models"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	log := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	log.Info("starting database migration")

	// Load .env
	if err := godotenv.Load(); err != nil {
		log.Debug("env file not found, using system environment")
	}

	// Получаем DATABASE_URL
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Error("DATABASE_URL is required")
		os.Exit(1)
	}

	// Connect to database
	log.Info("connecting to PostgreSQL")
	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Silent),
		DisableForeignKeyConstraintWhenMigrating: true,
	})
	if err != nil {
		log.Error("failed to connect to PostgreSQL", slog.String("error", err.Error()))
		os.Exit(1)
	}

	// Run migrations
	log.Info("running migrations...")

	migrate(log, db, &models.User{}, "User")
	migrate(log, db, &models.UserProfile{}, "UserProfile")
	migrate(log, db, &models.RefreshToken{}, "RefreshToken")
	migrate(log, db, &models.RegistrationProgress{}, "RegistrationProgress")

	log.Info("✅ migrations completed successfully")
}

func migrate(log *slog.Logger, db *gorm.DB, model any, name string) {
	if err := db.AutoMigrate(model); err != nil {
		log.Warn("migrate warning", slog.String("model", name), slog.String("error", err.Error()))
	} else {
		log.Info("migrated", slog.String("model", name))
	}
}
