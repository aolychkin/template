import { ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

export interface EmptyStateProps {
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional icon component */
  icon?: ReactNode;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * EmptyState - displays when a list or section has no content
 * 
 * Usage:
 * <EmptyState 
 *   title="Нет пользователей"
 *   description="Пользователи появятся здесь после регистрации"
 *   icon={<PeopleIcon />}
 *   action={{ label: "Добавить", onClick: handleAdd }}
 * />
 */
export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary',
          mb: 2,
          '& .MuiSvgIcon-root': {
            fontSize: 48,
          },
        }}
      >
        {icon || <InboxIcon />}
      </Box>

      <Typography variant="h6" gutterBottom>
        {title || 'Нет данных'}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: action ? 2 : 0 }}>
          {description}
        </Typography>
      )}

      {action && (
        <Button variant="outlined" size="small" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
