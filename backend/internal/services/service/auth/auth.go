// Package auth предоставляет бизнес-логику аутентификации
package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"time"

	"template/internal/domain/models"
	"template/internal/lib/auth"
	authStorage "template/internal/storage/postgres/auth"
)

const (
	// MaxFailedAttempts максимум неудачных попыток до блокировки
	MaxFailedAttempts = 5
	// LockDuration длительность блокировки
	LockDuration = 30 * time.Minute
	// RegistrationProgressTTL время жизни прогресса регистрации
	RegistrationProgressTTL = 24 * time.Hour
	// RefreshTokenLength длина refresh token в байтах
	RefreshTokenLength = 32
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountLocked      = errors.New("account locked")
	ErrAccountInactive    = errors.New("account inactive")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenExpired       = errors.New("token expired")
	ErrUserExists         = errors.New("user already exists")
	ErrProgressExpired    = errors.New("registration progress expired")
)

// TokenPair пара токенов
type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
}

// RegisterRequest данные для регистрации
type RegisterRequest struct {
	FirstName string
	LastName  string
	Phone     string
	Email     string
	Password  string
}

// RegistrationProgressData данные прогресса регистрации
type RegistrationProgressData struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
}

// Service интерфейс auth service
type Service interface {
	Login(ctx context.Context, email, password string) (*TokenPair, *models.User, error)
	Register(ctx context.Context, req *RegisterRequest) (*TokenPair, *models.User, error)
	RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error)
	Logout(ctx context.Context, userID string) error
	ValidateAccessToken(ctx context.Context, token string) (*auth.Claims, error)

	SaveRegistrationProgress(ctx context.Context, phone string, step int, data *RegistrationProgressData) error
	GetRegistrationProgress(ctx context.Context, phone string) (*models.RegistrationProgress, *RegistrationProgressData, error)
}

// AuthService реализация Service
type AuthService struct {
	storage              authStorage.Storage
	jwtSecret            string
	accessTokenDuration  time.Duration
	refreshTokenDuration time.Duration
	logger               *slog.Logger
}

// New создаёт новый AuthService
func New(storage authStorage.Storage, jwtSecret string, accessTokenDuration, refreshTokenDuration time.Duration, logger *slog.Logger) *AuthService {
	return &AuthService{
		storage:              storage,
		jwtSecret:            jwtSecret,
		accessTokenDuration:  accessTokenDuration,
		refreshTokenDuration: refreshTokenDuration,
		logger:               logger,
	}
}

// Login выполняет вход пользователя
func (s *AuthService) Login(ctx context.Context, email, password string) (*TokenPair, *models.User, error) {
	user, err := s.storage.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, authStorage.ErrUserNotFound) {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, err
	}

	// Проверка блокировки
	if user.IsLocked() {
		return nil, nil, ErrAccountLocked
	}

	// Проверка статуса
	if user.Status != models.UserStatusActive {
		return nil, nil, ErrAccountInactive
	}

	// Проверка пароля
	if err := auth.ComparePassword(user.PasswordHash, password); err != nil {
		// Увеличиваем счётчик неудачных попыток
		if err := s.storage.IncrementFailedAttempts(ctx, user.ID); err != nil {
			s.logger.Error("failed to increment failed attempts", "error", err, "user_id", user.ID)
		}

		// Проверяем нужно ли заблокировать
		user.FailedLoginAttempts++
		if user.FailedLoginAttempts >= MaxFailedAttempts {
			lockUntil := time.Now().Add(LockDuration)
			if err := s.storage.LockAccount(ctx, user.ID, lockUntil); err != nil {
				s.logger.Error("failed to lock account", "error", err, "user_id", user.ID)
			}
		}

		return nil, nil, ErrInvalidCredentials
	}

	// Сбрасываем счётчик неудачных попыток
	if err := s.storage.ResetFailedAttempts(ctx, user.ID); err != nil {
		s.logger.Error("failed to reset failed attempts", "error", err, "user_id", user.ID)
	}

	// Обновляем время последнего входа
	if err := s.storage.UpdateLastLogin(ctx, user.ID); err != nil {
		s.logger.Error("failed to update last login", "error", err, "user_id", user.ID)
	}

	// Генерируем токены
	tokenPair, err := s.generateTokenPair(ctx, user)
	if err != nil {
		return nil, nil, err
	}

	return tokenPair, user, nil
}

// Register регистрирует нового пользователя
func (s *AuthService) Register(ctx context.Context, req *RegisterRequest) (*TokenPair, *models.User, error) {
	// Проверяем существование пользователя
	if _, err := s.storage.GetUserByEmail(ctx, req.Email); err == nil {
		return nil, nil, ErrUserExists
	}
	if _, err := s.storage.GetUserByPhone(ctx, req.Phone); err == nil {
		return nil, nil, ErrUserExists
	}

	// Хешируем пароль
	passwordHash, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, nil, err
	}

	// Создаём пользователя
	user := &models.User{
		Email:        req.Email,
		PasswordHash: passwordHash,
		Phone:        req.Phone,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         models.RoleUser,
		Status:       models.UserStatusActive,
	}

	if err := s.storage.CreateUser(ctx, user); err != nil {
		if errors.Is(err, authStorage.ErrUserExists) {
			return nil, nil, ErrUserExists
		}
		return nil, nil, err
	}

	// Удаляем прогресс регистрации
	_ = s.storage.DeleteRegistrationProgress(ctx, req.Phone)

	// Генерируем токены
	tokenPair, err := s.generateTokenPair(ctx, user)
	if err != nil {
		return nil, nil, err
	}

	return tokenPair, user, nil
}

// RefreshToken обновляет токены
func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
	// Хешируем токен для поиска
	tokenHash, err := auth.HashToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidToken
	}

	// Получаем токен из БД
	storedToken, err := s.storage.GetRefreshToken(ctx, tokenHash)
	if err != nil {
		if errors.Is(err, authStorage.ErrTokenNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, err
	}

	// Проверяем валидность
	if !storedToken.IsValid() {
		return nil, ErrTokenExpired
	}

	// Удаляем старый токен
	if err := s.storage.DeleteRefreshToken(ctx, tokenHash); err != nil {
		s.logger.Error("failed to delete old refresh token", "error", err)
	}

	// Получаем пользователя
	user, err := s.storage.GetUserByID(ctx, storedToken.UserID)
	if err != nil {
		return nil, err
	}

	// Генерируем новые токены
	return s.generateTokenPair(ctx, user)
}

// Logout выполняет выход пользователя
func (s *AuthService) Logout(ctx context.Context, userID string) error {
	return s.storage.DeleteUserRefreshTokens(ctx, userID)
}

// ValidateAccessToken валидирует access token
func (s *AuthService) ValidateAccessToken(ctx context.Context, token string) (*auth.Claims, error) {
	return auth.ValidateToken(token, s.jwtSecret)
}

// SaveRegistrationProgress сохраняет прогресс регистрации
func (s *AuthService) SaveRegistrationProgress(ctx context.Context, phone string, step int, data *RegistrationProgressData) error {
	// Проверяем что телефон не занят
	if _, err := s.storage.GetUserByPhone(ctx, phone); err == nil {
		return ErrUserExists
	}

	dataJSON, err := json.Marshal(data)
	if err != nil {
		return err
	}

	progress := &models.RegistrationProgress{
		Phone:     phone,
		Step:      step,
		Data:      string(dataJSON),
		ExpiresAt: time.Now().Add(RegistrationProgressTTL),
	}

	return s.storage.SaveRegistrationProgress(ctx, progress)
}

// GetRegistrationProgress получает прогресс регистрации
func (s *AuthService) GetRegistrationProgress(ctx context.Context, phone string) (*models.RegistrationProgress, *RegistrationProgressData, error) {
	progress, err := s.storage.GetRegistrationProgress(ctx, phone)
	if err != nil {
		return nil, nil, err
	}

	if progress.IsExpired() {
		_ = s.storage.DeleteRegistrationProgress(ctx, phone)
		return nil, nil, ErrProgressExpired
	}

	var data RegistrationProgressData
	if err := json.Unmarshal([]byte(progress.Data), &data); err != nil {
		return nil, nil, err
	}

	return progress, &data, nil
}

// generateRefreshToken генерирует случайный refresh token
func generateRefreshToken() string {
	b := make([]byte, RefreshTokenLength)
	if _, err := rand.Read(b); err != nil {
		panic(err) // Критическая ошибка - нет источника случайности
	}
	return base64.URLEncoding.EncodeToString(b)
}

// generateTokenPair генерирует пару токенов
func (s *AuthService) generateTokenPair(ctx context.Context, user *models.User) (*TokenPair, error) {
	// Генерируем access token
	accessToken, err := auth.GenerateAccessTokenWithDuration(
		user.ID,
		user.Email,
		string(user.Role),
		s.jwtSecret,
		s.accessTokenDuration,
	)
	if err != nil {
		return nil, err
	}

	// Генерируем refresh token
	refreshToken := generateRefreshToken()
	refreshTokenHash, err := auth.HashToken(refreshToken)
	if err != nil {
		return nil, err
	}

	// Сохраняем refresh token
	tokenModel := &models.RefreshToken{
		UserID:    user.ID,
		TokenHash: refreshTokenHash,
		ExpiresAt: time.Now().Add(s.refreshTokenDuration),
	}

	if err := s.storage.SaveRefreshToken(ctx, tokenModel); err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(s.accessTokenDuration),
	}, nil
}
