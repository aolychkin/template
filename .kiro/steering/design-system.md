---
inclusion: fileMatch
fileMatchPattern: "**/*.tsx"
---

# Design System - Дизайн-система проекта

> Стандарты визуального оформления и UI компонентов.

---

## 🎨 Цвета

<!-- TODO: Настроить под ваш бренд -->

### Primary
- **Primary:** `#08A6A5` (бирюзовый)
- **Primary hover:** `#079392`
- **Primary light:** `rgba(8, 166, 165, 0.08)`

### Secondary
- **Secondary:** `#E83866` (розоватый)
- **Secondary hover:** `#D42F5A`
- **Secondary light:** `rgba(232, 56, 102, 0.08)`

### Фоны
- **Overlay:** `rgba(255, 255, 255, 0.7)` — полупрозрачный белый
- **Overlay dark:** `rgba(0, 0, 0, 0.5)` — полупрозрачный тёмный
- **Table:** `#f9f9f9` — фон таблиц
- **Hover:** `rgba(0, 0, 0, 0.04)` — hover эффект

---

## 📐 Border Radius

| Элемент | Значение | MUI sx |
|---------|----------|--------|
| Поля ввода | 32px | `borderRadius: 4` |
| Выпадающие списки | 24px | `borderRadius: 3` |
| Paper контейнер | 32px | `borderRadius: 4` |
| Кнопки | 32px | `borderRadius: 4` |
| Alerts | 24px | `borderRadius: 3` |

---

## 📱 Breakpoints

### Media Queries (CSS)
```typescript
import { CUSTOM_MEDIA } from 'shared/config';

// Использование в sx
sx={{
  display: { xs: 'none', md: 'block' }
}}
```

### Константы
```typescript
export const CUSTOM_MEDIA = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  notMobile: '(min-width: 769px)',
  notDesktop: '(max-width: 1024px)',
};

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
};
```

---

## 🎬 Анимации

### Константы
```typescript
import { EASING, FADE_IN_ANIMATION } from 'shared/config';

// Easing функции
export const EASING = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
  accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
};
```

### Использование
```typescript
// В sx
sx={{
  transition: `all 280ms ${EASING.standard}`,
}}

// Keyframes анимация
sx={{
  animation: 'fadeIn 280ms cubic-bezier(0.4, 0, 0.2, 1)',
  '@keyframes fadeIn': {
    '0%': { opacity: 0 },
    '100%': { opacity: 1 },
  },
}}
```

---

## 📚 Z-Index слои

```typescript
export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
};
```

---

## 🧩 UI Компоненты

### Loader
```tsx
import { Loader } from 'shared/ui';

// Внутри компонента (относительное позиционирование)
<Box sx={{ position: 'relative', minHeight: 200 }}>
  <Loader isVisible={isLoading} />
  {content}
</Box>
```

### PageLoader
```tsx
import { PageLoader } from 'shared/ui';

// Полноэкранный лоадер
if (isLoading) return <PageLoader />;
```

### Overlay
```tsx
import { Overlay, Loader } from 'shared/ui';

// Оверлей с лоадером
<Box sx={{ position: 'relative' }}>
  {content}
  <Overlay isVisible={isLoading}>
    <Loader isVisible />
  </Overlay>
</Box>
```

### Snackbar (глобальные уведомления)
```tsx
import { showSnackbar } from 'shared/ui';
import { useAppDispatch } from 'shared/lib/hooks';

const dispatch = useAppDispatch();

// Показать уведомление
dispatch(showSnackbar({ 
  message: 'Успешно сохранено!', 
  severity: 'success' 
}));

// Варианты severity: 'success' | 'error' | 'warning' | 'info'
```

### DialogWindow (модальные окна)
```tsx
import { useDialog } from 'shared/ui';

const { show, hide } = useDialog();

// Показать диалог
show({
  content: <ConfirmDialog onConfirm={handleConfirm} onCancel={hide} />,
  maxWidth: 'sm',
  fullWidth: true,
});

// Закрыть диалог
hide();
```

### ErrorBoundary
```tsx
import { ErrorBoundary } from 'shared/ui';

<ErrorBoundary fallback={<CustomError />}>
  <RiskyComponent />
</ErrorBoundary>
```

---

## 📝 Типографика

### ⚠️ iOS Auto-Zoom Prevention
Минимальный размер шрифта для input — **16px** (глобально в theme.ts).

### Адаптивные размеры
```typescript
// Заголовки
fontSize: { xs: '0.875rem', sm: '1.25rem' }  // 14px → 20px

// Мелкий текст
fontSize: { xs: '0.6rem', sm: '0.75rem' }  // 9.6px → 12px
```

---

## 📱 Grid система

### Узкие поля
```typescript
// Поле + чекбокс
<Grid item xs={8} sm={9} md={10}>поле</Grid>
<Grid item xs={4} sm={3} md={2}>чекбокс</Grid>
```

### Spacing
```typescript
spacing={{ xs: 1, sm: 1.5 }}
gap: { xs: 1.5, sm: 2 }
```

### Высота кнопок
```typescript
height: { xs: 37, sm: 40 }
```

---

## 🖼️ Картинки

### WebP с fallback
```tsx
<Box component="picture">
  <source srcSet={imageWebP} type="image/webp" />
  <Box
    component="img"
    src={imageJpeg}
    alt="Description"
    loading="lazy"
    decoding="async"
  />
</Box>
```

---

## ⚠️ Важные правила

### Секции форм
**ВСЕГДА** оборачивай в `<Box>`, **НЕ** в Fragment:
```tsx
// ❌ Неправильно
<>
  <Typography>Заголовок</Typography>
  <Grid>...</Grid>
</>

// ✅ Правильно
<Box>
  <Typography sx={{ mb: 1 }}>Заголовок</Typography>
  <Grid>...</Grid>
</Box>
```

### Transient props (styled-components)
Используй префикс `$` для props которые не должны попадать в DOM:
```tsx
const Button = styled.button<{ $variant?: 'primary' }>`
  background: ${({ $variant }) => $variant === 'primary' ? 'blue' : 'gray'};
`;
```

---

## 📋 Чеклист

- [ ] `borderRadius: 4` для полей, `borderRadius: 3` для списков
- [ ] Белый фон для полей (`bgcolor: 'white'`)
- [ ] Адаптивные шрифты `{ xs: ..., sm: ... }`
- [ ] **НЕ переопределяй fontSize для input** (16px для iOS)
- [ ] Секции форм в `<Box>`, не Fragment
- [ ] Высота кнопок `height: { xs: 37, sm: 40 }`
- [ ] Используй `showSnackbar` для уведомлений
- [ ] Используй `useDialog` для модальных окон
