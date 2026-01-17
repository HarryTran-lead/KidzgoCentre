/**
 * Authentication API Helper Functions
 * 
 * This file provides type-safe helper functions for authentication API calls.
 * All functions use the types and constants defined in the project.
 */

import { buildApiUrl, AUTH_ENDPOINTS } from '@/constants/apiURL';
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
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.LOGIN), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refreshToken: string): Promise<RefreshTokenApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.REFRESH_TOKEN), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(refreshToken),
  });

  return response.json();
}

/**
 * Change user password
 */
export async function changePassword(
  data: ChangePasswordRequest,
  token: string
): Promise<ChangePasswordApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.CHANGE_PASSWORD), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Get user profiles
 */
export async function getProfiles(token: string): Promise<GetProfilesApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.GET_PROFILES), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

/**
 * Request password reset email
 */
export async function forgetPassword(data: ForgetPasswordRequest): Promise<ForgetPasswordApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.FORGET_PASSWORD), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Reset password with token
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.RESET_PASSWORD), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Verify parent PIN
 */
export async function verifyParentPin(
  data: VerifyParentPinRequest,
  token: string
): Promise<VerifyParentPinApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.VERIFY_PARENT_PIN), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Select student profile
 */
export async function selectStudent(
  data: SelectStudentProfileRequest,
  token: string
): Promise<SelectStudentApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.SELECT_STUDENT), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Change user PIN
 */
export async function changePin(
  data: ChangeUserPinRequest,
  token: string
): Promise<ChangePinApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.CHANGE_PIN), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Request PIN reset
 */
export async function requestPinReset(
  data: RequestParentPinResetRequest,
  token: string
): Promise<RequestPinResetApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.REQUEST_PIN_RESET), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Get current user information
 */
export async function getUserMe(token: string): Promise<UserMeApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.ME), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}

/**
 * Logout user
 */
export async function logout(token: string): Promise<LogoutApiResponse> {
  const response = await fetch(buildApiUrl(AUTH_ENDPOINTS.LOGOUT), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
}
