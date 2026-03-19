// Package admin предоставляет бизнес-логику для административных функций
package admin

import (
	"context"
	"log/slog"
	"time"

	"template/internal/domain/models"
	userStorage "template/internal/storage/postgres/user"
)

// DashboardStats статистика для дашборда
type DashboardStats struct {
	TotalUsers         int64
	ActiveUsers        int64
	NewUsersToday      int64
	NewUsersThisWeek   int64
	NewUsersThisMonth  int64
	DailyRegistrations []DailyRegistration
}

// DailyRegistration данные о регистрациях за день
type DailyRegistration struct {
	Date  string // YYYY-MM-DD
	Count int64
}

// Service интерфейс admin service
type Service interface {
	GetDashboardStats(ctx context.Context) (*DashboardStats, error)
}

// AdminService реализация Service
type AdminService struct {
	userStorage userStorage.Storage
	logger      *slog.Logger
}

// New создаёт новый AdminService
func New(userStorage userStorage.Storage, logger *slog.Logger) *AdminService {
	return &AdminService{
		userStorage: userStorage,
		logger:      logger,
	}
}

// GetDashboardStats возвращает статистику для дашборда
func (s *AdminService) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	now := time.Now()
	today := now.Truncate(24 * time.Hour)
	weekAgo := today.AddDate(0, 0, -7)
	monthAgo := today.AddDate(0, -1, 0)
	tomorrow := today.AddDate(0, 0, 1)

	// Общее количество пользователей
	totalUsers, err := s.userStorage.CountAll(ctx)
	if err != nil {
		s.logger.Error("failed to count all users", "error", err)
		return nil, err
	}

	// Активные пользователи
	activeUsers, err := s.userStorage.CountByStatus(ctx, models.UserStatusActive)
	if err != nil {
		s.logger.Error("failed to count active users", "error", err)
		return nil, err
	}

	// Новые пользователи за сегодня
	newUsersToday, err := s.userStorage.CountByDateRange(ctx, today, tomorrow)
	if err != nil {
		s.logger.Error("failed to count new users today", "error", err)
		return nil, err
	}

	// Новые пользователи за неделю
	newUsersThisWeek, err := s.userStorage.CountByDateRange(ctx, weekAgo, tomorrow)
	if err != nil {
		s.logger.Error("failed to count new users this week", "error", err)
		return nil, err
	}

	// Новые пользователи за месяц
	newUsersThisMonth, err := s.userStorage.CountByDateRange(ctx, monthAgo, tomorrow)
	if err != nil {
		s.logger.Error("failed to count new users this month", "error", err)
		return nil, err
	}

	// Ежедневные регистрации за последние 30 дней
	dailyRegs, err := s.userStorage.GetDailyRegistrations(ctx, 30)
	if err != nil {
		s.logger.Error("failed to get daily registrations", "error", err)
		return nil, err
	}

	// Конвертируем в формат ответа
	dailyRegistrations := make([]DailyRegistration, len(dailyRegs))
	for i, reg := range dailyRegs {
		dailyRegistrations[i] = DailyRegistration{
			Date:  reg.Date.Format("2006-01-02"),
			Count: reg.Count,
		}
	}

	return &DashboardStats{
		TotalUsers:         totalUsers,
		ActiveUsers:        activeUsers,
		NewUsersToday:      newUsersToday,
		NewUsersThisWeek:   newUsersThisWeek,
		NewUsersThisMonth:  newUsersThisMonth,
		DailyRegistrations: dailyRegistrations,
	}, nil
}
