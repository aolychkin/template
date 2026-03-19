import { Container, Paper, Box } from '@mui/material';
import { RegisterForm } from 'widgets/auth/RegisterForm/RegisterForm';
import { AuthTabs } from 'shared/ui';

export function RegisterPage() {
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
          <AuthTabs activeTab="register" />
          <RegisterForm />
        </Paper>
      </Box>
    </Container>
  );
}
