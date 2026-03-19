package auth

import (
	"testing"

	"pgregory.net/rapid"
)

// Feature: fullstack-grpc-template, Property 1: Password Hashing Round-Trip
// **Validates: Requirements 4.3**
func TestPasswordHashRoundTrip(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		// Генерируем пароль от 1 до 72 символов (лимит bcrypt)
		password := rapid.StringN(1, 72, 72).Draw(t, "password")

		// Хешируем
		hash, err := HashPassword(password)
		if err != nil {
			t.Fatalf("HashPassword failed: %v", err)
		}

		// Проверяем что хеш не пустой
		if hash == "" {
			t.Fatal("Hash is empty")
		}

		// Проверяем что хеш отличается от пароля
		if hash == password {
			t.Fatal("Hash equals password")
		}

		// Проверяем round-trip
		err = ComparePassword(hash, password)
		if err != nil {
			t.Fatalf("ComparePassword failed for valid password: %v", err)
		}
	})
}

// Feature: fullstack-grpc-template, Property 2: Refresh Token Hashing Consistency
// **Validates: Requirements 4.2**
func TestRefreshTokenHashConsistency(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		token := rapid.StringN(1, 100, 100).Draw(t, "token")

		hash1, err1 := HashToken(token)
		hash2, err2 := HashToken(token)

		if err1 != nil || err2 != nil {
			t.Fatalf("HashToken failed: %v, %v", err1, err2)
		}

		if hash1 != hash2 {
			t.Fatalf("Hash not deterministic: %s != %s", hash1, hash2)
		}
	})
}

func TestCompareToken(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		token := rapid.StringN(1, 100, 100).Draw(t, "token")

		hash, err := HashToken(token)
		if err != nil {
			t.Fatalf("HashToken failed: %v", err)
		}

		// Правильный токен должен совпадать
		if err := CompareToken(hash, token); err != nil {
			t.Fatalf("CompareToken failed for valid token: %v", err)
		}

		// Неправильный токен не должен совпадать
		wrongToken := token + "x"
		if err := CompareToken(hash, wrongToken); err == nil {
			t.Fatal("CompareToken should fail for wrong token")
		}
	})
}
