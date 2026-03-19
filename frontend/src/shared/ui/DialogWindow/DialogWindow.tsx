import { Dialog } from '@mui/material';
import type { DialogWindowProps } from './types';

/**
 * DialogWindow - модальное окно
 * 
 * Обычно используется через useDialog() хук, а не напрямую.
 */
export const DialogWindow = ({
  content,
  maxWidth = 'sm',
  fullWidth = false,
  onBackdropClick,
  dataTestId,
}: DialogWindowProps) => {
  const isOpen = content !== null;

  return (
    <Dialog
      open={isOpen}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      onClose={(_event, reason) => {
        if (onBackdropClick && reason === 'backdropClick') {
          onBackdropClick();
        }
      }}
      slotProps={{
        paper: {
          'data-testid': dataTestId,
        } as Record<string, unknown>,
      }}
    >
      {content}
    </Dialog>
  );
};
