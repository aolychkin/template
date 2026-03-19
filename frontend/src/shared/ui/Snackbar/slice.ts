import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { SnackbarState, ShowSnackbarPayload } from './types';

const initialState: SnackbarState = {
  open: false,
  message: '',
  severity: 'info',
  autoHideDuration: 6000,
  canClose: true,
};

const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    showSnackbar: (state, action: PayloadAction<ShowSnackbarPayload>) => {
      state.open = true;
      state.message = action.payload.message;
      state.severity = action.payload.severity ?? 'info';
      state.autoHideDuration = action.payload.autoHideDuration ?? 6000;
      state.canClose = action.payload.canClose ?? true;
    },
    hideSnackbar: (state) => {
      state.open = false;
    },
  },
  selectors: {
    selectSnackbar: (state) => state,
  },
});

export const { showSnackbar, hideSnackbar } = snackbarSlice.actions;
export const { selectSnackbar } = snackbarSlice.selectors;
export const snackbarReducer = snackbarSlice.reducer;
