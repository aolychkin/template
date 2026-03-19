export interface LoaderProps {
  /** Показывать ли лоадер */
  isVisible?: boolean;
  /** Размер спиннера */
  size?: number;
  /** Цвет спиннера */
  color?: 'primary' | 'secondary' | 'inherit';
  /** Дополнительный className */
  className?: string;
  /** data-testid для тестов */
  dataTestId?: string;
}
