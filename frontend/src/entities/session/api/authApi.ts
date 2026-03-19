/**
 * Auth API - RTK Query endpoints для аутентификации
 * 
 * Использует gRPC-Web клиент для вызовов.
 */
import { api, handleGrpcError, grpcClient } from 'shared/api/baseApi';
import { setAccessToken, setRefreshToken } from 'shared/lib/auth';
import { LoginRequest, RegisterRequest } from 'shared/api/generated/auth/auth_pb_wrapper';
import type { User, TokenPair } from '../model/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
}

interface AuthResult {
  tokens: TokenPair;
  user: User;
}

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResult, LoginCredentials>({
      queryFn: async (credentials) => {
        try {
          const request = new LoginRequest();
          request.setEmail(credentials.email);
          request.setPassword(credentials.password);

          const response = await grpcClient.auth.login(request);

          const accessToken = response.getAccessToken();
          const refreshToken = response.getRefreshToken();

          // Сохраняем токены в cookies
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);

          const user = response.getUser();

          return {
            data: {
              tokens: {
                accessToken,
                refreshToken,
                expiresAt: response.getExpiresAt(),
              },
              user: {
                id: user?.getId() || '',
                email: user?.getEmail() || '',
                phone: user?.getPhone() || '',
                firstName: user?.getFirstName() || '',
                lastName: user?.getLastName() || '',
                role: user?.getRole() || 'user',
                status: user?.getStatus() || 'active',
                createdAt: user?.getCreatedAt(),
              },
            },
          };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      invalidatesTags: ['Session'],
    }),

    register: builder.mutation<AuthResult, RegisterData>({
      queryFn: async (data) => {
        try {
          const request = new RegisterRequest();
          request.setFirstName(data.firstName);
          request.setLastName(data.lastName);
          request.setPhone(data.phone);
          request.setEmail(data.email);
          request.setPassword(data.password);

          const response = await grpcClient.auth.register(request);

          const accessToken = response.getAccessToken();
          const refreshToken = response.getRefreshToken();

          // Сохраняем токены в cookies
          setAccessToken(accessToken);
          setRefreshToken(refreshToken);

          const user = response.getUser();

          return {
            data: {
              tokens: {
                accessToken,
                refreshToken,
                expiresAt: response.getExpiresAt(),
              },
              user: {
                id: user?.getId() || '',
                email: user?.getEmail() || '',
                phone: user?.getPhone() || '',
                firstName: user?.getFirstName() || '',
                lastName: user?.getLastName() || '',
                role: user?.getRole() || 'user',
                status: user?.getStatus() || 'active',
                createdAt: user?.getCreatedAt(),
              },
            },
          };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      invalidatesTags: ['Session'],
    }),

    logout: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          const { logout } = await import('shared/lib/auth');
          await logout();
          return { data: undefined };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      invalidatesTags: ['Session', 'User', 'Profile'],
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation } = authApi;
