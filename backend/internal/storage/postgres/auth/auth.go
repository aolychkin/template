// Package auth предоставляет storage layer для аутентификации
package auth

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"template/internal/domain/models"
)

var (
	ErrUserNotFound     = errors.New("user not found")
	ErrUserExists       = errors.New("user already exists")
	ErrTokenNotFound    = errors.New("refresh token not found")
	ErrProgressNotFound = errors.New("registration progress not found")
)

// Storage интерфейс auth storage
type Storage interface {
	// User operations
	CreateUser(ctx context.Context, user *models.User) error
	GetUserByID(ctx context.Context, id string) (*models.User, error)
	GetUserByEmail(ctx context.Context, email string) (*models.User, error)
	GetUserByPhone(ctx context.Context, phone string) (*models.User, error)
	UpdateUser(ctx context.Context, user *models.User) error

	// Security operations
	IncrementFailedAttempts(ctx context.Context, userID string) error
	ResetFailedAttempts(ctx context.Context, userID string) error
	LockAccount(ctx context.Context, userID string, until time.Time) error
	UpdateLastLogin(ctx context.Context, userID string) error

	// Refresh token operations
	SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error
	GetRefreshToken(ctx context.Context, tokenHash string) (*models.RefreshToken, error)
	DeleteRefreshToken(ctx context.Context, tokenHash string) error
	DeleteUserRefreshTokens(ctx context.Context, userID string) error

	// Registration progress operations
	SaveRegistrationProgress(ctx context.Context, progress *models.RegistrationProgress) error
	GetRegistrationProgress(ctx context.Context, phone string) (*models.RegistrationProgress, error)
	DeleteRegistrationProgress(ctx context.Context, phone string) error
}

// PostgresStorage реализация Storage для PostgreSQL
type PostgresStorage struct {
	db *gorm.DB
}

// New создаёт новый PostgresStorage
func New(db *gorm.DB) *PostgresStorage {
	return &PostgresStorage{db: db}
}

// CreateUser создаёт нового пользователя
func (s *PostgresStorage) CreateUser(ctx context.Context, user *models.User) error {
	result := s.db.WithContext(ctx).Create(user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return ErrUserExists
		}
		return result.Error
	}
	return nil
}

// GetUserByID получает пользователя по ID
func (s *PostgresStorage) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	var user models.User
	result := s.db.WithContext(ctx).
		Preload("Profile").
		First(&user, "id = ?", id)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

// GetUserByEmail получает пользователя по email
func (s *PostgresStorage) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var user models.User
	result := s.db.WithContext(ctx).
		Preload("Profile").
		First(&user, "email = ?", email)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

// GetUserByPhone получает пользователя по телефону
func (s *PostgresStorage) GetUserByPhone(ctx context.Context, phone string) (*models.User, error) {
	var user models.User
	result := s.db.WithContext(ctx).
		Preload("Profile").
		First(&user, "phone = ?", phone)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, result.Error
	}
	return &user, nil
}

// UpdateUser обновляет пользователя
func (s *PostgresStorage) UpdateUser(ctx context.Context, user *models.User) error {
	return s.db.WithContext(ctx).Save(user).Error
}

// IncrementFailedAttempts увеличивает счётчик неудачных попыток
func (s *PostgresStorage) IncrementFailedAttempts(ctx context.Context, userID string) error {
	return s.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", userID).
		UpdateColumn("failed_login_attempts", gorm.Expr("failed_login_attempts + 1")).
		Error
}

// ResetFailedAttempts сбрасывает счётчик неудачных попыток
func (s *PostgresStorage) ResetFailedAttempts(ctx context.Context, userID string) error {
	return s.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", userID).
		Updates(map[string]any{
			"failed_login_attempts": 0,
			"locked_until":          nil,
		}).Error
}

// LockAccount блокирует аккаунт до указанного времени
func (s *PostgresStorage) LockAccount(ctx context.Context, userID string, until time.Time) error {
	return s.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", userID).
		Update("locked_until", until).
		Error
}

// UpdateLastLogin обновляет время последнего входа
func (s *PostgresStorage) UpdateLastLogin(ctx context.Context, userID string) error {
	now := time.Now()
	return s.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", userID).
		Update("last_login_at", now).
		Error
}

// SaveRefreshToken сохраняет refresh token
func (s *PostgresStorage) SaveRefreshToken(ctx context.Context, token *models.RefreshToken) error {
	return s.db.WithContext(ctx).Create(token).Error
}

// GetRefreshToken получает refresh token по хешу
func (s *PostgresStorage) GetRefreshToken(ctx context.Context, tokenHash string) (*models.RefreshToken, error) {
	var token models.RefreshToken
	result := s.db.WithContext(ctx).First(&token, "token_hash = ?", tokenHash)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrTokenNotFound
		}
		return nil, result.Error
	}
	return &token, nil
}

// DeleteRefreshToken удаляет refresh token
func (s *PostgresStorage) DeleteRefreshToken(ctx context.Context, tokenHash string) error {
	return s.db.WithContext(ctx).
		Where("token_hash = ?", tokenHash).
		Delete(&models.RefreshToken{}).
		Error
}

// DeleteUserRefreshTokens удаляет все refresh tokens пользователя
func (s *PostgresStorage) DeleteUserRefreshTokens(ctx context.Context, userID string) error {
	return s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Delete(&models.RefreshToken{}).
		Error
}

// SaveRegistrationProgress сохраняет прогресс регистрации
func (s *PostgresStorage) SaveRegistrationProgress(ctx context.Context, progress *models.RegistrationProgress) error {
	// Upsert: обновить если существует, создать если нет
	return s.db.WithContext(ctx).
		Where("phone = ?", progress.Phone).
		Assign(models.RegistrationProgress{
			Step:      progress.Step,
			Data:      progress.Data,
			ExpiresAt: progress.ExpiresAt,
		}).
		FirstOrCreate(progress).Error
}

// GetRegistrationProgress получает прогресс регистрации по телефону
func (s *PostgresStorage) GetRegistrationProgress(ctx context.Context, phone string) (*models.RegistrationProgress, error) {
	var progress models.RegistrationProgress
	result := s.db.WithContext(ctx).First(&progress, "phone = ?", phone)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrProgressNotFound
		}
		return nil, result.Error
	}
	return &progress, nil
}

// DeleteRegistrationProgress удаляет прогресс регистрации
func (s *PostgresStorage) DeleteRegistrationProgress(ctx context.Context, phone string) error {
	return s.db.WithContext(ctx).
		Where("phone = ?", phone).
		Delete(&models.RegistrationProgress{}).
		Error
}
