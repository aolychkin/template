import type { ReactNode } from 'react';
import type { DialogProps } from '@mui/material';

export interface DialogWindowProps {
  /** Контент диалога (null = закрыт) */
  content: ReactNode | null;
  /** Максимальная ширина */
  maxWidth?: DialogProps['maxWidth'];
  /** Растянуть на всю ширину */
  fullWidth?: boolean;
  /** Callback при клике на backdrop */
  onBackdropClick?: () => void;
  /** data-testid для тестов */
  dataTestId?: string;
}

export interface DialogContextValue {
  show: (props: Omit<DialogWindowProps, 'content'> & { content: ReactNode }) => void;
  hide: () => void;
}
