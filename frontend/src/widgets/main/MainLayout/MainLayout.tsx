import { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector } from 'shared/lib/hooks';
import { LogoutButton } from 'features/auth/logout/LogoutButton';
import { PageTransition } from 'app/providers/PageTransition';

interface MainLayoutProps {
  children?: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function MainLayout({ children, maxWidth = 'md' }: MainLayoutProps) {
  const { user } = useAppSelector((state) => state.session);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}
      >
        <Container maxWidth={maxWidth}>
          <Toolbar variant="dense" disableGutters>
            <Typography
              variant="h6"
              component={RouterLink}
              to="/"
              color="primary"
              sx={{ textDecoration: 'none', flexGrow: 1 }}
            >
              Platform
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {user?.role === 'admin' && (
                <Button
                  component={RouterLink}
                  to="/admin"
                  size="small"
                  color="inherit"
                >
                  Админка
                </Button>
              )}
              <Button
                component={RouterLink}
                to="/profile"
                size="small"
                color="inherit"
              >
                Профиль
              </Button>
              <LogoutButton />
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <Container maxWidth={maxWidth} sx={{ py: 3 }}>
        <PageTransition>
          {children || <Outlet />}
        </PageTransition>
      </Container>
    </Box>
  );
}
