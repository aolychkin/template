import { Routes, Route } from 'react-router-dom';
import { Suspense } from 'react';
import { ProtectedRoute, GuestRoute, AdminRoute, RootRedirect } from 'shared/lib/auth';
import { PageLoader, ChunkErrorBoundary } from 'shared/ui';
import { AdminLayout } from 'widgets/admin/AdminLayout';
import { MainLayout } from 'widgets/main/MainLayout';
import { lazyWithRetry } from 'shared/lib/lazy';

// Lazy load all pages for code splitting

// Auth pages
const LoginPage = lazyWithRetry(() =>
  import('pages/auth/LoginPage').then(m => ({ default: m.LoginPage }))
);
const RegisterPage = lazyWithRetry(() =>
  import('pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage }))
);

// User pages
const ProfilePage = lazyWithRetry(() =>
  import('pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage }))
);
const HomePage = lazyWithRetry(() =>
  import('pages/home/HomePage').then(m => ({ default: m.HomePage }))
);

// Admin pages
const DashboardPage = lazyWithRetry(() =>
  import('pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
const UsersPage = lazyWithRetry(() =>
  import('pages/admin/UsersPage').then(m => ({ default: m.UsersPage }))
);

/**
 * Wrapper component for lazy-loaded pages with error boundary and suspense.
 */
function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ChunkErrorBoundary>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Гостевые страницы — редирект на /profile если авторизован */}
      <Route element={<GuestRoute />}>
        <Route
          path="/login"
          element={
            <LazyPage>
              <LoginPage />
            </LazyPage>
          }
        />
        <Route
          path="/register"
          element={
            <LazyPage>
              <RegisterPage />
            </LazyPage>
          }
        />
      </Route>

      {/* Защищённые страницы с MainLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route
            path="/profile"
            element={
              <LazyPage>
                <ProfilePage />
              </LazyPage>
            }
          />
          <Route
            path="/home"
            element={
              <LazyPage>
                <HomePage />
              </LazyPage>
            }
          />
        </Route>

        {/* Админка — только для role=admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={
                <LazyPage>
                  <DashboardPage />
                </LazyPage>
              }
            />
            <Route
              path="users"
              element={
                <LazyPage>
                  <UsersPage />
                </LazyPage>
              }
            />
          </Route>
        </Route>
      </Route>

      {/* Корень — редирект по роли */}
      <Route path="/" element={<RootRedirect />} />

      {/* Fallback */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
