import { ReactNode } from 'react';
import { Box, Paper, Typography, useMediaQuery, useTheme } from '@mui/material';

export interface StatCardProps {
  title: string;
  shortTitle?: string;
  value: string | number;
  icon: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error';
}

export function StatCard({ title, shortTitle, value, icon, color = 'primary' }: StatCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const displayTitle = isMobile && shortTitle ? shortTitle : title;

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            bgcolor: `${color}.light`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: `${color}.main`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" noWrap>
            {displayTitle}
          </Typography>
          <Typography variant="h5">
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
