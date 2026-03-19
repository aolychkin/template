/**
 * User API - RTK Query endpoints для работы с пользователями
 * 
 * Использует gRPC-Web клиент для вызовов.
 */
import { api, handleGrpcError, grpcClient } from 'shared/api/baseApi';
import { GetProfileRequest, UpdateProfileRequest, DeleteAccountRequest } from 'shared/api/generated/user/user_pb_wrapper';
import type { User } from 'entities/session/model/types';

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
}

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProfile: builder.query<User, void>({
      queryFn: async () => {
        try {
          const request = new GetProfileRequest();
          const response = await grpcClient.user.getProfile(request);

          const user = response.getUser();
          if (!user) {
            return {
              error: {
                status: 404,
                error: 'User not found',
              },
            };
          }

          return {
            data: {
              id: user.getId(),
              email: user.getEmail(),
              phone: user.getPhone(),
              firstName: user.getFirstName(),
              lastName: user.getLastName(),
              role: user.getRole(),
              status: user.getStatus(),
              createdAt: user.getCreatedAt(),
            },
          };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      providesTags: ['Profile'],
    }),

    updateProfile: builder.mutation<User, UpdateProfileData>({
      queryFn: async (data) => {
        try {
          const request = new UpdateProfileRequest();
          if (data.firstName) request.setFirstName(data.firstName);
          if (data.lastName) request.setLastName(data.lastName);
          if (data.avatarUrl) request.setAvatarUrl(data.avatarUrl);
          if (data.bio) request.setBio(data.bio);

          const response = await grpcClient.user.updateProfile(request);

          const user = response.getUser();
          if (!user) {
            return {
              error: {
                status: 500,
                error: 'Failed to update profile',
              },
            };
          }

          return {
            data: {
              id: user.getId(),
              email: user.getEmail(),
              phone: user.getPhone(),
              firstName: user.getFirstName(),
              lastName: user.getLastName(),
              role: user.getRole(),
              status: user.getStatus(),
              createdAt: user.getCreatedAt(),
            },
          };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      invalidatesTags: ['Profile'],
    }),

    deleteAccount: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          const request = new DeleteAccountRequest();
          await grpcClient.user.deleteAccount(request);

          // Logout после удаления аккаунта
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

export const {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteAccountMutation,
} = userApi;
