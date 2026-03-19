import { Box, Tabs, Tab } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export interface AuthTabsProps {
  activeTab: 'login' | 'register';
}

export function AuthTabs({ activeTab }: AuthTabsProps) {
  const navigate = useNavigate();

  const handleChange = (_: React.SyntheticEvent, newValue: 'login' | 'register') => {
    navigate(newValue === 'login' ? '/login' : '/register');
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, mt: -1 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        centered
      >
        <Tab label="Вход" value="login" />
        <Tab label="Регистрация" value="register" />
      </Tabs>
    </Box>
  );
}
