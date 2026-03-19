// Package validate предоставляет утилиты валидации
package validate

import (
	"errors"
	"regexp"
	"strings"
	"unicode"
)

var (
	ErrInvalidEmail    = errors.New("invalid email format")
	ErrInvalidPhone    = errors.New("invalid phone format")
	ErrPasswordTooWeak = errors.New("password too weak")
)

// Регулярные выражения для валидации
var (
	// RFC 5322 упрощённый email regex
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
	// Российский телефон: +7XXXXXXXXXX или 8XXXXXXXXXX
	phoneRegex = regexp.MustCompile(`^(\+7|8)\d{10}$`)
)

// PasswordRequirements требования к паролю
type PasswordRequirements struct {
	MinLength      int
	RequireUpper   bool
	RequireLower   bool
	RequireDigit   bool
	RequireSpecial bool
}

// DefaultPasswordRequirements требования по умолчанию
var DefaultPasswordRequirements = PasswordRequirements{
	MinLength:      8,
	RequireUpper:   true,
	RequireLower:   true,
	RequireDigit:   true,
	RequireSpecial: false,
}

// ValidateEmail валидирует email
func ValidateEmail(email string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	if !emailRegex.MatchString(email) {
		return ErrInvalidEmail
	}
	return nil
}

// ValidatePhone валидирует телефон
func ValidatePhone(phone string) error {
	// Убираем пробелы, скобки, дефисы
	phone = strings.Map(func(r rune) rune {
		if unicode.IsDigit(r) || r == '+' {
			return r
		}
		return -1
	}, phone)

	if !phoneRegex.MatchString(phone) {
		return ErrInvalidPhone
	}
	return nil
}

// NormalizePhone нормализует телефон к формату +7XXXXXXXXXX
func NormalizePhone(phone string) string {
	// Убираем всё кроме цифр и +
	phone = strings.Map(func(r rune) rune {
		if unicode.IsDigit(r) || r == '+' {
			return r
		}
		return -1
	}, phone)

	// Заменяем 8 на +7
	if strings.HasPrefix(phone, "8") && len(phone) == 11 {
		phone = "+7" + phone[1:]
	}

	return phone
}

// ValidatePassword валидирует пароль
func ValidatePassword(password string) error {
	return ValidatePasswordWithRequirements(password, DefaultPasswordRequirements)
}

// ValidatePasswordWithRequirements валидирует пароль с кастомными требованиями
func ValidatePasswordWithRequirements(password string, req PasswordRequirements) error {
	if len(password) < req.MinLength {
		return ErrPasswordTooWeak
	}

	var hasUpper, hasLower, hasDigit, hasSpecial bool
	for _, r := range password {
		switch {
		case unicode.IsUpper(r):
			hasUpper = true
		case unicode.IsLower(r):
			hasLower = true
		case unicode.IsDigit(r):
			hasDigit = true
		case unicode.IsPunct(r) || unicode.IsSymbol(r):
			hasSpecial = true
		}
	}

	if req.RequireUpper && !hasUpper {
		return ErrPasswordTooWeak
	}
	if req.RequireLower && !hasLower {
		return ErrPasswordTooWeak
	}
	if req.RequireDigit && !hasDigit {
		return ErrPasswordTooWeak
	}
	if req.RequireSpecial && !hasSpecial {
		return ErrPasswordTooWeak
	}

	return nil
}

// ValidationResult результат валидации
type ValidationResult struct {
	IsValid bool
	Errors  []string
}

// ValidateAll валидирует несколько полей
func ValidateAll(validations ...func() error) ValidationResult {
	result := ValidationResult{IsValid: true}
	for _, v := range validations {
		if err := v(); err != nil {
			result.IsValid = false
			result.Errors = append(result.Errors, err.Error())
		}
	}
	return result
}
