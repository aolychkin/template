import { Container, Paper, Box } from '@mui/material';
import { LoginForm } from 'features/auth/login/LoginForm';
import { AuthTabs } from 'shared/ui';

export function LoginPage() {
  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper sx={{ p: 3, width: '100%' }}>
          <AuthTabs activeTab="login" />
          <LoginForm />
        </Paper>
      </Box>
    </Container>
  );
}
