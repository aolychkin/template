/**
 * Кастомные правила валидации для yup
 * 
 * Расширяет yup дополнительными методами для gRPC проекта
 */
import * as yup from 'yup';

// Расширяем типы yup
declare module 'yup' {
  interface StringSchema {
    phone(message?: string): StringSchema;
    noXSS(message?: string): StringSchema;
    cyrillicName(message?: string): StringSchema;
  }
}

/**
 * Валидация российского телефона
 * Форматы: +7XXXXXXXXXX, 8XXXXXXXXXX
 */
function phone(this: yup.StringSchema, message = 'Некорректный формат телефона') {
  return this.test('phone', message, (value) => {
    if (!value) return true; // Пустое значение проверяется через required()
    const cleaned = value.replace(/[\s\-()]/g, '');
    return /^(\+7|8)\d{10}$/.test(cleaned);
  });
}

/**
 * Проверка на XSS-инъекции
 */
function noXSS(this: yup.StringSchema, message = 'Недопустимые символы') {
  return this.test('noXSS', message, (value) => {
    if (!value) return true;
    // Проверяем на HTML теги, javascript: и обработчики событий
    const xssPatterns = [
      /<[^>]*>/,           // HTML теги
      /javascript:/i,      // javascript: протокол
      /on\w+=/i,           // Обработчики событий (onclick=, onerror=, etc)
      /data:/i,            // data: протокол
    ];
    return !xssPatterns.some(pattern => pattern.test(value));
  });
}

/**
 * Валидация кириллического имени
 * Разрешает: кириллицу, пробелы, дефисы
 */
function cyrillicName(this: yup.StringSchema, message = 'Только кириллица, пробелы и дефисы') {
  return this.test('cyrillicName', message, (value) => {
    if (!value) return true;
    return /^[А-ЯЁа-яё\s-]+$/.test(value);
  });
}

// Регистрируем методы
yup.addMethod(yup.string, 'phone', phone);
yup.addMethod(yup.string, 'noXSS', noXSS);
yup.addMethod(yup.string, 'cyrillicName', cyrillicName);

// Экспортируем расширенный yup
export { yup };

/**
 * Готовые схемы для частых случаев
 */
export const commonSchemas = {
  email: yup.string()
    .email('Некорректный email')
    .noXSS()
    .required('Email обязателен'),

  password: yup.string()
    .min(8, 'Минимум 8 символов')
    .matches(/[A-Z]/, 'Нужна заглавная буква')
    .matches(/[a-z]/, 'Нужна строчная буква')
    .matches(/\d/, 'Нужна цифра')
    .required('Пароль обязателен'),

  phone: yup.string()
    .phone()
    .required('Телефон обязателен'),

  firstName: yup.string()
    .cyrillicName()
    .noXSS()
    .min(2, 'Минимум 2 символа')
    .max(50, 'Максимум 50 символов')
    .required('Имя обязательно'),

  lastName: yup.string()
    .cyrillicName()
    .noXSS()
    .min(2, 'Минимум 2 символа')
    .max(50, 'Максимум 50 символов')
    .required('Фамилия обязательна'),
};
