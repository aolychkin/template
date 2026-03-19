import './auth_pb.js';

const proto = (globalThis as any).proto?.auth;

if (!proto) {
  throw new Error('Proto auth not loaded. Check that auth_pb.js is imported correctly.');
}

// Проверяем каждый класс
if (!proto.User) throw new Error('Proto class User not found');
if (!proto.LoginRequest) throw new Error('Proto class LoginRequest not found');
if (!proto.LoginResponse) throw new Error('Proto class LoginResponse not found');
if (!proto.RegisterRequest) throw new Error('Proto class RegisterRequest not found');
if (!proto.RegisterResponse) throw new Error('Proto class RegisterResponse not found');
if (!proto.RefreshTokenRequest) throw new Error('Proto class RefreshTokenRequest not found');
if (!proto.RefreshTokenResponse) throw new Error('Proto class RefreshTokenResponse not found');
if (!proto.LogoutRequest) throw new Error('Proto class LogoutRequest not found');
if (!proto.LogoutResponse) throw new Error('Proto class LogoutResponse not found');
if (!proto.SaveProgressRequest) throw new Error('Proto class SaveProgressRequest not found');
if (!proto.SaveProgressResponse) throw new Error('Proto class SaveProgressResponse not found');
if (!proto.GetProgressRequest) throw new Error('Proto class GetProgressRequest not found');
if (!proto.GetProgressResponse) throw new Error('Proto class GetProgressResponse not found');

// ES Module exports
export const User = proto.User;
export const LoginRequest = proto.LoginRequest;
export const LoginResponse = proto.LoginResponse;
export const RegisterRequest = proto.RegisterRequest;
export const RegisterResponse = proto.RegisterResponse;
export const RefreshTokenRequest = proto.RefreshTokenRequest;
export const RefreshTokenResponse = proto.RefreshTokenResponse;
export const LogoutRequest = proto.LogoutRequest;
export const LogoutResponse = proto.LogoutResponse;
export const SaveProgressRequest = proto.SaveProgressRequest;
export const SaveProgressResponse = proto.SaveProgressResponse;
export const GetProgressRequest = proto.GetProgressRequest;
export const GetProgressResponse = proto.GetProgressResponse;
