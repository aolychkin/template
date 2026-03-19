import { CircularProgress, Box } from '@mui/material';
import { memo } from 'react';
import type { LoaderProps } from './types';

/**
 * Loader - спиннер загрузки
 * 
 * Используется для индикации загрузки внутри компонентов.
 * Для полноэкранной загрузки используй PageLoader.
 */
export const Loader = memo(({
  isVisible = true,
  size = 24,
  color = 'primary',
  className,
  dataTestId = 'loader',
}: LoaderProps) => {
  if (!isVisible) {
    return null;
  }

  return (
    <Box
      className={className}
      data-testid={dataTestId}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        inset: 0,
      }}
    >
      <CircularProgress color={color} size={size} />
    </Box>
  );
});

Loader.displayName = 'Loader';
