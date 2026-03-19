/**
 * useScrollToErrors - скролл к первой ошибке формы
 * 
 * Работает с любой формой, ищет элементы по name или data-errorid
 */
import { useCallback, useRef } from 'react';

type ErrorsObject = Record<string, unknown>;

/**
 * Хук для автоматического скролла к первой ошибке формы
 * 
 * @example
 * const scrollToErrors = useScrollToErrors();
 * 
 * const onSubmit = async (data) => {
 *   const result = await submitForm(data);
 *   if (result.errors) {
 *     scrollToErrors(result.errors);
 *   }
 * };
 */
export function useScrollToErrors() {
  const errorsRef = useRef<ErrorsObject>({});

  const scrollToErrors = useCallback((errors?: ErrorsObject) => {
    const currentErrors = errors || errorsRef.current;

    if (!currentErrors || Object.keys(currentErrors).length === 0) {
      return;
    }

    let minOffset: number | undefined;
    let targetElement: Element | null = null;

    // Ищем элемент с минимальным offset (первый на странице)
    for (const fieldName of Object.keys(currentErrors)) {
      // Ищем по data-errorid или по name атрибуту
      const element =
        document.querySelector(`[data-errorid="${fieldName}"]`) ??
        document.getElementsByName(fieldName)[0];

      if (!element) {
        continue;
      }

      const offset = element.getBoundingClientRect().top;

      if (typeof minOffset !== 'number' || offset < minOffset) {
        minOffset = offset;
        targetElement = element;
      }
    }

    // Скроллим к найденному элементу
    if (targetElement) {
      targetElement.scrollIntoView({
        block: 'center',
        behavior: 'smooth'
      });

      // Фокусируемся на элементе если это input
      if (targetElement instanceof HTMLInputElement ||
        targetElement instanceof HTMLTextAreaElement ||
        targetElement instanceof HTMLSelectElement) {
        setTimeout(() => {
          targetElement?.focus();
        }, 300);
      }
    }
  }, []);

  // Функция для обновления ошибок (для интеграции с формами)
  const setErrors = useCallback((errors: ErrorsObject) => {
    errorsRef.current = errors;
  }, []);

  return { scrollToErrors, setErrors };
}
