// Package seed предоставляет функции для заполнения БД тестовыми данными
package seed

import (
	"errors"
	"log"

	"gorm.io/gorm"

	"template/internal/domain/models"
)

// Run выполняет seed базы данных
// Принципы:
// 1. Идемпотентность — повторный запуск не создаёт дубликаты
// 2. Изоляция — только для dev/test
// 3. Детерминированность — одинаковые данные при каждом запуске
// 4. Минимализм — только необходимые данные
func Run(db *gorm.DB) error {
	// Проверяем существование данных (идемпотентность)
	var userCount int64
	if err := db.Model(&models.User{}).Count(&userCount).Error; err != nil {
		return err
	}

	if userCount > 0 {
		log.Println("⏭️  Data already exists, skipping seed")
		return nil
	}

	// Выполняем seed в транзакции
	return db.Transaction(func(tx *gorm.DB) error {
		log.Println("👤 Seeding users...")
		if err := seedUsers(tx); err != nil {
			return errors.New("failed to seed users: " + err.Error())
		}

		// Добавьте другие seed функции по необходимости:
		// log.Println("👥 Seeding teams...")
		// if err := seedTeams(tx); err != nil {
		//     return errors.New("failed to seed teams: " + err.Error())
		// }

		return nil
	})
}
