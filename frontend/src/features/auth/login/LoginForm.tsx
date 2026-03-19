import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useLoginMutation, setCredentials } from 'entities/session';
import { useAppDispatch } from 'shared/lib/hooks';
import { getAccessToken } from 'shared/lib/auth';
import { validateEmail } from 'shared/lib/validation';
import { api } from 'shared/api/baseApi';

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  // После логина — редирект по роли или на сохранённый путь
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const emailValidation = validateEmail(email);

  const getEmailError = () => {
    if (!touched.email) return '';
    return emailValidation.error || '';
  };

  const getPasswordError = () => {
    if (!touched.password) return '';
    return !password ? 'Пароль обязателен' : '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await login({ email, password }).unwrap();

      // Сброс кеша перед установкой новых credentials
      dispatch(api.util.resetApiState());

      dispatch(
        setCredentials({
          tokens: result.tokens,
          user: result.user,
        })
      );

      // Проверяем что cookie записался
      const token = getAccessToken();
      if (!token) {
        console.error('[LoginForm] Cookie not saved after login');
        return;
      }

      // Редирект по роли, если нет сохранённого пути
      const redirectTo = from || (result.user.role === 'admin' ? '/admin' : '/profile');
      navigate(redirectTo, { replace: true });
    } catch {
      // Error handled by RTK Query
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 2 }}>
      {error && (
        <Alert severity="error">
          Неверный email или пароль
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
        required
        autoComplete="email"
        error={!!getEmailError()}
        helperText={getEmailError()}
      />

      <TextField
        fullWidth
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
        required
        autoComplete="current-password"
        error={!!getPasswordError()}
        helperText={getPasswordError()}
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        disabled={isLoading}
        sx={{ mt: 1 }}
      >
        {isLoading ? <CircularProgress size={20} color="inherit" /> : 'Войти'}
      </Button>
    </Box>
  );
}
