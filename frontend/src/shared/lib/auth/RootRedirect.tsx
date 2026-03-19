import { Navigate } from 'react-router-dom';
import { useAppSelector } from 'shared/lib/hooks';
import { getAccessToken } from './auth';

/**
 * RootRedirect — редирект с корня на нужную страницу
 * - Не авторизован → /login
 * - Админ → /admin
 * - Пользователь → /profile
 */
export function RootRedirect() {
  const hasToken = !!getAccessToken();
  const { user } = useAppSelector((state) => state.session);

  // Если нет токена — на логин
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  // Если есть пользователь — редирект по роли
  if (user) {
    if (user.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/profile" replace />;
  }

  // По умолчанию — на профиль (пока загружается user)
  return <Navigate to="/profile" replace />;
}
