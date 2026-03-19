import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { api } from 'shared/api/baseApi';
import { sessionReducer } from 'entities/session';
import { snackbarReducer } from 'shared/ui';

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    session: sessionReducer,
    snackbar: snackbarReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
