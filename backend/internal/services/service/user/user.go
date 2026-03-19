// Package user предоставляет бизнес-логику для пользователей
package user

import (
	"context"
	"errors"
	"log/slog"

	"template/internal/domain/models"
	userStorage "template/internal/storage/postgres/user"
)

var (
	ErrUserNotFound = errors.New("user not found")
	ErrForbidden    = errors.New("access forbidden")
)

// UpdateRequest данные для обновления пользователя
type UpdateRequest struct {
	FirstName *string
	LastName  *string
	AvatarURL *string
	Bio       *string
}

// Service интерфейс user service
type Service interface {
	GetByID(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, id string, req *UpdateRequest) (*models.User, error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, filter *userStorage.ListFilter) ([]*models.User, int64, error)

	// RBAC
	HasRole(ctx context.Context, userID string, roles ...models.UserRole) (bool, error)
	IsOwnerOrAdmin(ctx context.Context, requestingUserID, targetUserID string) (bool, error)
}

// UserService реализация Service
type UserService struct {
	storage userStorage.Storage
	logger  *slog.Logger
}

// New создаёт новый UserService
func New(storage userStorage.Storage, logger *slog.Logger) *UserService {
	return &UserService{
		storage: storage,
		logger:  logger,
	}
}

// GetByID получает пользователя по ID
func (s *UserService) GetByID(ctx context.Context, id string) (*models.User, error) {
	user, err := s.storage.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, userStorage.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}
	return user, nil
}

// Update обновляет пользователя
func (s *UserService) Update(ctx context.Context, id string, req *UpdateRequest) (*models.User, error) {
	user, err := s.storage.GetByID(ctx, id)
	if err != nil {
		if errors.Is(err, userStorage.ErrUserNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, err
	}

	// Обновляем поля пользователя
	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		user.LastName = *req.LastName
	}

	if err := s.storage.Update(ctx, user); err != nil {
		return nil, err
	}

	// Обновляем профиль если есть данные
	if req.AvatarURL != nil || req.Bio != nil {
		profile, err := s.storage.GetProfile(ctx, id)
		if err != nil {
			// Создаём профиль если не существует
			profile = &models.UserProfile{UserID: id}
		}

		if req.AvatarURL != nil {
			profile.AvatarURL = req.AvatarURL
		}
		if req.Bio != nil {
			profile.Bio = req.Bio
		}

		if profile.ID == "" {
			if err := s.storage.CreateProfile(ctx, profile); err != nil {
				s.logger.Error("failed to create profile", "error", err, "user_id", id)
			}
		} else {
			if err := s.storage.UpdateProfile(ctx, profile); err != nil {
				s.logger.Error("failed to update profile", "error", err, "user_id", id)
			}
		}
	}

	return user, nil
}

// Delete удаляет пользователя (soft delete)
func (s *UserService) Delete(ctx context.Context, id string) error {
	if err := s.storage.Delete(ctx, id); err != nil {
		if errors.Is(err, userStorage.ErrUserNotFound) {
			return ErrUserNotFound
		}
		return err
	}
	return nil
}

// List возвращает список пользователей
func (s *UserService) List(ctx context.Context, filter *userStorage.ListFilter) ([]*models.User, int64, error) {
	return s.storage.List(ctx, filter)
}

// HasRole проверяет имеет ли пользователь одну из ролей
func (s *UserService) HasRole(ctx context.Context, userID string, roles ...models.UserRole) (bool, error) {
	user, err := s.storage.GetByID(ctx, userID)
	if err != nil {
		return false, err
	}

	for _, role := range roles {
		if user.Role == role {
			return true, nil
		}
	}
	return false, nil
}

// IsOwnerOrAdmin проверяет является ли пользователь владельцем ресурса или админом
func (s *UserService) IsOwnerOrAdmin(ctx context.Context, requestingUserID, targetUserID string) (bool, error) {
	// Владелец
	if requestingUserID == targetUserID {
		return true, nil
	}

	// Админ
	return s.HasRole(ctx, requestingUserID, models.RoleAdmin)
}
