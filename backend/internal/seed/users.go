package seed

import (
	"fmt"
	"log"
	"math/rand"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"template/internal/domain/models"
)

// seedUsers создаёт тестовых пользователей
func seedUsers(tx *gorm.DB) error {
	users := getTestUsers()

	for _, user := range users {
		// Проверяем существует ли пользователь
		var existing models.User
		if err := tx.Where("email = ?", user.Email).First(&existing).Error; err == nil {
			log.Printf("  ⏭ User already exists: %s", user.Email)
			continue
		}

		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		log.Printf("  ✓ Created user: %s (%s %s)", user.Email, user.FirstName, user.LastName)
	}

	return nil
}

// getTestUsers возвращает список тестовых пользователей (50+)
func getTestUsers() []models.User {
	// Хешируем пароль один раз для всех тестовых пользователей
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)

	// Базовые пользователи (admin и user для тестирования)
	users := []models.User{
		{
			Base:         models.Base{CreatedAt: time.Now().AddDate(0, -3, 0)}, // 3 месяца назад
			Email:        "admin@example.com",
			PasswordHash: string(hashedPassword),
			Phone:        "+79001234567",
			FirstName:    "Admin",
			LastName:     "User",
			Role:         models.RoleAdmin,
			Status:       models.UserStatusActive,
		},
		{
			Base:         models.Base{CreatedAt: time.Now().AddDate(0, -2, 0)}, // 2 месяца назад
			Email:        "user@example.com",
			PasswordHash: string(hashedPassword),
			Phone:        "+79001234568",
			FirstName:    "Test",
			LastName:     "User",
			Role:         models.RoleUser,
			Status:       models.UserStatusActive,
		},
	}

	// Генерируем 50+ дополнительных пользователей
	firstNames := []string{
		"Александр", "Мария", "Дмитрий", "Анна", "Сергей",
		"Елена", "Андрей", "Ольга", "Михаил", "Наталья",
		"Иван", "Екатерина", "Алексей", "Татьяна", "Николай",
		"Юлия", "Владимир", "Светлана", "Павел", "Ирина",
	}

	lastNames := []string{
		"Иванов", "Петров", "Сидоров", "Козлов", "Новиков",
		"Морозов", "Волков", "Соколов", "Лебедев", "Кузнецов",
		"Попов", "Смирнов", "Федоров", "Орлов", "Андреев",
		"Макаров", "Николаев", "Захаров", "Зайцев", "Павлов",
	}

	// Seed для воспроизводимости
	rng := rand.New(rand.NewSource(42))

	for i := 0; i < 55; i++ {
		firstName := firstNames[rng.Intn(len(firstNames))]
		lastName := lastNames[rng.Intn(len(lastNames))]

		// Роль: ~5% админы
		role := models.RoleUser
		if rng.Float64() < 0.05 {
			role = models.RoleAdmin
		}

		// Статус: ~80% активные, ~20% неактивные
		status := models.UserStatusActive
		if rng.Float64() < 0.20 {
			status = models.UserStatusInactive
		}

		// Дата регистрации: случайная за последние 90 дней
		daysAgo := rng.Intn(90)
		createdAt := time.Now().AddDate(0, 0, -daysAgo)

		users = append(users, models.User{
			Base:         models.Base{CreatedAt: createdAt},
			Email:        fmt.Sprintf("user%d@example.com", i+1),
			PasswordHash: string(hashedPassword),
			Phone:        fmt.Sprintf("+7900%07d", 1000000+i),
			FirstName:    firstName,
			LastName:     lastName,
			Role:         role,
			Status:       status,
		})
	}

	return users
}
