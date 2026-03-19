import { Component, ReactNode } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface ChunkErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ChunkErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for catching chunk loading failures.
 * Displays user-friendly error message in Russian with retry option.
 */
export class ChunkErrorBoundary extends Component<
  ChunkErrorBoundaryProps,
  ChunkErrorBoundaryState
> {
  constructor(props: ChunkErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    // Force page reload to retry chunk loading
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 400,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1.5,
            }}
          >
            <ErrorOutlineIcon
              sx={{ fontSize: 48, color: 'error.main', mb: 2 }}
            />
            <Typography variant="h6" gutterBottom>
              Ошибка загрузки
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Не удалось загрузить компонент. Проверьте подключение к интернету
              и попробуйте снова.
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={this.handleRetry}
            >
              Обновить страницу
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
