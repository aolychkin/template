import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, Alert, Button, Typography } from '@mui/material';
import CoffeeIcon from '@mui/icons-material/Coffee';
import LogoutIcon from '@mui/icons-material/Logout';
import { useGetProfileQuery } from 'entities/user';
import { setCredentials } from 'entities/session';
import { getAccessToken, getRefreshToken, clearAuth } from './auth';
import { useEffect, useState, useCallback } from 'react';
import { Loader } from 'shared/ui';
import { useAppDispatch } from 'shared/lib/hooks';

// Cold start: timeout 15 сек, до 3 retry с exponential backoff
const COLD_START_TIMEOUT = 15000;
const MAX_RETRIES = 3;

/**
 * Внутренний компонент для аутентифицированных пользователей
 * Хуки вызываются безусловно
 */
function AuthenticatedRoute() {
  const dispatch = useAppDispatch();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Валидируем токен через GetProfile
  const { data: user, isLoading, error, refetch } = useGetProfileQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  // Сохраняем user в store после успешной загрузки
  useEffect(() => {
    if (user) {
      const accessToken = getAccessToken();
      const refreshToken = getRefreshToken();
      if (accessToken && refreshToken) {
        dispatch(setCredentials({
          tokens: {
            accessToken,
            refreshToken,
            expiresAt: 0, // Не знаем точное время, но токен валиден
          },
          user,
        }));
      }
    }
  }, [user, dispatch]);

  // Retry с exponential backoff
  const handleRetry = useCallback(() => {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      console.log(`[ProtectedRoute] Retry ${retryCount + 1}/${MAX_RETRIES} after ${delay}ms`);
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        refetch();
      }, delay);
    } else {
      console.error(`[ProtectedRoute] All ${MAX_RETRIES} retries failed`);
      setHasTimedOut(true);
    }
  }, [retryCount, refetch]);

  // Timeout — если не ответил за 15 сек, пробуем retry
  useEffect(() => {
    if (isLoading && !hasTimedOut) {
      const timer = window.setTimeout(() => {
        console.warn(`[ProtectedRoute] GetProfile timeout after ${COLD_START_TIMEOUT}ms`);
        handleRetry();
      }, COLD_START_TIMEOUT);

      return () => window.clearTimeout(timer);
    }
  }, [isLoading, hasTimedOut, handleRetry]);

  // Timeout — сервис "уснул" (после всех retry)
  if (hasTimedOut) {
    const handleWakeUp = () => {
      setHasTimedOut(false);
      setRetryCount(0);
      window.location.reload();
    };

    const handleLogout = () => {
      clearAuth();
      window.location.href = '/login';
    };

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 2, p: 3 }}>
        <Alert severity="info" sx={{ maxWidth: 400 }}>
          <Typography variant="body2">
            Сервис уснул, пока вас не было. Это нормально для экономии ресурсов.
          </Typography>
        </Alert>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="contained" size="small" startIcon={<CoffeeIcon />} onClick={handleWakeUp}>
            Разбудить
          </Button>
          <Button variant="outlined" size="small" startIcon={<LogoutIcon />} onClick={handleLogout}>
            Выйти
          </Button>
        </Box>
      </Box>
    );
  }

  // Loader пока проверяем токен (показываем retry count если > 0)
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: 2 }}>
        <Box sx={{ position: 'relative', width: 40, height: 40 }}>
          <Loader isVisible size={40} />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {retryCount > 0 ? `Пробуждаем сервис... (попытка ${retryCount + 1})` : 'Проверка авторизации...'}
        </Typography>
      </Box>
    );
  }

  // Если токен невалиден — разлогиниваем
  if (error) {
    console.warn('[ProtectedRoute] Token validation failed:', error);
    clearAuth();
    return <Navigate to="/login" replace />;
  }

  // Токен валиден — рендерим защищённый контент
  return <Outlet />;
}

/**
 * ProtectedRoute — защита роутов для авторизованных пользователей
 */
export function ProtectedRoute() {
  const location = useLocation();
  const hasToken = !!getAccessToken();

  // Если нет токена — сразу редирект (без хуков)
  if (!hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Есть токен — рендерим компонент с хуками
  return <AuthenticatedRoute />;
}
