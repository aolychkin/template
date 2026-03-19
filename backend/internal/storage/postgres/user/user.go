// Package user предоставляет storage layer для пользователей
package user

import (
	"context"
	"errors"
	"time"

	"gorm.io/gorm"

	"template/internal/domain/models"
)

var (
	ErrUserNotFound = errors.New("user not found")
)

// Storage интерфейс user storage
type Storage interface {
	GetByID(ctx context.Context, id string) (*models.User, error)
	Update(ctx context.Context, user *models.User) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, filter *ListFilter) ([]*models.User, int64, error)

	// Profile operations
	GetProfile(ctx context.Context, userID string) (*models.UserProfile, error)
	UpdateProfile(ctx context.Context, profile *models.UserProfile) error
	CreateProfile(ctx context.Context, profile *models.UserProfile) error

	// Statistics operations
	CountAll(ctx context.Context) (int64, error)
	CountByStatus(ctx context.Context, status models.UserStatus) (int64, error)
	CountByDateRange(ctx context.Context, from, to time.Time) (int64, error)
	GetDailyRegistrations(ctx context.Context, days int) ([]DailyRegistration, error)
}

// DailyRegistration данные о регистрациях за день
type DailyRegistration struct {
	Date  time.Time
	Count int64
}

// ListFilter фильтр для списка пользователей
type ListFilter struct {
	Role   *models.UserRole
	Status *models.UserStatus
	Search *string // Поиск по имени/email
	Limit  int
	Offset int
}

// PostgresStorage реализация Storage для PostgreSQL
type PostgresStorage struct {
	db *gorm.DB
}

// New создаёт новый PostgresStorage
func New(db *gorm.DB) *PostgresStorage {
	return &PostgresStorage{db: db}
}

// GetByID получает пользователя по ID
func (s *PostgresStorage) GetByID(ctx context.Context, id string) (*models.User, error) {
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

// Update обновляет пользователя
func (s *PostgresStorage) Update(ctx context.Context, user *models.User) error {
	return s.db.WithContext(ctx).Save(user).Error
}

// Delete мягко удаляет пользователя
func (s *PostgresStorage) Delete(ctx context.Context, id string) error {
	result := s.db.WithContext(ctx).
		Model(&models.User{}).
		Where("id = ?", id).
		Update("status", models.UserStatusDeleted)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return ErrUserNotFound
	}
	return nil
}

// List возвращает список пользователей с фильтрацией
func (s *PostgresStorage) List(ctx context.Context, filter *ListFilter) ([]*models.User, int64, error) {
	var users []*models.User
	var total int64

	query := s.db.WithContext(ctx).Model(&models.User{})

	// Применяем фильтры
	if filter.Role != nil {
		query = query.Where("role = ?", *filter.Role)
	}
	if filter.Status != nil {
		query = query.Where("status = ?", *filter.Status)
	}
	if filter.Search != nil && *filter.Search != "" {
		search := "%" + *filter.Search + "%"
		query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ? OR phone ILIKE ? OR CONCAT(first_name, ' ', last_name) ILIKE ?", search, search, search, search, search)
	}

	// Считаем общее количество
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Применяем пагинацию
	if filter.Limit > 0 {
		query = query.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	// Получаем данные
	if err := query.Preload("Profile").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// GetProfile получает профиль пользователя
func (s *PostgresStorage) GetProfile(ctx context.Context, userID string) (*models.UserProfile, error) {
	var profile models.UserProfile
	result := s.db.WithContext(ctx).First(&profile, "user_id = ?", userID)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, ErrUserNotFound
		}
		return nil, result.Error
	}
	return &profile, nil
}

// UpdateProfile обновляет профиль пользователя
func (s *PostgresStorage) UpdateProfile(ctx context.Context, profile *models.UserProfile) error {
	return s.db.WithContext(ctx).Save(profile).Error
}

// CreateProfile создаёт профиль пользователя
func (s *PostgresStorage) CreateProfile(ctx context.Context, profile *models.UserProfile) error {
	return s.db.WithContext(ctx).Create(profile).Error
}

// CountAll возвращает общее количество пользователей
func (s *PostgresStorage) CountAll(ctx context.Context) (int64, error) {
	var count int64
	if err := s.db.WithContext(ctx).Model(&models.User{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// CountByStatus возвращает количество пользователей с указанным статусом
func (s *PostgresStorage) CountByStatus(ctx context.Context, status models.UserStatus) (int64, error) {
	var count int64
	if err := s.db.WithContext(ctx).Model(&models.User{}).Where("status = ?", status).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// CountByDateRange возвращает количество пользователей, зарегистрированных в указанном диапазоне дат
func (s *PostgresStorage) CountByDateRange(ctx context.Context, from, to time.Time) (int64, error) {
	var count int64
	if err := s.db.WithContext(ctx).Model(&models.User{}).
		Where("created_at >= ? AND created_at < ?", from, to).
		Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

// GetDailyRegistrations возвращает количество регистраций по дням за последние N дней
func (s *PostgresStorage) GetDailyRegistrations(ctx context.Context, days int) ([]DailyRegistration, error) {
	type result struct {
		Date  time.Time
		Count int64
	}

	var results []result

	// Получаем данные за последние N дней
	startDate := time.Now().AddDate(0, 0, -days+1).Truncate(24 * time.Hour)

	err := s.db.WithContext(ctx).
		Model(&models.User{}).
		Select("DATE(created_at) as date, COUNT(*) as count").
		Where("created_at >= ?", startDate).
		Group("DATE(created_at)").
		Order("date ASC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	// Создаём map для быстрого поиска
	countByDate := make(map[string]int64)
	for _, r := range results {
		countByDate[r.Date.Format("2006-01-02")] = r.Count
	}

	// Заполняем все дни (включая дни без регистраций)
	registrations := make([]DailyRegistration, days)
	for i := 0; i < days; i++ {
		date := startDate.AddDate(0, 0, i)
		dateStr := date.Format("2006-01-02")
		registrations[i] = DailyRegistration{
			Date:  date,
			Count: countByDate[dateStr],
		}
	}

	return registrations, nil
}
