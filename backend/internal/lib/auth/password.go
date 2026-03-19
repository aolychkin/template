package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12

// HashPassword хеширует пароль с использованием bcrypt
func HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password is empty")
	}

	// bcrypt ограничен 72 байтами
	if len(password) > 72 {
		return "", errors.New("password exceeds 72 bytes")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", err
	}

	if len(hashedBytes) == 0 {
		return "", errors.New("hash generation failed")
	}

	return string(hashedBytes), nil
}

// ComparePassword сравнивает пароль с хешем
func ComparePassword(hashedPassword, password string) error {
	if hashedPassword == "" || password == "" {
		return bcrypt.ErrMismatchedHashAndPassword
	}
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

// HashToken хеширует refresh token для хранения в БД (SHA256)
func HashToken(token string) (string, error) {
	if token == "" {
		return "", errors.New("token is empty")
	}

	hash := sha256.Sum256([]byte(token))
	hexHash := hex.EncodeToString(hash[:])

	if hexHash == "" {
		return "", errors.New("hash encoding failed")
	}

	return hexHash, nil
}

// CompareToken сравнивает токен с хешем (constant-time)
func CompareToken(hashedToken, token string) error {
	if hashedToken == "" || token == "" {
		return bcrypt.ErrMismatchedHashAndPassword
	}

	hash := sha256.Sum256([]byte(token))
	computedHash := hex.EncodeToString(hash[:])

	// Constant-time comparison для защиты от timing attacks
	if len(hashedToken) != len(computedHash) {
		return bcrypt.ErrMismatchedHashAndPassword
	}

	var result byte
	for i := 0; i < len(hashedToken); i++ {
		result |= hashedToken[i] ^ computedHash[i]
	}

	if result != 0 {
		return bcrypt.ErrMismatchedHashAndPassword
	}
	return nil
}
