package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Base содержит общие поля для всех моделей
type Base struct {
	// ID - уникальный идентификатор (UUID)
	ID string `gorm:"type:uuid;primary_key" json:"id"`
	// CreatedAt - время создания
	CreatedAt time.Time `json:"created_at"`
	// UpdatedAt - время последнего обновления
	UpdatedAt time.Time `json:"updated_at"`
	// DeletedAt - время удаления (soft delete)
	DeletedAt *time.Time `gorm:"index" json:"deleted_at,omitempty"`
}

// BeforeCreate генерирует UUID перед созданием записи
func (b *Base) BeforeCreate(tx *gorm.DB) error {
	if tx == nil {
		return gorm.ErrInvalidTransaction
	}
	if b.ID == "" {
		newUUID := uuid.New()
		if newUUID == uuid.Nil {
			return gorm.ErrInvalidData
		}
		b.ID = newUUID.String()
	}
	return nil
}
