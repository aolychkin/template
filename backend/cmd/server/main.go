// Package main точка входа сервера
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"

	"template/internal/config"
	grpcServer "template/internal/grpc/server"
	"template/internal/lib/logger"
	"template/internal/storage/postgres"

	// Services
	adminService "template/internal/services/service/admin"
	authService "template/internal/services/service/auth"
	userService "template/internal/services/service/user"

	// Storage
	authStorage "template/internal/storage/postgres/auth"
	userStorage "template/internal/storage/postgres/user"

	// Handlers
	adminHandler "template/internal/grpc/service/admin"
	authHandler "template/internal/grpc/service/auth"
	userHandler "template/internal/grpc/service/user"
)

func main() {
	// Загружаем .env (игнорируем ошибку если файла нет)
	_ = godotenv.Load()

	// Конфигурация
	cfg := config.Load()

	// Logger
	logLevel := "info"
	if cfg.IsDevelopment() {
		logLevel = "debug"
	}
	log := logger.New(logLevel)
	slog.SetDefault(log)

	// Validate config (panics in production with default JWT secret)
	cfg.Validate(log)

	log.Info("starting server",
		"env", cfg.Environment,
		"port", cfg.ServerPort,
	)

	// Database
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	dbCfg := postgres.DefaultConnectionConfig(cfg.DatabaseURL)
	db, err := postgres.Connect(ctx, dbCfg, log)
	if err != nil {
		log.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}

	// NOTE: Миграции запускаются ОТДЕЛЬНО через `task migrate`
	// НЕ делаем AutoMigrate при старте — это замедляет cold start в serverless

	// Storage layer
	authStore := authStorage.New(db)
	userStore := userStorage.New(db)

	// Service layer
	authSvc := authService.New(authStore, cfg.JWTSecret, log)
	userSvc := userService.New(userStore, log)
	adminSvc := adminService.New(userStore, log)

	// gRPC handlers
	authHdl := authHandler.New(authSvc, log)
	userHdl := userHandler.New(userSvc, log)
	adminHdl := adminHandler.New(adminSvc, userSvc, log)

	// gRPC server
	server := grpcServer.New(cfg, log)

	// Register services
	server.RegisterAuthService(authHdl)
	server.RegisterUserService(userHdl)
	server.RegisterAdminService(adminHdl)

	// Graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		log.Info("shutting down server...")

		server.GracefulStop()

		// Close database
		if err := postgres.Close(db); err != nil {
			log.Error("failed to close database", "error", err)
		}

		log.Info("server stopped")
		os.Exit(0)
	}()

	// Start server (gRPC-Web over HTTP)
	addr := cfg.ServerHost + ":" + cfg.ServerPort
	if err := server.Serve(addr); err != nil {
		log.Error("server error", "error", err)
		os.Exit(1)
	}
}
