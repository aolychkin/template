// Error Boundary
export { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';

// Loaders
export { Loader, type LoaderProps } from './Loader';
export { PageLoader } from './PageLoader';

// Overlay
export { Overlay, type OverlayProps } from './Overlay';

// Snackbar (глобальные уведомления)
export {
  Snackbar,
  snackbarReducer,
  showSnackbar,
  hideSnackbar,
  selectSnackbar,
  type SnackbarState,
  type SnackbarSeverity,
} from './Snackbar';

// Dialog (модальные окна)
export {
  DialogWindow,
  DialogContext,
  useDialog,
  withDialog,
  type DialogWindowProps,
} from './DialogWindow';

// Cards
export { StatCard, type StatCardProps } from './StatCard';

// Auth
export { AuthTabs, type AuthTabsProps } from './AuthTabs';

// Phone
export { PhoneInput, type PhoneInputProps } from './PhoneInput';

// Empty State
export { EmptyState, type EmptyStateProps } from './EmptyState';

// Chunk Error Boundary
export { ChunkErrorBoundary } from './ChunkErrorBoundary';
