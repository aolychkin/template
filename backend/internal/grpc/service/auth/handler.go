// Package auth предоставляет gRPC handlers для аутентификации
package auth

import (
	"context"
	"log/slog"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"template/internal/domain/models"
	pb "template/internal/grpc/gen/auth"
	"template/internal/lib/audit"
	"template/internal/lib/errutil"
	"template/internal/lib/logger"
	authService "template/internal/services/service/auth"
)

// Handler gRPC handler для auth
type Handler struct {
	pb.UnimplementedAuthServiceServer
	service authService.Service
	logger  *slog.Logger
	audit   *audit.Logger
}

// New создаёт новый Handler
func New(service authService.Service, log *slog.Logger) *Handler {
	return &Handler{
		service: service,
		logger:  log,
		audit:   audit.New(log),
	}
}

// getClientIP извлекает IP клиента из контекста
func getClientIP(ctx context.Context) string {
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		// X-Forwarded-For от reverse proxy
		if xff := md.Get("x-forwarded-for"); len(xff) > 0 {
			return xff[0]
		}
		// X-Real-IP
		if xri := md.Get("x-real-ip"); len(xri) > 0 {
			return xri[0]
		}
	}
	return "unknown"
}

// Login обрабатывает запрос на вход
func (h *Handler) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	log := logger.FromContext(ctx, h.logger)
	ip := getClientIP(ctx)

	// Валидация
	if req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "email и password обязательны")
	}

	tokenPair, user, err := h.service.Login(ctx, req.Email, req.Password)
	if err != nil {
		// Audit: failed login
		h.audit.LoginFailed(req.Email, ip, err.Error())
		return nil, errutil.HandleError(ctx, log, err)
	}

	// Audit: successful login
	h.audit.LoginSuccess(user.ID, ip)

	return &pb.LoginResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt.Unix(),
		User:         userToProto(user),
	}, nil
}

// Register обрабатывает запрос на регистрацию
func (h *Handler) Register(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	// Валидация
	if req.FirstName == "" || req.LastName == "" || req.Phone == "" || req.Email == "" || req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "все поля обязательны")
	}

	registerReq := &authService.RegisterRequest{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
		Email:     req.Email,
		Password:  req.Password,
	}

	tokenPair, user, err := h.service.Register(ctx, registerReq)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	return &pb.RegisterResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt.Unix(),
		User:         userToProto(user),
	}, nil
}

// RefreshToken обрабатывает запрос на обновление токенов
func (h *Handler) RefreshToken(ctx context.Context, req *pb.RefreshTokenRequest) (*pb.RefreshTokenResponse, error) {
	log := logger.FromContext(ctx, h.logger)
	ip := getClientIP(ctx)

	if req.RefreshToken == "" {
		return nil, status.Error(codes.InvalidArgument, "refresh_token обязателен")
	}

	tokenPair, err := h.service.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		// Audit: failed token refresh
		h.audit.TokenRefreshFailed(ip, err.Error())
		return nil, errutil.HandleError(ctx, log, err)
	}

	// Note: We don't have userID here without decoding the old token
	// For now, just log the IP
	h.audit.TokenRefresh("", ip)

	return &pb.RefreshTokenResponse{
		AccessToken:  tokenPair.AccessToken,
		RefreshToken: tokenPair.RefreshToken,
		ExpiresAt:    tokenPair.ExpiresAt.Unix(),
	}, nil
}

// Logout обрабатывает запрос на выход
func (h *Handler) Logout(ctx context.Context, req *pb.LogoutRequest) (*pb.LogoutResponse, error) {
	log := logger.FromContext(ctx, h.logger)
	ip := getClientIP(ctx)

	// Получаем userID из контекста (установлен auth interceptor)
	userID, err := errutil.GetUserIDFromContext(ctx)
	if err != nil {
		return nil, status.Error(codes.Unauthenticated, "не авторизован")
	}

	if err := h.service.Logout(ctx, userID); err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	// Audit: logout
	h.audit.Logout(userID, ip)

	return &pb.LogoutResponse{
		Success: true,
	}, nil
}

// SaveRegistrationProgress сохраняет прогресс регистрации
func (h *Handler) SaveRegistrationProgress(ctx context.Context, req *pb.SaveProgressRequest) (*pb.SaveProgressResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	if req.Phone == "" {
		return nil, status.Error(codes.InvalidArgument, "phone обязателен")
	}

	data := &authService.RegistrationProgressData{
		FirstName: req.FirstName,
		LastName:  req.LastName,
		Phone:     req.Phone,
	}

	if err := h.service.SaveRegistrationProgress(ctx, req.Phone, int(req.Step), data); err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	return &pb.SaveProgressResponse{
		Success: true,
	}, nil
}

// GetRegistrationProgress получает прогресс регистрации
func (h *Handler) GetRegistrationProgress(ctx context.Context, req *pb.GetProgressRequest) (*pb.GetProgressResponse, error) {
	log := logger.FromContext(ctx, h.logger)

	if req.Phone == "" {
		return nil, status.Error(codes.InvalidArgument, "phone обязателен")
	}

	progress, data, err := h.service.GetRegistrationProgress(ctx, req.Phone)
	if err != nil {
		return nil, errutil.HandleError(ctx, log, err)
	}

	return &pb.GetProgressResponse{
		Step:      int32(progress.Step),
		FirstName: data.FirstName,
		LastName:  data.LastName,
		Phone:     data.Phone,
	}, nil
}

// userToProto конвертирует User в proto
func userToProto(user *models.User) *pb.User {
	return &pb.User{
		Id:        user.ID,
		Email:     user.Email,
		Phone:     user.Phone,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      string(user.Role),
		Status:    string(user.Status),
		CreatedAt: user.CreatedAt.Unix(),
	}
}
