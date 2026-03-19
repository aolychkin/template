package interceptors

import (
	"context"
	"log/slog"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"template/internal/lib/ratelimit"
)

// Typed context key для userID
type userIDContextKey string

const userIDKey userIDContextKey = "user_id"

// Специальные лимиты для чувствительных методов (запросов в минуту на IP)
var sensitiveMethodLimits = map[string]int{
	"/auth.AuthService/RefreshToken": 10, // 10 req/min per IP
}

// GetUserID извлекает userID из context (установлен AuthInterceptor)
func GetUserID(ctx context.Context) string {
	if id, ok := ctx.Value(userIDKey).(string); ok {
		return id
	}
	return ""
}

// WithUserID добавляет userID в context
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// getClientIPFromContext извлекает IP клиента из gRPC metadata
func getClientIPFromContext(ctx context.Context) string {
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if xff := md.Get("x-forwarded-for"); len(xff) > 0 {
			return xff[0]
		}
		if xri := md.Get("x-real-ip"); len(xri) > 0 {
			return xri[0]
		}
	}
	return "unknown"
}

// RateLimitInterceptor — проверяет rate limit по userID (после AuthInterceptor)
// IP rate limit проверяется в HTTP middleware
func RateLimitInterceptor(rl *ratelimit.RateLimiter, log *slog.Logger) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req any,
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (any, error) {
		// Проверяем специальный лимит для чувствительных методов (по IP)
		if limit, ok := sensitiveMethodLimits[info.FullMethod]; ok {
			ip := getClientIPFromContext(ctx)
			// Используем отдельный ключ для каждого метода
			key := ip + ":" + info.FullMethod
			if !rl.AllowWithLimit(key, limit) {
				log.Warn("sensitive method rate limit exceeded",
					slog.String("method", info.FullMethod),
					slog.String("ip", ip),
					slog.Int("limit", limit),
				)
				return nil, status.Error(codes.ResourceExhausted, "rate limit exceeded")
			}
		}

		// Получаем userID из context (установлен AuthInterceptor)
		userID := GetUserID(ctx)

		if userID != "" {
			// Аутентифицированный пользователь — проверяем user limit
			if !rl.AllowUser(userID) {
				log.Warn("rate limit exceeded for user",
					slog.String("user_id", userID),
					slog.String("method", info.FullMethod),
				)
				return nil, status.Error(codes.ResourceExhausted, "rate limit exceeded")
			}
		}
		// IP rate limit проверяется в HTTP middleware

		return handler(ctx, req)
	}
}
