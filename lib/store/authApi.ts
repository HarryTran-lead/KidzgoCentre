import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { getAccessToken } from "@/lib/store/authToken";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RefreshTokenRequest = string | { refreshToken: string };

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type ChangePinRequest = {
  currentPin: string;
  newPin: string;
};

export type EmailRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  token: string;
  newPassword: string;
};

export type ProfileRequest = {
  profileId: string;
};

export type SelectStudentResponse = {
  accessToken?: string;
  studentId?: string;
};

export type VerifyParentPinRequest = {
  profileId: string;
  pin: string;
};

export type ApiResponse<T> = {
  isSuccess: boolean;
  data: T;
  message?: string;
};

export type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type Profile = {
  id: string;
  displayName: string;
  profileType: "Student" | "Parent";
};

export type Branch = {
  id: string;
  code: string;
  name: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
};

export type CurrentUser = {
  id: string;
  userName: string;
  fullName: string;
  email: string;
  role: string;
  branchId: string;
  branch: Branch;
  profiles: Profile[];
  selectedProfileId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
baseUrl: "/api",
    prepareHeaders: (headers) => {
      const token = getAccessToken();
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<ApiResponse<TokenResponse>, LoginRequest>({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    refreshToken: builder.mutation<ApiResponse<TokenResponse>, RefreshTokenRequest>({
      query: (body) => ({
        url: "/auth/refresh-token",
        method: "POST",
        body,
      }),
    }),
    changePassword: builder.mutation<ApiResponse<null>, ChangePasswordRequest>({
      query: (body) => ({
        url: "/auth/change-password",
        method: "PUT",
        body,
      }),
    }),
    forgetPassword: builder.mutation<ApiResponse<null>, EmailRequest>({
      query: (body) => ({
        url: "/auth/forget-password",
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<ApiResponse<null>, ResetPasswordRequest>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
      }),
    }),
    changePin: builder.mutation<ApiResponse<null>, ChangePinRequest>({
      query: (body) => ({
        url: "/auth/change-pin",
        method: "PUT",
        body,
      }),
    }),
    getProfiles: builder.query<ApiResponse<Profile[]>, void>({
      query: () => "/auth/profiles",
    }),
    verifyParentPin: builder.mutation<ApiResponse<null>, VerifyParentPinRequest>({
      query: (body) => ({
        url: "/auth/profiles/verify-parent-pin",
        method: "POST",
        body,
      }),
    }),
selectStudentProfile: builder.mutation<ApiResponse<SelectStudentResponse>, ProfileRequest>({  
      query: (body) => ({
        url: "/auth/profiles/select-student",
        method: "POST",
        body,
      }),
    }),
    requestParentPinReset: builder.mutation<ApiResponse<null>, ProfileRequest>({
      query: (body) => ({
        url: "/auth/profiles/request-pin-reset",
        method: "POST",
        body,
      }),
    }),
    getCurrentUser: builder.query<ApiResponse<CurrentUser>, void>({
      query: () => "/me",
    }),
    logout: builder.mutation<ApiResponse<null>, void>({
      query: () => ({
        url: "/me/logout",
        method: "POST",
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRefreshTokenMutation,
  useChangePasswordMutation,
  useForgetPasswordMutation,
  useResetPasswordMutation,
  useChangePinMutation,
  useGetProfilesQuery,
  useVerifyParentPinMutation,
  useSelectStudentProfileMutation,
  useRequestParentPinResetMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;