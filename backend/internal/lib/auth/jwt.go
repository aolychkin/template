package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const (
	AccessTokenDuration  = 15 * time.Minute
	RefreshTokenDuration = 7 * 24 * time.Hour
)

var (
	ErrInvalidToken = errors.New("invalid token")
	ErrExpiredToken = errors.New("token expired")
)

// Claims представляет JWT claims
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role,omitempty"` // admin, user, etc.
	jwt.RegisteredClaims
}

// GenerateAccessToken генерирует access token
func GenerateAccessToken(userID, email, role, secret string) (string, error) {
	if secret == "" {
		return "", errors.New("JWT secret is empty")
	}
	if userID == "" {
		return "", errors.New("userID is required")
	}

	now := time.Now()
	expiresAt := now.Add(AccessTokenDuration)

	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", errors.New("failed to sign token: " + err.Error())
	}

	return tokenString, nil
}

// GenerateRefreshToken генерирует refresh token
func GenerateRefreshToken(userID string, secret string) (string, time.Time, error) {
	if secret == "" {
		return "", time.Time{}, errors.New("JWT secret is empty")
	}
	if userID == "" {
		return "", time.Time{}, errors.New("userID is required")
	}

	expiry := time.Now().Add(RefreshTokenDuration)

	claims := Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiry),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", time.Time{}, errors.New("failed to sign refresh token: " + err.Error())
	}
	return tokenString, expiry, nil
}

// ValidateToken валидирует JWT token
func ValidateToken(tokenString, secret string) (*Claims, error) {
	if tokenString == "" {
		return nil, ErrInvalidToken
	}
	if secret == "" {
		return nil, errors.New("JWT secret is empty")
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	// Проверяем что token не nil
	if token == nil {
		return nil, ErrInvalidToken
	}

	// Проверяем тип claims и валидность токена
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// Проверяем что claims не nil
	if claims == nil {
		return nil, ErrInvalidToken
	}

	// Проверяем обязательные поля
	if claims.UserID == "" {
		return nil, errors.New("userID is missing in token")
	}

	// Проверяем срок действия
	now := time.Now()
	if claims.ExpiresAt == nil {
		return nil, errors.New("expiration time is missing")
	}
	if claims.ExpiresAt.Before(now) {
		return nil, ErrExpiredToken
	}

	// Проверяем IssuedAt
	if claims.IssuedAt != nil && claims.IssuedAt.After(now) {
		return nil, errors.New("token issued in the future")
	}

	return claims, nil
}
