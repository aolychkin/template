export type SnackbarSeverity = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
  autoHideDuration: number;
  canClose: boolean;
}

export interface ShowSnackbarPayload {
  message: string;
  severity?: SnackbarSeverity;
  autoHideDuration?: number;
  canClose?: boolean;
}
