// Package admin предоставляет gRPC handlers для административных функций
package admin

import (
	"context"
	"log/slog"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"template/internal/domain/models"
	pb "template/internal/grpc/gen/admin"
	"template/internal/lib/errutil"
	"template/internal/lib/logger"
	adminService "template/internal/services/service/admin"
	userService "template/internal/services/service/user"
)

// Handler gRPC handler для admin
type Handler struct {
	pb.UnimplementedAdminServiceServer
	adminService adminService.Service
	userService  userService.Service
	logger       *slog.Logger
}

// New создаёт новый Handler
func New(adminService adminService.Service, userService userService.Service, log *slog.Logger) *Handler {
	return &Handler{
		adminService: adminService,
		userService:  userService,
		logger:       log,
	}
}

// GetDashboardStats возвращает статистику для дашборда (только для админов)
func (h *Handler) GetDashboardStats(ctx context.Context, req *pb.GetDashboardStatsRequest) (*pb.GetDashboardStatsResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	userID, err := errutil.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "не авторизован")
	}

	// Проверяем права
	isAdmin, err := h.userService.HasRole(ctx, userID, models.RoleAdmin)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}
	if !isAdmin {
		return nil, status.Error(codes.PermissionDenied, "доступ запрещён")
	}

	stats, err := h.adminService.GetDashboardStats(ctx)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	// Конвертируем daily registrations
	dailyRegs := make([]*pb.DailyRegistration, len(stats.DailyRegistrations))
	for i, reg := range stats.DailyRegistrations {
		dailyRegs[i] = &pb.DailyRegistration{
			Date:  reg.Date,
			Count: reg.Count,
		}
	}

	return &pb.GetDashboardStatsResponse{
		TotalUsers:         stats.TotalUsers,
		ActiveUsers:        stats.ActiveUsers,
		NewUsersToday:      stats.NewUsersToday,
		NewUsersThisWeek:   stats.NewUsersThisWeek,
		NewUsersThisMonth:  stats.NewUsersThisMonth,
		DailyRegistrations: dailyRegs,
	}, nil
}
