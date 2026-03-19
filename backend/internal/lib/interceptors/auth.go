package interceptors

import (
	"context"
	"log/slog"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// publicMethods - методы, не требующие аутентификации
// CUSTOMIZE: Добавьте свои публичные методы
var publicMethods = map[string]bool{
	"/auth.AuthService/Register":     true,
	"/auth.AuthService/Login":        true,
	"/auth.AuthService/RefreshToken": true,
}

// AuthInterceptor проверяет JWT токен и устанавливает userID в metadata
func AuthInterceptor(jwtSecret string, log *slog.Logger) grpc.UnaryServerInterceptor {
	if jwtSecret == "" {
		panic("AuthInterceptor: jwtSecret is required")
	}
	if log == nil {
		panic("AuthInterceptor: logger is required")
	}

	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		// Проверяем публичные методы
		if publicMethods[info.FullMethod] {
			return handler(ctx, req)
		}

		// Извлекаем токен из metadata
		md, ok := metadata.FromIncomingContext(ctx)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "metadata not found")
		}

		authHeaders := md.Get("authorization")
		if len(authHeaders) == 0 {
			return nil, status.Error(codes.Unauthenticated, "authorization header not found")
		}

		// Формат: "Bearer <token>"
		authHeader := authHeaders[0]
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return nil, status.Error(codes.Unauthenticated, "invalid authorization header format")
		}

		tokenString := parts[1]

		// Парсим JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, status.Error(codes.Unauthenticated, "invalid signing method")
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			log.Warn("JWT parse error", slog.String("error", err.Error()))
			return nil, status.Error(codes.Unauthenticated, "invalid token")
		}
		if !token.Valid {
			log.Warn("invalid JWT token")
			return nil, status.Error(codes.Unauthenticated, "invalid token")
		}

		// Извлекаем userID из claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "invalid token claims")
		}

		userID, ok := claims["user_id"].(string)
		if !ok || userID == "" {
			return nil, status.Error(codes.Unauthenticated, "user_id not found in token")
		}

		// Извлекаем role из claims
		role := ""
		if roleClaim, ok := claims["role"].(string); ok {
			role = roleClaim
		}

		// Устанавливаем данные в incoming metadata для использования в handlers
		md = metadata.Join(md, metadata.Pairs(
			"user-id", userID,
			"role", role,
		))
		ctx = metadata.NewIncomingContext(ctx, md)

		// Устанавливаем userID в context для RateLimitInterceptor
		ctx = WithUserID(ctx, userID)

		return handler(ctx, req)
	}
}
