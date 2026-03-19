import { Button, CircularProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation, logout } from 'entities/session';
import { useAppDispatch } from 'shared/lib/hooks';
import { api } from 'shared/api/baseApi';

export function LogoutButton() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [logoutApi, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutApi().unwrap();
    } catch {
      // Ignore errors
    } finally {
      dispatch(logout());
      // Сброс RTK Query кеша
      dispatch(api.util.resetApiState());
      navigate('/login');
    }
  };

  return (
    <Button
      onClick={handleLogout}
      disabled={isLoading}
      variant="text"
      color="error"
      size="small"
    >
      {isLoading ? <CircularProgress size={16} /> : 'Выйти'}
    </Button>
  );
}
