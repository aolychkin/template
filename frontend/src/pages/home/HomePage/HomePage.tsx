import { Paper, Typography, Box, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from 'shared/lib/hooks';

export function HomePage() {
  const { user } = useAppSelector((state) => state.session);

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h1" mb={2}>
        Главная
      </Typography>

      {user && (
        <Typography variant="h6" gutterBottom>
          Привет, {user.firstName}! 👋
        </Typography>
      )}

      <Typography variant="body2" color="text.secondary" paragraph>
        Это главная страница вашего приложения. Здесь вы можете добавить
        основной контент и функциональность.
      </Typography>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button component={RouterLink} to="/profile" variant="outlined">
          Профиль
        </Button>
        {user?.role === 'admin' && (
          <Button component={RouterLink} to="/admin" variant="contained">
            Админка
          </Button>
        )}
      </Box>
    </Paper>
  );
}
