// Package audit provides security event logging
package audit

import (
	"crypto/sha256"
	"encoding/hex"
	"log/slog"
	"time"
)

// EventType represents the type of audit event
type EventType string

const (
	LoginSuccess       EventType = "LOGIN_SUCCESS"
	LoginFailed        EventType = "LOGIN_FAILED"
	Logout             EventType = "LOGOUT"
	TokenRefresh       EventType = "TOKEN_REFRESH"
	TokenRefreshFailed EventType = "TOKEN_REFRESH_FAILED"
)

// Logger handles audit event logging
type Logger struct {
	log *slog.Logger
}

// New creates a new audit logger
func New(log *slog.Logger) *Logger {
	return &Logger{
		log: log.With(slog.String("component", "audit")),
	}
}

// hashEmail hashes email for GDPR compliance (first 8 bytes of SHA256)
func hashEmail(email string) string {
	hash := sha256.Sum256([]byte(email))
	return hex.EncodeToString(hash[:8])
}

// LoginSuccess logs a successful login event
func (l *Logger) LoginSuccess(userID, ip string) {
	l.log.Info("audit_event",
		slog.String("event", string(LoginSuccess)),
		slog.String("user_id", userID),
		slog.String("ip", ip),
		slog.Time("timestamp", time.Now()),
	)
}

// LoginFailed logs a failed login attempt
func (l *Logger) LoginFailed(email, ip, reason string) {
	l.log.Info("audit_event",
		slog.String("event", string(LoginFailed)),
		slog.String("email_hash", hashEmail(email)),
		slog.String("ip", ip),
		slog.String("reason", reason),
		slog.Time("timestamp", time.Now()),
	)
}

// Logout logs a logout event
func (l *Logger) Logout(userID, ip string) {
	l.log.Info("audit_event",
		slog.String("event", string(Logout)),
		slog.String("user_id", userID),
		slog.String("ip", ip),
		slog.Time("timestamp", time.Now()),
	)
}

// TokenRefresh logs a successful token refresh
func (l *Logger) TokenRefresh(userID, ip string) {
	l.log.Info("audit_event",
		slog.String("event", string(TokenRefresh)),
		slog.String("user_id", userID),
		slog.String("ip", ip),
		slog.Time("timestamp", time.Now()),
	)
}

// TokenRefreshFailed logs a failed token refresh attempt
func (l *Logger) TokenRefreshFailed(ip, reason string) {
	l.log.Info("audit_event",
		slog.String("event", string(TokenRefreshFailed)),
		slog.String("ip", ip),
		slog.String("reason", reason),
		slog.Time("timestamp", time.Now()),
	)
}
