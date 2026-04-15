/**
 * Authentication API Helper Functions
 * 
 * This file provides type-safe helper functions for authentication API calls.
 * All functions call Next.js API Routes (not backend directly).
 * Token is automatically injected via axios interceptors.
 */

import { AUTH_ENDPOINTS } from '@/constants/apiURL';
import { FILE_ENDPOINTS } from '@/constants/apiURL';
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
  RequestPinResetZaloOtpRequest,
  RequestPinResetZaloOtpApiResponse,
  VerifyPinResetZaloOtpRequest,
  VerifyPinResetZaloOtpApiResponse,
  ResetPinRequest,
  ResetPinApiResponse,
  GetProfilesApiResponse,
  UserMeApiResponse,
  UpdateUserMeRequest,
  UpdateUserMeApiResponse,
  LogoutApiResponse,
} from '@/types/auth';

/**
 * Login to the system
 */
export async function login(credentials: LoginRequest): Promise<LoginApiResponse> {
  return post<LoginApiResponse>(AUTH_ENDPOINTS.LOGIN, credentials);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenApiResponse> {
  return post<RefreshTokenApiResponse>(AUTH_ENDPOINTS.REFRESH_TOKEN, { refreshToken });
}

/**
 * Change user password
 */
export async function changePassword(data: ChangePasswordRequest): Promise<ChangePasswordApiResponse> {
  return put<ChangePasswordApiResponse>(AUTH_ENDPOINTS.CHANGE_PASSWORD, data);
}

/**
 * Get user profiles (token auto-injected by axios interceptor)
 */
export async function getProfiles(params?: {
  profileType?: string;
}): Promise<GetProfilesApiResponse> {
  return get<GetProfilesApiResponse>(AUTH_ENDPOINTS.GET_PROFILES, { params });
}
/**
 * Request password reset email
 */
export async function forgetPassword(data: ForgetPasswordRequest): Promise<ForgetPasswordApiResponse> {
  return post<ForgetPasswordApiResponse>(AUTH_ENDPOINTS.FORGET_PASSWORD, data);
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordApiResponse> {
  return post<ResetPasswordApiResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, data);
}

/**
 * Verify parent PIN (token auto-injected)
 */
export async function verifyParentPin(data: VerifyParentPinRequest): Promise<VerifyParentPinApiResponse> {
  return post<VerifyParentPinApiResponse>(AUTH_ENDPOINTS.VERIFY_PARENT_PIN, data);
}

/**
 * Select student profile (token auto-injected)
 */
export async function selectStudent(data: SelectStudentProfileRequest): Promise<SelectStudentApiResponse> {
  return post<SelectStudentApiResponse>(AUTH_ENDPOINTS.SELECT_STUDENT, data);
}

/**
 * Change user PIN (token auto-injected)
 */
export async function changePin(data: ChangeUserPinRequest): Promise<ChangePinApiResponse> {
  return put<ChangePinApiResponse>(AUTH_ENDPOINTS.CHANGE_PIN, data);
}

/**
 * Request PIN reset (token auto-injected)
 */
export async function requestPinReset(data: RequestParentPinResetRequest): Promise<RequestPinResetApiResponse> {
  return post<RequestPinResetApiResponse>(AUTH_ENDPOINTS.REQUEST_PIN_RESET, data);
}

/**
 * Request PIN reset via Zalo OTP (token auto-injected)
 */
export async function requestPinResetZaloOtp(data: RequestPinResetZaloOtpRequest): Promise<RequestPinResetZaloOtpApiResponse> {
  return post<RequestPinResetZaloOtpApiResponse>(AUTH_ENDPOINTS.REQUEST_PIN_RESET_ZALO_OTP, data);
}

/**
 * Verify Zalo OTP for PIN reset (public)
 */
export async function verifyPinResetZaloOtp(data: VerifyPinResetZaloOtpRequest): Promise<VerifyPinResetZaloOtpApiResponse> {
  return post<VerifyPinResetZaloOtpApiResponse>(AUTH_ENDPOINTS.VERIFY_PIN_RESET_ZALO_OTP, data);
}

/**
 * Reset PIN with token (public)
 */
export async function resetPin(data: ResetPinRequest): Promise<ResetPinApiResponse> {
  return post<ResetPinApiResponse>(AUTH_ENDPOINTS.RESET_PIN, data);
}

/**
 * Get current user information (token auto-injected)
 */
export async function getUserMe(): Promise<UserMeApiResponse> {
  return get<UserMeApiResponse>(AUTH_ENDPOINTS.ME, {
    params: { _t: Date.now() },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });
}

/**
 * Update current user information (token auto-injected)
 */
export async function updateUserMe(data: UpdateUserMeRequest): Promise<UpdateUserMeApiResponse> {
  return put<UpdateUserMeApiResponse>(AUTH_ENDPOINTS.ME, data);
}

/**
 * Logout user (token auto-injected)
 */
export async function logout(): Promise<LogoutApiResponse> {
  return post<LogoutApiResponse>(AUTH_ENDPOINTS.LOGOUT);
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  return post<any>(FILE_ENDPOINTS.UPLOAD, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
