import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from 'shared/lib/hooks';
import { PageLoader } from 'shared/ui';

/**
 * AdminRoute — защита роутов для администраторов
 * Работает внутри ProtectedRoute (после проверки авторизации)
 */
export function AdminRoute() {
  const { user } = useAppSelector((state) => state.session);

  // Ждём загрузки пользователя (ProtectedRoute должен загрузить)
  if (!user) {
    return <PageLoader />;
  }

  // Проверяем роль
  if (user.role !== 'admin') {
    return <Navigate to="/profile" replace />;
  }

  return <Outlet />;
}
