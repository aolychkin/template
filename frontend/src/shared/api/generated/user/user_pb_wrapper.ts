import './user_pb.js';

const proto = (globalThis as any).proto?.user;

if (!proto) {
  throw new Error('Proto user not loaded. Check that user_pb.js is imported correctly.');
}

// Проверяем каждый класс
if (!proto.User) throw new Error('Proto class User not found');
if (!proto.UserProfile) throw new Error('Proto class UserProfile not found');
if (!proto.GetProfileRequest) throw new Error('Proto class GetProfileRequest not found');
if (!proto.GetProfileResponse) throw new Error('Proto class GetProfileResponse not found');
if (!proto.UpdateProfileRequest) throw new Error('Proto class UpdateProfileRequest not found');
if (!proto.UpdateProfileResponse) throw new Error('Proto class UpdateProfileResponse not found');
if (!proto.DeleteAccountRequest) throw new Error('Proto class DeleteAccountRequest not found');
if (!proto.DeleteAccountResponse) throw new Error('Proto class DeleteAccountResponse not found');
if (!proto.ListUsersRequest) throw new Error('Proto class ListUsersRequest not found');
if (!proto.ListUsersResponse) throw new Error('Proto class ListUsersResponse not found');

// ES Module exports
export const User = proto.User;
export const UserProfile = proto.UserProfile;
export const GetProfileRequest = proto.GetProfileRequest;
export const GetProfileResponse = proto.GetProfileResponse;
export const UpdateProfileRequest = proto.UpdateProfileRequest;
export const UpdateProfileResponse = proto.UpdateProfileResponse;
export const DeleteAccountRequest = proto.DeleteAccountRequest;
export const DeleteAccountResponse = proto.DeleteAccountResponse;
export const ListUsersRequest = proto.ListUsersRequest;
export const ListUsersResponse = proto.ListUsersResponse;
