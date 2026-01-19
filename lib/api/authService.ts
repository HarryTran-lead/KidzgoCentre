/**
 * Authentication API Helper Functions
 * 
 * This file provides type-safe helper functions for authentication API calls.
 * All functions use axios with automatic token injection via interceptors.
 */

import { buildApiUrl, AUTH_ENDPOINTS } from '@/constants/apiURL';
import { get, post, put } from '@/lib/axios';
import type {
  LoginRequest,
  LoginApiResponse,
  RefreshTokenApiResponse,
  ChangePasswordRequest,
  ChangePasswordApiResponse,
  ForgetPasswordRequest,
  ForgetPasswordApiResponse,
  ResetPasswordRequest,
  ResetPasswordApiResponse,
  VerifyParentPinRequest,
  VerifyParentPinApiResponse,
  SelectStudentProfileRequest,
  SelectStudentApiResponse,
  ChangeUserPinRequest,
  ChangePinApiResponse,
  RequestParentPinResetRequest,
  RequestPinResetApiResponse,
  GetProfilesApiResponse,
  UserMeApiResponse,
  LogoutApiResponse,
} from '@/types/auth';

/**
 * Login to the system
 */
export async function login(credentials: LoginRequest): Promise<LoginApiResponse> {
  return post<LoginApiResponse>(buildApiUrl(AUTH_ENDPOINTS.LOGIN), credentials);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenApiResponse> {
  return post<RefreshTokenApiResponse>(buildApiUrl(AUTH_ENDPOINTS.REFRESH_TOKEN), { refreshToken });
}

/**
 * Change user password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordApiResponse> {
  return put<ChangePasswordApiResponse>(buildApiUrl(AUTH_ENDPOINTS.CHANGE_PASSWORD), data);
}

/**
 * Get user profiles (token auto-injected by axios interceptor)
 */
export async function getProfiles(): Promise<GetProfilesApiResponse> {
  return get<GetProfilesApiResponse>(buildApiUrl(AUTH_ENDPOINTS.GET_PROFILES));
}

/**
 * Request password reset email
 */
export async function forgetPassword(data: ForgetPasswordRequest): Promise<ForgetPasswordApiResponse> {
  return post<ForgetPasswordApiResponse>(buildApiUrl(AUTH_ENDPOINTS.FORGET_PASSWORD), data);
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordApiResponse> {
  return post<ResetPasswordApiResponse>(buildApiUrl(AUTH_ENDPOINTS.RESET_PASSWORD), data);
}

/**
 * Verify parent PIN (token auto-injected)
 */
export async function verifyParentPin(data: VerifyParentPinRequest): Promise<VerifyParentPinApiResponse> {
  return post<VerifyParentPinApiResponse>(buildApiUrl(AUTH_ENDPOINTS.VERIFY_PARENT_PIN), data);
}

/**
 * Select student profile (token auto-injected)
 */
export async function selectStudent(data: SelectStudentProfileRequest): Promise<SelectStudentApiResponse> {
  return post<SelectStudentApiResponse>(buildApiUrl(AUTH_ENDPOINTS.SELECT_STUDENT), data);
}

/**
 * Change user PIN (token auto-injected)
 */
export async function changePin(data: ChangeUserPinRequest): Promise<ChangePinApiResponse> {
  return put<ChangePinApiResponse>(buildApiUrl(AUTH_ENDPOINTS.CHANGE_PIN), data);
}

/**
 * Request PIN reset (token auto-injected)
 */
export async function requestPinReset(data: RequestParentPinResetRequest): Promise<RequestPinResetApiResponse> {
  return post<RequestPinResetApiResponse>(buildApiUrl(AUTH_ENDPOINTS.REQUEST_PIN_RESET), data);
}

/**
 * Get current user information (token auto-injected)
 */
export async function getUserMe(): Promise<UserMeApiResponse> {
  return get<UserMeApiResponse>(buildApiUrl(AUTH_ENDPOINTS.ME));
}

/**
 * Logout user (token auto-injected)
 */
export async function logout(): Promise<LogoutApiResponse> {
  return post<LogoutApiResponse>(buildApiUrl(AUTH_ENDPOINTS.LOGOUT));
}
