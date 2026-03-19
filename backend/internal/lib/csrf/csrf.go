// Package csrf предоставляет CSRF защиту
package csrf

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"strings"
	"time"
)

var (
	ErrInvalidToken = errors.New("invalid CSRF token")
	ErrExpiredToken = errors.New("CSRF token expired")
)

// Manager управляет CSRF токенами
type Manager struct {
	secret []byte
	ttl    time.Duration
}

// New создаёт новый Manager
func New(secret string, ttl time.Duration) *Manager {
	return &Manager{
		secret: []byte(secret),
		ttl:    ttl,
	}
}

// GenerateToken генерирует CSRF токен для сессии
func (m *Manager) GenerateToken(sessionID string) string {
	// Генерируем случайный nonce
	nonce := make([]byte, 16)
	if _, err := rand.Read(nonce); err != nil {
		panic(err)
	}
	nonceStr := base64.URLEncoding.EncodeToString(nonce)

	// Timestamp
	timestamp := time.Now().Unix()

	// Создаём подпись: HMAC(secret, sessionID + nonce + timestamp)
	data := sessionID + nonceStr + string(rune(timestamp))
	mac := hmac.New(sha256.New, m.secret)
	mac.Write([]byte(data))
	signature := hex.EncodeToString(mac.Sum(nil))

	// Формат токена: nonce.timestamp.signature
	return nonceStr + "." + string(rune(timestamp)) + "." + signature
}

// ValidateToken валидирует CSRF токен
func (m *Manager) ValidateToken(token, sessionID string) error {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return ErrInvalidToken
	}

	nonceStr := parts[0]
	timestampStr := parts[1]
	signature := parts[2]

	// Проверяем подпись
	data := sessionID + nonceStr + timestampStr
	mac := hmac.New(sha256.New, m.secret)
	mac.Write([]byte(data))
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(signature), []byte(expectedSignature)) {
		return ErrInvalidToken
	}

	// Проверяем TTL
	if len(timestampStr) > 0 {
		timestamp := int64(timestampStr[0])
		if time.Now().Unix()-timestamp > int64(m.ttl.Seconds()) {
			return ErrExpiredToken
		}
	}

	return nil
}

// GenerateSimpleToken генерирует простой CSRF токен (без привязки к сессии)
func GenerateSimpleToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	return base64.URLEncoding.EncodeToString(b)
}
