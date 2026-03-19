/**
 * Cookie утилиты
 * 
 * Безопасная работа с cookies
 */

export const setCookie = (name: string, value: string, days: number = 7) => {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('Cookie name is required and must be a string');
    }
    if (value === undefined || value === null) {
      throw new Error('Cookie value is required');
    }
    if (typeof days !== 'number' || days <= 0) {
      throw new Error('Days must be a positive number');
    }

    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);

    if (isNaN(expires.getTime())) {
      throw new Error('Invalid expiration date');
    }

    // Проверка доступа к document (может быть недоступен в SSR)
    if (typeof document === 'undefined') {
      throw new Error('Cookies are not available');
    }

    // Безопасная проверка window.location
    let secure = '';
    try {
      if (typeof window !== 'undefined' && window.location?.protocol === 'https:') {
        secure = ';Secure';
      }
    } catch {
      console.warn('Failed to check protocol, defaulting to non-secure cookie');
    }

    const cookieString = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict${secure}`;

    try {
      document.cookie = cookieString;
    } catch (setCookieError) {
      throw new Error(`Failed to set cookie: ${setCookieError instanceof Error ? setCookieError.message : 'Unknown error'}`);
    }

    // Проверка что cookie действительно установлен
    try {
      const testValue = getCookie(name);
      if (testValue !== value) {
        throw new Error('Failed to set cookie - cookies may be disabled');
      }
    } catch {
      throw new Error('Failed to verify cookie');
    }
  } catch (error) {
    console.error('Failed to set cookie:', {
      name,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
};

export const getCookie = (name: string): string | null => {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('Cookie name is required and must be a string');
    }

    if (typeof document === 'undefined') {
      throw new Error('Cookies are not available');
    }

    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      const cookie = ca[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length);
      }
    }
    return null;
  } catch (error) {
    console.error('Failed to get cookie:', error);
    return null;
  }
};

export const deleteCookie = (name: string) => {
  try {
    if (!name || typeof name !== 'string') {
      throw new Error('Cookie name is required and must be a string');
    }

    // Проверка доступа к document
    if (typeof document === 'undefined') {
      throw new Error('Cookies are not available');
    }

    // Устанавливаем cookie с прошедшей датой истечения
    try {
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    } catch (setCookieError) {
      console.error('Failed to set cookie expiration:', setCookieError);
      throw setCookieError;
    }

    // Не проверяем удаление - браузер сам удалит expired cookie
  } catch (error) {
    console.error('Failed to delete cookie:', error);
    // Не пробрасываем ошибку - deleteCookie должен выполниться всегда
  }
};
