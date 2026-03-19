// Package logger предоставляет structured logging на основе slog
package logger

import (
	"context"
	"log/slog"
	"os"
)

// ContextKey для хранения request ID в контексте
type contextKey string

const RequestIDKey contextKey = "request_id"

// New создаёт новый logger с JSON output
func New(level string) *slog.Logger {
	var logLevel slog.Level
	switch level {
	case "debug":
		logLevel = slog.LevelDebug
	case "info":
		logLevel = slog.LevelInfo
	case "warn":
		logLevel = slog.LevelWarn
	case "error":
		logLevel = slog.LevelError
	default:
		logLevel = slog.LevelInfo
	}

	opts := &slog.HandlerOptions{
		Level: logLevel,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			// Форматирование времени
			if a.Key == slog.TimeKey {
				return slog.Attr{Key: "timestamp", Value: a.Value}
			}
			return a
		},
	}

	handler := slog.NewJSONHandler(os.Stdout, opts)
	return slog.New(handler)
}

// WithRequestID добавляет request ID в контекст
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, RequestIDKey, requestID)
}

// GetRequestID извлекает request ID из контекста
func GetRequestID(ctx context.Context) string {
	if id, ok := ctx.Value(RequestIDKey).(string); ok {
		return id
	}
	return ""
}

// FromContext создаёт logger с request ID из контекста
func FromContext(ctx context.Context, base *slog.Logger) *slog.Logger {
	if requestID := GetRequestID(ctx); requestID != "" {
		return base.With("request_id", requestID)
	}
	return base
}
