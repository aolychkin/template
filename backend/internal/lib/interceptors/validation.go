package interceptors

import (
	"context"
	"log/slog"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// ValidationInterceptor проверяет базовые требования для всех gRPC методов
func ValidationInterceptor(log *slog.Logger) grpc.UnaryServerInterceptor {
	return func(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (any, error) {
		if ctx == nil {
			if log != nil {
				log.Error("interceptor: context is nil", slog.String("method", info.FullMethod))
			}
			return nil, status.Error(codes.InvalidArgument, "context is nil")
		}

		if req == nil {
			if log != nil {
				log.Error("interceptor: request is nil", slog.String("method", info.FullMethod))
			}
			return nil, status.Error(codes.InvalidArgument, "request is nil")
		}

		return handler(ctx, req)
	}
}
