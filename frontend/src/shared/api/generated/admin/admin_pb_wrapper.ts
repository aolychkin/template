import './admin_pb.js';

const proto = (globalThis as any).proto?.admin;

if (!proto) {
  throw new Error('Proto admin not loaded. Check that admin_pb.js is imported correctly.');
}

// Проверяем каждый класс
if (!proto.GetDashboardStatsRequest) throw new Error('Proto class GetDashboardStatsRequest not found');
if (!proto.GetDashboardStatsResponse) throw new Error('Proto class GetDashboardStatsResponse not found');
if (!proto.DailyRegistration) throw new Error('Proto class DailyRegistration not found');

// ES Module exports
export const GetDashboardStatsRequest = proto.GetDashboardStatsRequest;
export const GetDashboardStatsResponse = proto.GetDashboardStatsResponse;
export const DailyRegistration = proto.DailyRegistration;
