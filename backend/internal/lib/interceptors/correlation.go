package interceptors

import (
	"context"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc"
	"google.golang.org/grpc/metadata"
)

// Typed context key для type-safety
type correlationContextKey string

const (
	requestIDKey    correlationContextKey = "request_id"
	RequestIDHeader string                = "x-request-id" // lowercase для gRPC metadata стандарта
)

// GetRequestID извлекает request ID из context
func GetRequestID(ctx context.Context) string {
	if id, ok := ctx.Value(requestIDKey).(string); ok {
		return id
	}
	return ""
}

// WithRequestID добавляет request ID в context
func WithRequestID(ctx context.Context, requestID string) context.Context {
	return context.WithValue(ctx, requestIDKey, requestID)
}

// sanitizePath удаляет sensitive данные из URL path для логирования
func sanitizePath(path string) string {
	sensitivePatterns := []string{
		"/reset-password/",
		"/verify-email/",
		"/confirm/",
		"/token/",
	}

	for _, pattern := range sensitivePatterns {
		if idx := strings.Index(path, pattern); idx != -1 {
			return path[:idx+len(pattern)] + "[REDACTED]"
		}
	}
	return path
}

// CorrelationMiddleware — HTTP middleware для генерации request ID
func CorrelationMiddleware(next http.Handler, log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Get or generate request ID (проверяем оба варианта casing)
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = r.Header.Get("x-request-id")
		}
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Add to response headers (оба варианта для совместимости)
		w.Header().Set("X-Request-ID", requestID)
		w.Header().Set("x-request-id", requestID)

		// Add to request context
		ctx := WithRequestID(r.Context(), requestID)

		// Sanitize path для логирования (убираем токены из URL)
		safePath := sanitizePath(r.URL.Path)

		// Log request start
		log.Debug("request started",
			slog.String("request_id", requestID),
			slog.String("method", r.Method),
			slog.String("path", safePath),
		)

		// Defer latency logging
		defer func() {
			log.Debug("request finished",
				slog.String("request_id", requestID),
				slog.String("method", r.Method),
				slog.String("path", safePath),
				slog.Duration("handler_latency", time.Since(start)),
			)
		}()

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// CorrelationInterceptor — gRPC interceptor для propagation request ID
func CorrelationInterceptor(log *slog.Logger) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req any,
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (any, error) {
		// Get request ID from HTTP context (уже установлен middleware)
		requestID := GetRequestID(ctx)

		if requestID == "" {
			// Fallback: get from gRPC metadata (lowercase key)
			if md, ok := metadata.FromIncomingContext(ctx); ok {
				if ids := md.Get("x-request-id"); len(ids) > 0 {
					requestID = ids[0]
				}
			}
		}

		// Если всё ещё нет — генерируем
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// ВСЕГДА кладём в context
		ctx = WithRequestID(ctx, requestID)

		// ВСЕГДА кладём в outgoing metadata (response headers)
		_ = grpc.SetHeader(ctx, metadata.Pairs("x-request-id", requestID))

		// Create logger with request ID
		reqLog := log.With(
			slog.String("request_id", requestID),
			slog.String("method", info.FullMethod),
		)

		resp, err := handler(ctx, req)

		if err != nil {
			reqLog.Error("request failed", slog.String("error", err.Error()))
		}

		return resp, err
	}
}
