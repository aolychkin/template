package errutil

import (
	"context"
	"errors"
	"log/slog"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// ContextKey для хранения данных в контексте
type contextKey string

const UserIDKey contextKey = "user_id"

// HandleError обрабатывает ошибку и возвращает gRPC status
// Логирует внутренние детали, возвращает generic сообщение клиенту
func HandleError(ctx context.Context, log *slog.Logger, err error) error {
	if err == nil {
		return nil
	}

	requestID := GetRequestIDFromContext(ctx)

	// Маппинг известных ошибок (не логируем как error)
	switch {
	case errors.Is(err, context.DeadlineExceeded):
		return status.Error(codes.DeadlineExceeded, "Превышено время ожидания")
	case errors.Is(err, context.Canceled):
		return status.Error(codes.Canceled, "Запрос отменён")
	}

	// Проверяем если это уже gRPC status
	if s, ok := status.FromError(err); ok {
		return s.Err()
	}

	// Маппинг бизнес-ошибок (возвращаем клиенту понятное сообщение)
	errMsg := err.Error()
	switch errMsg {
	case "invalid credentials":
		return status.Error(codes.Unauthenticated, "Неверный логин или пароль")
	case "account locked":
		return status.Error(codes.PermissionDenied, "Аккаунт заблокирован")
	case "account inactive":
		return status.Error(codes.PermissionDenied, "Аккаунт неактивен")
	case "invalid token":
		return status.Error(codes.Unauthenticated, "Недействительный токен")
	case "token expired":
		return status.Error(codes.Unauthenticated, "Токен истёк")
	case "user already exists":
		return status.Error(codes.AlreadyExists, "Пользователь уже существует")
	case "user not found":
		return status.Error(codes.NotFound, "Пользователь не найден")
	}

	// Логируем только неизвестные ошибки
	log.Error("request failed",
		"request_id", requestID,
		"error", err,
	)

	// Generic ошибка
	return status.Error(codes.Internal, "Внутренняя ошибка сервера")
}

// WithUserID добавляет userID в контекст
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, UserIDKey, userID)
}

// GetUserIDFromContext извлекает userID из контекста
func GetUserIDFromContext(ctx context.Context) (string, error) {
	// Сначала проверяем context value
	if id, ok := ctx.Value(UserIDKey).(string); ok && id != "" {
		return id, nil
	}

	// Затем проверяем metadata (установлен auth interceptor)
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if ids := md.Get("user-id"); len(ids) > 0 && ids[0] != "" {
			return ids[0], nil
		}
	}

	return "", errors.New("user_id not found in context")
}

// GetRequestIDFromContext извлекает request ID из контекста
func GetRequestIDFromContext(ctx context.Context) string {
	if md, ok := metadata.FromIncomingContext(ctx); ok {
		if ids := md.Get("x-request-id"); len(ids) > 0 {
			return ids[0]
		}
	}
	return ""
}

// Must паникует если err != nil (для критичных операций при инициализации)
func Must(err error) {
	if err != nil {
		panic(err)
	}
}

// MustWithValue возвращает value или паникует если err != nil
func MustWithValue[T any](value T, err error) T {
	if err != nil {
		panic(err)
	}
	return value
}

// LogError логирует ошибку с контекстом и возвращает её
func LogError(log *slog.Logger, msg string, err error, attrs ...slog.Attr) error {
	if err == nil {
		return nil
	}

	if log == nil {
		return err
	}

	args := make([]any, 0, len(attrs)+1)
	args = append(args, slog.String("error", err.Error()))
	for _, attr := range attrs {
		args = append(args, attr)
	}

	log.Error(msg, args...)
	return err
}

// LogErrorAndPanic логирует ошибку и паникует (для критичных ошибок)
func LogErrorAndPanic(log *slog.Logger, msg string, err error, attrs ...slog.Attr) {
	if err != nil {
		if log != nil {
			_ = LogError(log, msg, err, attrs...)
		}
		panic(err)
	}
}

// IgnoreError игнорирует ошибку с логированием (только для некритичных операций)
// Использовать ТОЛЬКО когда ошибка действительно может быть проигнорирована
func IgnoreError(log *slog.Logger, msg string, err error) {
	if err != nil && log != nil {
		log.Warn(msg, slog.String("error", err.Error()))
	}
}

// Validate проверяет ошибку валидации и логирует если нужно
// Возвращает ошибку для дальнейшей обработки
func Validate(log *slog.Logger, err error) error {
	if err == nil {
		return nil
	}

	if log != nil {
		log.Debug("validation failed", slog.String("error", err.Error()))
	}

	return err
}

// CheckCondition проверяет условие, иначе паникует
// Используй для assertions и проверки инвариантов
func CheckCondition(condition bool, msg string) {
	if !condition {
		panic(msg)
	}
}
