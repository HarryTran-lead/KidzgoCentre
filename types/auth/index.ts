import { ApiResponse } from '../apiResponse';

// ==================== Request Interfaces ====================

// Login Request
export interface LoginRequest {
  email: string;
  password: string;
}

// Refresh Token Request
export type RefreshTokenRequest = string;

// Change Password Request
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Update User Me Request
export interface UpdateUserMeRequest {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
}

// Forget Password Request
export interface ForgetPasswordRequest {
  email: string;
}


// Reset Password Request
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Verify Parent PIN Request
export interface VerifyParentPinRequest {
  profileId: string;
  pin: string;
}

// Select Student Profile Request
export interface SelectStudentProfileRequest {
  profileId: string;
}

// Change User PIN Request
export interface ChangeUserPinRequest {
  currentPin: string;
  newPin: string;
}

// Request Parent PIN Reset Request
export interface RequestParentPinResetRequest {
  profileId: string;
}

// Request PIN Reset via Zalo OTP
export interface RequestPinResetZaloOtpRequest {
  profileId: string;
}

// Verify PIN Reset Zalo OTP
export interface VerifyPinResetZaloOtpRequest {
  challengeId: string;
  otp: string;
}

// Reset PIN with token
export interface ResetPinRequest {
  token: string;
  newPin: string;
}

// ==================== Response Interfaces ====================

export interface UserProfile {
  id: string;
  userId?: string;
    studentId?: string;

  profileType: "Parent" | "Student"; 
  displayName: string;
  hasPinSetup?: boolean;
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Login Response
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: number;
  userId: string;
}

// Refresh Token Response
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// Get Profiles Response
export interface GetProfilesResponse {
  profiles?: UserProfile[];
  data?: UserProfile[];
  selectedProfileId?: string;
}

// Verify Parent PIN Response
export interface VerifyParentPinResponse {
  success: boolean;
  message?: string;
}

// Request PIN Reset Zalo OTP Response
export interface RequestPinResetZaloOtpResponse {
  challengeId: string;
  otpExpiresAt: string;
}

// Verify PIN Reset Zalo OTP Response
export interface VerifyPinResetZaloOtpResponse {
  resetToken: string;
  expiresAt: string;
}

// Select Student Response
export interface SelectStudentResponse {
  success: boolean;
selectedProfile?: UserProfile;
  accessToken?: string;
  studentId?: string;  message?: string;
}

// User/Me Response
export interface UserMeResponse {
  id: string;
  email: string;
  userName: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  branchId?: string;
  branchName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  profiles?: UserProfile[];
  permissions?: string[];
  selectedProfile?: UserProfile;
}

// ==================== API Response Types ====================

export type LoginApiResponse = ApiResponse<LoginResponse>;
export type RefreshTokenApiResponse = ApiResponse<RefreshTokenResponse>;
export type ChangePasswordApiResponse = ApiResponse<{ message: string }>;
export type GetProfilesApiResponse = ApiResponse<GetProfilesResponse>;
export type ForgetPasswordApiResponse = ApiResponse<{ message: string }>;
export type ResetPasswordApiResponse = ApiResponse<{ message: string }>;
export type VerifyParentPinApiResponse = ApiResponse<VerifyParentPinResponse>;
export type SelectStudentApiResponse = ApiResponse<SelectStudentResponse>;
export type ChangePinApiResponse = ApiResponse<{ message: string }>;
export type RequestPinResetApiResponse = ApiResponse<{ message: string }>;
export type RequestPinResetZaloOtpApiResponse = ApiResponse<RequestPinResetZaloOtpResponse>;
export type VerifyPinResetZaloOtpApiResponse = ApiResponse<VerifyPinResetZaloOtpResponse>;
export type ResetPinApiResponse = ApiResponse<{ message: string }>;
export type UserMeApiResponse = ApiResponse<UserMeResponse>;
export type UpdateUserMeApiResponse = ApiResponse<UserMeResponse>;
export type LogoutApiResponse = ApiResponse<{ message: string }>;
