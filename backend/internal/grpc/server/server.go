// Package server предоставляет gRPC сервер с gRPC-Web поддержкой
package server

import (
	"context"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/improbable-eng/grpc-web/go/grpcweb"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"template/internal/config"
	adminpb "template/internal/grpc/gen/admin"
	authpb "template/internal/grpc/gen/auth"
	userpb "template/internal/grpc/gen/user"
	"template/internal/lib/interceptors"
	"template/internal/lib/ratelimit"
)

// Server gRPC сервер с gRPC-Web wrapper
type Server struct {
	grpcServer    *grpc.Server
	httpServer    *http.Server
	wrappedServer *grpcweb.WrappedGrpcServer
	rateLimiter   *ratelimit.RateLimiter
	log           *slog.Logger
}

// New создаёт новый gRPC сервер с interceptors
func New(cfg *config.Config, log *slog.Logger) *Server {
	// Rate limiter
	rl := ratelimit.NewWithLimits(
		cfg.RateLimitRequests,
		cfg.RateLimitRequests*2, // users get 2x limit
		cfg.RateLimitWindow,
		log,
	)

	// Interceptors chain (порядок важен!)
	chain := grpc.ChainUnaryInterceptor(
		interceptors.ValidationInterceptor(log),
		interceptors.CorrelationInterceptor(log),
		interceptors.TimeoutInterceptor(10*time.Second, log),
		interceptors.AuthInterceptor(cfg.JWTSecret, log),
		interceptors.RateLimitInterceptor(rl, log),
	)

	opts := []grpc.ServerOption{
		chain,
		grpc.MaxRecvMsgSize(10 * 1024 * 1024), // 10MB
		grpc.MaxSendMsgSize(10 * 1024 * 1024), // 10MB
	}

	grpcServer := grpc.NewServer(opts...)

	// Reflection для development
	if cfg.IsDevelopment() {
		reflection.Register(grpcServer)
	}

	// gRPC-Web wrapper
	wrappedServer := grpcweb.WrapServer(grpcServer,
		grpcweb.WithOriginFunc(func(origin string) bool {
			// В production проверяем allowed origins
			if cfg.IsProduction() {
				for _, allowed := range cfg.AllowedOrigins {
					if origin == allowed {
						return true
					}
				}
				return false
			}
			// В development разрешаем всё
			return true
		}),
		grpcweb.WithAllowedRequestHeaders([]string{
			"Authorization",
			"Content-Type",
			"X-Request-ID",
			"X-CSRF-Token",
		}),
	)

	return &Server{
		grpcServer:    grpcServer,
		wrappedServer: wrappedServer,
		rateLimiter:   rl,
		log:           log,
	}
}

// RegisterAuthService регистрирует auth service
func (s *Server) RegisterAuthService(handler authpb.AuthServiceServer) {
	authpb.RegisterAuthServiceServer(s.grpcServer, handler)
}

// RegisterUserService регистрирует user service
func (s *Server) RegisterUserService(handler userpb.UserServiceServer) {
	userpb.RegisterUserServiceServer(s.grpcServer, handler)
}

// RegisterAdminService регистрирует admin service
func (s *Server) RegisterAdminService(handler adminpb.AdminServiceServer) {
	adminpb.RegisterAdminServiceServer(s.grpcServer, handler)
}

// Serve запускает HTTP сервер с gRPC-Web
func (s *Server) Serve(addr string) error {
	// HTTP handler с rate limiting и correlation
	handler := s.rateLimiter.Middleware(
		interceptors.CorrelationMiddleware(
			http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if s.wrappedServer.IsGrpcWebRequest(r) || s.wrappedServer.IsAcceptableGrpcCorsRequest(r) {
					s.wrappedServer.ServeHTTP(w, r)
					return
				}
				// Health check
				if r.URL.Path == "/health" {
					w.WriteHeader(http.StatusOK)
					_, _ = w.Write([]byte("OK"))
					return
				}
				http.NotFound(w, r)
			}),
			s.log,
		),
	)

	s.httpServer = &http.Server{
		Addr:         addr,
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	s.log.Info("gRPC-Web server listening", "address", addr)
	return s.httpServer.ListenAndServe()
}

// ServeGRPC запускает чистый gRPC сервер (для внутренних сервисов)
func (s *Server) ServeGRPC(listener net.Listener) error {
	s.log.Info("gRPC server listening", "address", listener.Addr().String())
	return s.grpcServer.Serve(listener)
}

// GracefulStop останавливает сервер
func (s *Server) GracefulStop() {
	s.log.Info("stopping server...")

	// Останавливаем rate limiter
	s.rateLimiter.Stop()

	// Останавливаем gRPC
	s.grpcServer.GracefulStop()

	// Останавливаем HTTP если запущен (с таймаутом для graceful drain)
	if s.httpServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := s.httpServer.Shutdown(ctx); err != nil {
			s.log.Error("HTTP server shutdown error", "error", err)
			_ = s.httpServer.Close()
		}
	}
}
