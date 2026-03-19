package seed

// Этот файл содержит тестовые данные для seed
// Добавляйте сюда константы и структуры для тестовых данных

// TestPassword - пароль для всех тестовых пользователей
const TestPassword = "password123"

// TestEmails - email адреса тестовых пользователей
var TestEmails = struct {
	Admin string
	User  string
}{
	Admin: "admin@example.com",
	User:  "user@example.com",
}
