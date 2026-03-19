import { Box } from '@mui/material';
import { BG_COLORS } from 'shared/config/styles';
import type { OverlayProps } from './types';

/**
 * Overlay - полупрозрачный оверлей
 * 
 * Используется для затемнения контента при загрузке или модальных окнах.
 */
export const Overlay = ({
  children,
  isVisible = true,
  className,
  dataTestId = 'overlay',
}: OverlayProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Box
      className={className}
      data-testid={dataTestId}
      sx={{
        position: 'absolute',
        inset: 0,
        background: BG_COLORS.overlay,
        animation: 'fadeIn 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        '@keyframes fadeIn': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
      }}
    >
      {children}
    </Box>
  );
};
