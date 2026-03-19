import { Component, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логирование ошибки
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          p={2}
        >
          <Paper sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Что-то пошло не так
            </Typography>
            <Typography color="text.secondary" paragraph>
              Произошла непредвиденная ошибка. Попробуйте обновить страницу.
            </Typography>
            <Button variant="contained" onClick={this.handleReset}>
              Попробовать снова
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
