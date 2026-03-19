import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from 'shared/lib/hooks';
import { getAccessToken } from './auth';

/**
 * Защита гостевых страниц (login, register)
 * Если пользователь авторизован — редирект по роли
 */
export function GuestRoute() {
  const hasToken = !!getAccessToken();
  const { user } = useAppSelector((state) => state.session);

  if (hasToken) {
    // Редирект по роли
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}
