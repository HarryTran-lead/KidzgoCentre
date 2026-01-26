/**
 * Authentication Actions with Toast Notifications
 * 
 * This file provides wrapper functions around auth API calls with toast notifications
 * for better user experience.
 */

import { toast } from '@/hooks/use-toast';
import {
  login as loginAPI,
  refreshToken as refreshTokenAPI,
  changePassword as changePasswordAPI,
  getProfiles as getProfilesAPI,
  forgetPassword as forgetPasswordAPI,
  resetPassword as resetPasswordAPI,
  verifyParentPin as verifyParentPinAPI,
  selectStudent as selectStudentAPI,
  changePin as changePinAPI,
  requestPinReset as requestPinResetAPI,
  getUserMe as getUserMeAPI,
  logout as logoutAPI,
} from './authService';
import { clearAccessToken, clearRefreshToken } from '@/lib/store/authToken';

import type {
  LoginRequest,
  LoginApiResponse,
  ChangePasswordRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
  VerifyParentPinRequest,
  SelectStudentProfileRequest,
  ChangeUserPinRequest,
  RequestParentPinResetRequest,
} from '@/types/auth';

/**
 * Login with toast notifications
 */
export async function loginWithToast(credentials: LoginRequest): Promise<LoginApiResponse> {
  try {
    const response = await loginAPI(credentials);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
      toast({
        title: 'Đăng nhập thành công!',
        description: `Chào mừng ${response.data.user.fullName}`,
        duration: 3000,
      });
    } else {
      toast({
        title: 'Đăng nhập thất bại',
        description: response.message || 'Email hoặc mật khẩu không đúng',
        duration: 5000,
        variant: 'destructive',
      });
    }

    return response;
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Change password with toast notifications
 */
export async function changePasswordWithToast(
  data: ChangePasswordRequest
): Promise<void> {
  try {
    const response = await changePasswordAPI(data);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
      toast({
        title: 'Đổi mật khẩu thành công!',
        description: 'Mật khẩu của bạn đã được cập nhật',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Đổi mật khẩu thất bại',
        description: response.message || 'Mật khẩu hiện tại không đúng',
        duration: 5000,
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Get profiles with toast notifications
 */
export async function getProfilesWithToast() {
  try {
    const response = await getProfilesAPI();
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (!isSuccess) {
      toast({
        title: 'Không thể tải danh sách profiles',
        description: response.message || 'Đã xảy ra lỗi khi tải danh sách profiles',
        duration: 5000,
        variant: 'destructive',
      });
    }

    return response;
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Forget password with toast notifications
 */
export async function forgetPasswordWithToast(data: ForgetPasswordRequest): Promise<void> {
  try {
    const response = await forgetPasswordAPI(data);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
      toast({
        title: 'Email đã được gửi!',
        description: 'Vui lòng kiểm tra email để đặt lại mật khẩu',
        duration: 5000,
      });
    } else {
      toast({
        title: 'Gửi email thất bại',
        description: response.message || 'Email không tồn tại trong hệ thống',
        duration: 5000,
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Reset password with toast notifications
 */
export async function resetPasswordWithToast(data: ResetPasswordRequest): Promise<void> {
  try {
    const response = await resetPasswordAPI(data);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
      toast({
        title: 'Đặt lại mật khẩu thành công!',
        description: 'Bạn có thể đăng nhập với mật khẩu mới',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Đặt lại mật khẩu thất bại',
        description: response.message || 'Token không hợp lệ hoặc đã hết hạn',
        duration: 5000,
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Verify parent PIN with toast notifications
 */
export async function verifyParentPinWithToast(
  data: VerifyParentPinRequest
) {
  try {
    const response = await verifyParentPinAPI(data);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
      toast({
        title: 'Xác thực thành công!',
        description: 'PIN chính xác',
        duration: 2000,
      });
    } else {
      toast({
        title: 'Xác thực thất bại',
        description: response.message || 'PIN không đúng',
        duration: 4000,
        variant: 'destructive',
      });
    }

    return response;
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Select student with toast notifications
 */
export async function selectStudentWithToast(
  data: SelectStudentProfileRequest
) {
  try {
    const response = await selectStudentAPI(data);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
            const selectedName =
        response.data?.selectedProfile?.displayName ?? "học viên đã chọn";
      toast({
        title: 'Chuyển đổi profile thành công!',
description: `Đang chuyển sang profile ${selectedName}`,   
     duration: 2000,
      });
    } else {
      toast({
        title: 'Chuyển đổi profile thất bại',
        description: response.message || 'Không thể chọn profile này',
        duration: 5000,
        variant: 'destructive',
      });
    }

    return response;
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Change PIN with toast notifications
 */
export async function changePinWithToast(
  data: ChangeUserPinRequest
): Promise<void> {
  try {
    const response = await changePinAPI(data);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
      toast({
        title: 'Đổi PIN thành công!',
        description: 'PIN của bạn đã được cập nhật',
        duration: 3000,
      });
    } else {
      toast({
        title: 'Đổi PIN thất bại',
        description: response.message || 'PIN hiện tại không đúng',
        duration: 5000,
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Request PIN reset with toast notifications
 */
export async function requestPinResetWithToast(
  data: RequestParentPinResetRequest
): Promise<void> {
  try {
    const response = await requestPinResetAPI(data);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (isSuccess) {
      toast({
        title: 'Yêu cầu đã được gửi!',
        description: 'Vui lòng kiểm tra email để đặt lại PIN',
        duration: 5000,
      });
    } else {
      toast({
        title: 'Gửi yêu cầu thất bại',
        description: response.message || 'Không thể gửi yêu cầu đặt lại PIN',
        duration: 5000,
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Get user info with toast notifications (silent on success, show error only)
 */
export async function getUserMeWithToast() {
  try {
    const response = await getUserMeAPI();
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (!isSuccess) {
      toast({
        title: 'Không thể tải thông tin người dùng',
        description: response.message || 'Vui lòng đăng nhập lại',
        duration: 5000,
        variant: 'destructive',
      });
    }

    return response;
  } catch (error) {
    toast({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}

/**
 * Logout with toast notifications
 */
export async function logoutWithToast(): Promise<void> {
  try {
    const response = await logoutAPI();
    const isSuccess = response.isSuccess ?? response.success ?? false;

    // Clear all tokens from storage
    clearAccessToken();
    clearRefreshToken();
    
    // Clear all localStorage items related to auth
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProfile');
      sessionStorage.clear();
    }

    if (isSuccess) {
      toast({
        title: 'Đăng xuất thành công',
        description: 'Hẹn gặp lại bạn!',
        duration: 2000,
      });
    } else {
      // Still show success message even if API fails
      toast({
        title: 'Đăng xuất',
        description: 'Bạn đã được đăng xuất khỏi hệ thống',
        duration: 2000,
      });
    }
  } catch (error) {
    // Still logout locally even if API fails - clear tokens
    clearAccessToken();
    clearRefreshToken();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProfile');
      sessionStorage.clear();
    }
    
    toast({
      title: 'Đăng xuất',
      description: 'Bạn đã được đăng xuất khỏi hệ thống',
      duration: 2000,
    });
  }
}

/**
 * Refresh token with toast notifications (silent unless error)
 */
export async function refreshTokenWithToast(refreshTokenValue: string) {
  try {
    const response = await refreshTokenAPI(refreshTokenValue);
    const isSuccess = response.isSuccess ?? response.success ?? false;

    if (!isSuccess) {
      toast({
        title: 'Phiên đăng nhập đã hết hạn',
        description: 'Vui lòng đăng nhập lại',
        duration: 4000,
        variant: 'default',
      });
    }

    return response;
  } catch (error) {
    toast({
      title: 'Lỗi xác thực',
      description: 'Không thể làm mới phiên đăng nhập. Vui lòng đăng nhập lại.',
      duration: 5000,
      variant: 'destructive',
    });
    throw error;
  }
}
