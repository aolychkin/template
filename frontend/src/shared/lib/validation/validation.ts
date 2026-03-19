export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Email validation (RFC 5322 simplified)
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, error: 'Email обязателен' };
  }

  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Некорректный формат email' };
  }

  return { isValid: true };
}

// Phone validation (Russian format)
const phoneRegex = /^(\+7|8)\d{10}$/;

export function validatePhone(phone: string): ValidationResult {
  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  if (!cleaned) {
    return { isValid: false, error: 'Телефон обязателен' };
  }

  if (!phoneRegex.test(cleaned)) {
    return { isValid: false, error: 'Некорректный формат телефона' };
  }

  return { isValid: true };
}

// Password validation
interface PasswordRequirements {
  minLength?: number;
  requireUpper?: boolean;
  requireLower?: boolean;
  requireDigit?: boolean;
  requireSpecial?: boolean;
}

const defaultRequirements: PasswordRequirements = {
  minLength: 8,
  requireUpper: true,
  requireLower: true,
  requireDigit: true,
  requireSpecial: false,
};

export function validatePassword(
  password: string,
  requirements: PasswordRequirements = defaultRequirements
): ValidationResult {
  const { minLength = 8, requireUpper, requireLower, requireDigit, requireSpecial } = requirements;

  if (!password) {
    return { isValid: false, error: 'Пароль обязателен' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Минимум ${minLength} символов` };
  }

  if (requireUpper && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Нужна заглавная буква' };
  }

  if (requireLower && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Нужна строчная буква' };
  }

  if (requireDigit && !/\d/.test(password)) {
    return { isValid: false, error: 'Нужна цифра' };
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Нужен специальный символ' };
  }

  return { isValid: true };
}

// XSS sanitization
const htmlTagRegex = /<[^>]*>/g;
const scriptRegex = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

export function sanitizeXSS(input: string): string {
  if (!input) return '';

  return input
    .replace(scriptRegex, '')
    .replace(htmlTagRegex, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}

// Check if string contains potential XSS
export function containsXSS(input: string): boolean {
  if (!input) return false;

  return (
    htmlTagRegex.test(input) ||
    /javascript:/i.test(input) ||
    /on\w+=/i.test(input)
  );
}
