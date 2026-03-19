// Package user предоставляет gRPC handlers для пользователей
package user

import (
	"context"
	"log/slog"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"template/internal/domain/models"
	pb "template/internal/grpc/gen/user"
	"template/internal/lib/errutil"
	"template/internal/lib/logger"
	userService "template/internal/services/service/user"
	userStorage "template/internal/storage/postgres/user"
)

// Handler gRPC handler для user
type Handler struct {
	pb.UnimplementedUserServiceServer
	service userService.Service
	logger  *slog.Logger
}

// New создаёт новый Handler
func New(service userService.Service, log *slog.Logger) *Handler {
	return &Handler{
		service: service,
		logger:  log,
	}
}

// GetProfile получает профиль текущего пользователя
func (h *Handler) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.GetProfileResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	userID, err := errutil.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "не авторизован")
	}

	user, err := h.service.GetByID(ctx, userID)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	return &pb.GetProfileResponse{
		User: userToProto(user),
	}, nil
}

// UpdateProfile обновляет профиль пользователя
func (h *Handler) UpdateProfile(ctx context.Context, req *pb.UpdateProfileRequest) (*pb.UpdateProfileResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	userID, err := errutil.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "не авторизован")
	}

	updateReq := &userService.UpdateRequest{}
	if req.FirstName != nil {
		updateReq.FirstName = req.FirstName
	}
	if req.LastName != nil {
		updateReq.LastName = req.LastName
	}
	if req.AvatarUrl != nil {
		updateReq.AvatarURL = req.AvatarUrl
	}
	if req.Bio != nil {
		updateReq.Bio = req.Bio
	}

	user, err := h.service.Update(ctx, userID, updateReq)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	return &pb.UpdateProfileResponse{
		User: userToProto(user),
	}, nil
}

// DeleteAccount удаляет аккаунт пользователя
func (h *Handler) DeleteAccount(ctx context.Context, req *pb.DeleteAccountRequest) (*pb.DeleteAccountResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	userID, err := errutil.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "не авторизован")
	}

	if err := h.service.Delete(ctx, userID); err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	return &pb.DeleteAccountResponse{
		Success: true,
	}, nil
}

// ListUsers возвращает список пользователей (только для админов)
func (h *Handler) ListUsers(ctx context.Context, req *pb.ListUsersRequest) (*pb.ListUsersResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	userID, err := errutil.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "не авторизован")
	}

	// Проверяем права
	isAdmin, err := h.service.HasRole(ctx, userID, models.RoleAdmin)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}
	if !isAdmin {
		return nil, status.Error(codes.PermissionDenied, "доступ запрещён")
	}

	filter := &userStorage.ListFilter{
		Limit:  int(req.Limit),
		Offset: int(req.Offset),
	}
	if req.Search != nil {
		filter.Search = req.Search
	}
	if req.Role != nil && *req.Role != "" {
		role := models.UserRole(*req.Role)
		filter.Role = &role
	}
	if req.Status != nil && *req.Status != "" {
		status := models.UserStatus(*req.Status)
		filter.Status = &status
	}

	users, total, err := h.service.List(ctx, filter)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	pbUsers := make([]*pb.User, len(users))
	for i, u := range users {
		pbUsers[i] = userToProto(u)
	}

	return &pb.ListUsersResponse{
		Users: pbUsers,
		Total: total,
	}, nil
}

// userToProto конвертирует User в proto
func userToProto(user *models.User) *pb.User {
	pbUser := &pb.User{
		Id:        user.ID,
		Email:     user.Email,
		Phone:     user.Phone,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      string(user.Role),
		Status:    string(user.Status),
		CreatedAt: user.CreatedAt.Unix(),
	}

	if user.Profile != nil {
		pbUser.Profile = &pb.UserProfile{}
		if user.Profile.AvatarURL != nil {
			pbUser.Profile.AvatarUrl = *user.Profile.AvatarURL
		}
		if user.Profile.Bio != nil {
			pbUser.Profile.Bio = *user.Profile.Bio
		}
	}

	return pbUser
}
