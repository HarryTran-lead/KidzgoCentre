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
} from './auth';

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

    if (response.success) {
      toast.success({
        title: 'Đăng nhập thành công!',
        description: `Chào mừng ${response.data.user.fullName}`,
        duration: 3000,
      });
    } else {
      toast.destructive({
        title: 'Đăng nhập thất bại',
        description: response.message || 'Email hoặc mật khẩu không đúng',
        duration: 5000,
      });
    }

    return response;
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Change password with toast notifications
 */
export async function changePasswordWithToast(
  data: ChangePasswordRequest,
  token: string
): Promise<void> {
  try {
    const response = await changePasswordAPI(data, token);

    if (response.success) {
      toast.success({
        title: 'Đổi mật khẩu thành công!',
        description: 'Mật khẩu của bạn đã được cập nhật',
        duration: 3000,
      });
    } else {
      toast.destructive({
        title: 'Đổi mật khẩu thất bại',
        description: response.message || 'Mật khẩu hiện tại không đúng',
        duration: 5000,
      });
    }
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Get profiles with toast notifications
 */
export async function getProfilesWithToast(token: string) {
  try {
    const response = await getProfilesAPI(token);

    if (!response.success) {
      toast.destructive({
        title: 'Không thể tải danh sách profiles',
        description: response.message || 'Đã xảy ra lỗi khi tải danh sách profiles',
        duration: 5000,
      });
    }

    return response;
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
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

    if (response.success) {
      toast.success({
        title: 'Email đã được gửi!',
        description: 'Vui lòng kiểm tra email để đặt lại mật khẩu',
        duration: 5000,
      });
    } else {
      toast.destructive({
        title: 'Gửi email thất bại',
        description: response.message || 'Email không tồn tại trong hệ thống',
        duration: 5000,
      });
    }
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
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

    if (response.success) {
      toast.success({
        title: 'Đặt lại mật khẩu thành công!',
        description: 'Bạn có thể đăng nhập với mật khẩu mới',
        duration: 3000,
      });
    } else {
      toast.destructive({
        title: 'Đặt lại mật khẩu thất bại',
        description: response.message || 'Token không hợp lệ hoặc đã hết hạn',
        duration: 5000,
      });
    }
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Verify parent PIN with toast notifications
 */
export async function verifyParentPinWithToast(
  data: VerifyParentPinRequest,
  token: string
) {
  try {
    const response = await verifyParentPinAPI(data, token);

    if (response.success) {
      toast.success({
        title: 'Xác thực thành công!',
        description: 'PIN chính xác',
        duration: 2000,
      });
    } else {
      toast.destructive({
        title: 'Xác thực thất bại',
        description: response.message || 'PIN không đúng',
        duration: 4000,
      });
    }

    return response;
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Select student with toast notifications
 */
export async function selectStudentWithToast(
  data: SelectStudentProfileRequest,
  token: string
) {
  try {
    const response = await selectStudentAPI(data, token);

    if (response.success) {
      toast.success({
        title: 'Chuyển đổi profile thành công!',
        description: `Đang chuyển sang profile ${response.data.selectedProfile.displayName}`,
        duration: 2000,
      });
    } else {
      toast.destructive({
        title: 'Chuyển đổi profile thất bại',
        description: response.message || 'Không thể chọn profile này',
        duration: 5000,
      });
    }

    return response;
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Change PIN with toast notifications
 */
export async function changePinWithToast(
  data: ChangeUserPinRequest,
  token: string
): Promise<void> {
  try {
    const response = await changePinAPI(data, token);

    if (response.success) {
      toast.success({
        title: 'Đổi PIN thành công!',
        description: 'PIN của bạn đã được cập nhật',
        duration: 3000,
      });
    } else {
      toast.destructive({
        title: 'Đổi PIN thất bại',
        description: response.message || 'PIN hiện tại không đúng',
        duration: 5000,
      });
    }
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Request PIN reset with toast notifications
 */
export async function requestPinResetWithToast(
  data: RequestParentPinResetRequest,
  token: string
): Promise<void> {
  try {
    const response = await requestPinResetAPI(data, token);

    if (response.success) {
      toast.success({
        title: 'Yêu cầu đã được gửi!',
        description: 'Vui lòng kiểm tra email để đặt lại PIN',
        duration: 5000,
      });
    } else {
      toast.destructive({
        title: 'Gửi yêu cầu thất bại',
        description: response.message || 'Không thể gửi yêu cầu đặt lại PIN',
        duration: 5000,
      });
    }
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Get user info with toast notifications (silent on success, show error only)
 */
export async function getUserMeWithToast(token: string) {
  try {
    const response = await getUserMeAPI(token);

    if (!response.success) {
      toast.destructive({
        title: 'Không thể tải thông tin người dùng',
        description: response.message || 'Vui lòng đăng nhập lại',
        duration: 5000,
      });
    }

    return response;
  } catch (error) {
    toast.destructive({
      title: 'Lỗi kết nối',
      description: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.',
      duration: 5000,
    });
    throw error;
  }
}

/**
 * Logout with toast notifications
 */
export async function logoutWithToast(token: string): Promise<void> {
  try {
    const response = await logoutAPI(token);

    if (response.success) {
      toast.info({
        title: 'Đăng xuất thành công',
        description: 'Hẹn gặp lại bạn!',
        duration: 2000,
      });
    } else {
      // Still show success message even if API fails
      toast.info({
        title: 'Đăng xuất',
        description: 'Bạn đã được đăng xuất khỏi hệ thống',
        duration: 2000,
      });
    }
  } catch (error) {
    // Still logout locally even if API fails
    toast.info({
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

    if (!response.success) {
      toast.warning({
        title: 'Phiên đăng nhập đã hết hạn',
        description: 'Vui lòng đăng nhập lại',
        duration: 4000,
      });
    }

    return response;
  } catch (error) {
    toast.destructive({
      title: 'Lỗi xác thực',
      description: 'Không thể làm mới phiên đăng nhập. Vui lòng đăng nhập lại.',
      duration: 5000,
    });
    throw error;
  }
}

// Export all functions with original names for backward compatibility
export {
  loginAPI as login,
  refreshTokenAPI as refreshToken,
  changePasswordAPI as changePassword,
  getProfilesAPI as getProfiles,
  forgetPasswordAPI as forgetPassword,
  resetPasswordAPI as resetPassword,
  verifyParentPinAPI as verifyParentPin,
  selectStudentAPI as selectStudent,
  changePinAPI as changePin,
  requestPinResetAPI as requestPinReset,
  getUserMeAPI as getUserMe,
  logoutAPI as logout,
};
 