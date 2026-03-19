/**
 * Admin API - RTK Query endpoints для административных функций
 */
import { api, handleGrpcError, grpcClient } from 'shared/api/baseApi';
import {
  ListUsersRequest,
} from 'shared/api/generated/user/user_pb_wrapper';
import {
  GetDashboardStatsRequest,
} from 'shared/api/generated/admin/admin_pb_wrapper';
import type { User } from 'entities/session/model/types';

// === Types ===

export interface ListUsersParams {
  limit: number;
  offset: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
}

export interface DailyRegistration {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  dailyRegistrations: DailyRegistration[];
}

// === API ===

export const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listUsers: builder.query<ListUsersResponse, ListUsersParams>({
      queryFn: async (params) => {
        try {
          const request = new ListUsersRequest();
          request.setLimit(params.limit);
          request.setOffset(params.offset);
          if (params.search) {
            request.setSearch(params.search);
          }
          if (params.role) {
            request.setRole(params.role);
          }
          if (params.status) {
            request.setStatus(params.status);
          }

          const response = await grpcClient.user.listUsers(request);

          const users = response.getUsersList().map((u) => ({
            id: u.getId(),
            email: u.getEmail(),
            phone: u.getPhone(),
            firstName: u.getFirstName(),
            lastName: u.getLastName(),
            role: u.getRole() as 'admin' | 'user',
            status: u.getStatus() as 'active' | 'inactive' | 'blocked' | 'deleted',
            createdAt: u.getCreatedAt(),
          }));

          return {
            data: {
              users,
              total: response.getTotal(),
            },
          };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      providesTags: ['User'],
    }),

    getDashboardStats: builder.query<DashboardStats, void>({
      queryFn: async () => {
        try {
          const request = new GetDashboardStatsRequest();
          const response = await grpcClient.admin.getDashboardStats(request);

          const dailyRegistrations = response.getDailyRegistrationsList().map((r) => ({
            date: r.getDate(),
            count: r.getCount(),
          }));

          return {
            data: {
              totalUsers: response.getTotalUsers(),
              activeUsers: response.getActiveUsers(),
              newUsersToday: response.getNewUsersToday(),
              newUsersThisWeek: response.getNewUsersThisWeek(),
              newUsersThisMonth: response.getNewUsersThisMonth(),
              dailyRegistrations,
            },
          };
        } catch (error) {
          return handleGrpcError(error);
        }
      },
      providesTags: ['User'],
    }),
  }),
});

export const { useListUsersQuery, useGetDashboardStatsQuery } = adminApi;
