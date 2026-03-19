package models

import (
	"time"
)

// UserStatus статус пользователя
type UserStatus string

const (
	UserStatusActive   UserStatus = "active"
	UserStatusInactive UserStatus = "inactive"
	UserStatusBlocked  UserStatus = "blocked"
	UserStatusDeleted  UserStatus = "deleted"
)

// UserRole роль пользователя (расширяемо)
type UserRole string

const (
	RoleUser  UserRole = "user"
	RoleAdmin UserRole = "admin"
)

// User основная модель пользователя
type User struct {
	Base
	Email        string     `gorm:"uniqueIndex;not null"`
	PasswordHash string     `gorm:"not null"`
	Phone        string     `gorm:"uniqueIndex;not null"`
	FirstName    string     `gorm:"not null"`
	LastName     string     `gorm:"not null"`
	Role         UserRole   `gorm:"default:'user'"`
	Status       UserStatus `gorm:"default:'active'"`

	// Security
	FailedLoginAttempts int        `gorm:"default:0"`
	LockedUntil         *time.Time `gorm:"index"`
	LastLoginAt         *time.Time

	// Relations
	Profile       *UserProfile   `gorm:"foreignKey:UserID"`
	RefreshTokens []RefreshToken `gorm:"foreignKey:UserID"`
}

// IsLocked проверяет заблокирован ли аккаунт
func (u *User) IsLocked() bool {
	if u.LockedUntil == nil {
		return false
	}
	return time.Now().Before(*u.LockedUntil)
}

// IsActive проверяет активен ли пользователь
func (u *User) IsActive() bool {
	return u.Status == UserStatusActive && !u.IsLocked()
}

// FullName возвращает полное имя
func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}

// UserProfile расширяемый профиль пользователя
type UserProfile struct {
	Base
	UserID string `gorm:"type:uuid;uniqueIndex;not null"`

	// Extensible fields - добавляйте project-specific данные здесь
	AvatarURL *string
	Bio       *string
}

// RefreshToken модель refresh токена
type RefreshToken struct {
	Base
	UserID    string    `gorm:"type:uuid;index;not null"`
	TokenHash string    `gorm:"uniqueIndex;not null"` // SHA256 hash
	ExpiresAt time.Time `gorm:"not null;index"`
	IsRevoked bool      `gorm:"default:false"`
}

// IsExpired проверяет истёк ли токен
func (rt *RefreshToken) IsExpired() bool {
	return time.Now().After(rt.ExpiresAt)
}

// IsValid проверяет валиден ли токен
func (rt *RefreshToken) IsValid() bool {
	return !rt.IsRevoked && !rt.IsExpired()
}

// RegistrationProgress прогресс регистрации (multi-step)
type RegistrationProgress struct {
	Base
	Phone     string    `gorm:"uniqueIndex;not null"`
	Step      int       `gorm:"default:1"`
	Data      string    `gorm:"type:jsonb"` // JSON с данными шагов
	ExpiresAt time.Time `gorm:"not null;index"`
}

// IsExpired проверяет истёк ли прогресс
func (rp *RegistrationProgress) IsExpired() bool {
	return time.Now().After(rp.ExpiresAt)
}
