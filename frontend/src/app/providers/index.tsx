import { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { store } from '../store';
import { theme } from 'shared/config/theme';
import { Snackbar, withDialog } from 'shared/ui';

interface ProvidersProps {
  children: ReactNode;
}

function ProvidersInner({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
          <Snackbar />
        </ThemeProvider>
      </BrowserRouter>
    </Provider>
  );
}

// Оборачиваем в withDialog для поддержки useDialog()
export const Providers = withDialog(ProvidersInner);
