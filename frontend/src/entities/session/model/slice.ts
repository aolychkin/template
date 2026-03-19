import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Session, User, TokenPair } from './types';

const initialState: Session = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ tokens: TokenPair; user: User }>
    ) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.tokens.accessToken;
      state.refreshToken = action.payload.tokens.refreshToken;
      state.expiresAt = action.payload.tokens.expiresAt;
      state.user = action.payload.user;
    },
    updateTokens: (state, action: PayloadAction<TokenPair>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.expiresAt = action.payload.expiresAt;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.expiresAt = null;
      state.user = null;
    },
  },
});

export const { setCredentials, updateTokens, logout } = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
