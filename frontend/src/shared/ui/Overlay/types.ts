import type { ReactNode } from 'react';

export interface OverlayProps {
  /** Контент внутри оверлея */
  children?: ReactNode;
  /** Показывать ли оверлей */
  isVisible?: boolean;
  /** Дополнительный className */
  className?: string;
  /** data-testid для тестов */
  dataTestId?: string;
}
