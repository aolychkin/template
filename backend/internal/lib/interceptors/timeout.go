package interceptors

import (
	"context"
	"log/slog"
	"time"

	"google.golang.org/grpc"
)

// TimeoutInterceptor — safety net для handlers без timeout
// ВАЖНО: НЕ запускает handler в goroutine, только добавляет deadline в context.
// Handler сам должен проверять ctx.Done() — это его ответственность.
func TimeoutInterceptor(timeout time.Duration, log *slog.Logger) grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req any,
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (any, error) {
		// Если context уже имеет deadline меньше нашего — не перезаписываем
		if deadline, ok := ctx.Deadline(); ok {
			if time.Until(deadline) < timeout {
				return handler(ctx, req)
			}
		}

		// Просто добавляем deadline в context
		// Handler сам должен проверять ctx.Done()
		ctx, cancel := context.WithTimeout(ctx, timeout)
		defer cancel()

		return handler(ctx, req)
	}
}
