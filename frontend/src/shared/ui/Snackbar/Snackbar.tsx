import { Snackbar as MuiSnackbar, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { hideSnackbar } from './slice';
import type { RootState } from 'app/store';

/**
 * Snackbar - глобальные уведомления
 * 
 * Использование:
 * 1. Добавить snackbarReducer в store
 * 2. Добавить <Snackbar /> в App
 * 3. dispatch(showSnackbar({ message: 'Успех!', severity: 'success' }))
 */
export const Snackbar = () => {
  const dispatch = useDispatch();
  const { open, message, severity, autoHideDuration, canClose } = useSelector(
    (state: RootState) => state.snackbar
  );

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    if (canClose) {
      dispatch(hideSnackbar());
    }
  };

  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        onClose={canClose ? handleClose : undefined}
        severity={severity}
        variant="standard"
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
};
