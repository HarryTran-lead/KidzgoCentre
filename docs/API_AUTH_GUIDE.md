# Authentication API Documentation

## 📁 Cấu trúc thư mục

```
├── constants/
│   └── apiURL.ts                    # Định nghĩa endpoints
├── types/
│   └── auth/
│       └── index.ts                 # Định nghĩa types cho auth
├── lib/
│   └── api/
│       └── auth.ts                  # Helper functions cho auth API
└── app/
    └── api/
        └── auth/                    # Next.js API routes (proxy)
            ├── login/
            ├── refresh-token/
            ├── change-password/
            ├── forget-password/
            ├── reset-password/
            ├── change-pin/
            ├── me/
            ├── logout/
            └── profile/
                ├── route.ts         # GET profiles
                ├── verify-parent-pin/
                ├── select-student/
                └── request-pin-reset/
```

## 🔧 Environment Variables

File `.env`:
```env
# Backend API URL (without /api)
NEXT_PUBLIC_API_URL=https://kidzgo-be.onrender.com

# Frontend URL
NEXT_PUBLIC_BASE_URL=https://kidzgo-centre-pvjj.vercel.app
```

## 📝 Cách sử dụng

### 1. Import types và helpers

```typescript
import { 
  LoginRequest, 
  LoginApiResponse 
} from '@/types/auth';
import { login, getUserMe } from '@/lib/api/auth';
```

### 2. Sử dụng helper functions

#### Login
```typescript
const credentials: LoginRequest = {
  email: 'user@example.com',
  password: 'password123'
};

const response = await login(credentials);

if (response.success) {
  const { accessToken, user, profiles } = response.data;
  // Lưu token và xử lý logic
}
```

#### Get User Info
```typescript
const token = 'your-access-token';
const response = await getUserMe(token);

if (response.success) {
  const user = response.data;
  console.log(user.email, user.fullName);
}
```

#### Change Password
```typescript
const data: ChangePasswordRequest = {
  currentPassword: 'oldPassword',
  newPassword: 'newPassword123'
};

const response = await changePassword(data, token);
```

#### Get Profiles
```typescript
const response = await getProfiles(token);

if (response.success) {
  const { profiles, selectedProfileId } = response.data;
  // Hiển thị danh sách profiles
}
```

#### Select Student Profile
```typescript
const data: SelectStudentProfileRequest = {
  profileId: 'student-profile-id'
};

const response = await selectStudent(data, token);

if (response.success) {
  const selectedProfile = response.data.selectedProfile;
  // Chuyển sang trang student
}
```

#### Verify Parent PIN
```typescript
const data: VerifyParentPinRequest = {
  profileId: 'parent-profile-id',
  pin: '1234'
};

const response = await verifyParentPin(data, token);

if (response.success) {
  // PIN đúng, cho phép truy cập
}
```

#### Change PIN
```typescript
const data: ChangeUserPinRequest = {
  currentPin: '1234',
  newPin: '5678'
};

const response = await changePin(data, token);
```

#### Forget Password
```typescript
const data: ForgetPasswordRequest = {
  email: 'user@example.com'
};

const response = await forgetPassword(data);
```

#### Reset Password
```typescript
const data: ResetPasswordRequest = {
  token: 'reset-token-from-email',
  newPassword: 'newPassword123'
};

const response = await resetPassword(data);
```

#### Request PIN Reset
```typescript
const data: RequestParentPinResetRequest = {
  profileId: 'parent-profile-id'
};

const response = await requestPinReset(data, token);
```

#### Logout
```typescript
const response = await logout(token);
```

## 🎯 Response Format

Tất cả API đều trả về format chuẩn:

```typescript
{
  success: boolean;
  data: T | null;
  message?: string;
}
```

### Success Response
```typescript
{
  success: true,
  data: {
    // Data theo từng endpoint
  }
}
```

### Error Response
```typescript
{
  success: false,
  data: null,
  message: "Error message here"
}
```

## 🔐 Authentication Flow

### 1. Login Flow
```typescript
// 1. User đăng nhập
const loginResponse = await login({ email, password });

// 2. Lưu token
localStorage.setItem('accessToken', loginResponse.data.accessToken);
localStorage.setItem('refreshToken', loginResponse.data.refreshToken);

// 3. Nếu có nhiều profiles, cho phép chọn
if (loginResponse.data.profiles && loginResponse.data.profiles.length > 0) {
  // Hiển thị danh sách profiles để user chọn
}
```

### 2. Profile Selection Flow
```typescript
// 1. Get danh sách profiles
const profilesResponse = await getProfiles(token);

// 2. Nếu chọn Parent profile, yêu cầu verify PIN
if (selectedProfile.profileType === 'Parent') {
  const verifyResponse = await verifyParentPin({
    profileId: selectedProfile.id,
    pin: userInputPin
  }, token);
}

// 3. Nếu chọn Student profile
if (selectedProfile.profileType === 'Student') {
  const selectResponse = await selectStudent({
    profileId: selectedProfile.id
  }, token);
}
```

### 3. Token Refresh Flow
```typescript
// Khi access token hết hạn
try {
  const response = await apiCall();
} catch (error) {
  if (error.status === 401) {
    // Refresh token
    const refreshTokenValue = localStorage.getItem('refreshToken');
    const refreshResponse = await refreshToken(refreshTokenValue);
    
    // Lưu token mới
    localStorage.setItem('accessToken', refreshResponse.data.accessToken);
    localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
    
    // Retry request
    return await apiCall();
  }
}
```

## 🎨 Best Practices

### 1. Type Safety
Luôn sử dụng types đã định nghĩa:
```typescript
// ✅ Good
const credentials: LoginRequest = { email, password };

// ❌ Bad
const credentials = { email, password };
```

### 2. Error Handling
Luôn kiểm tra response:
```typescript
const response = await login(credentials);

if (!response.success) {
  // Xử lý error
  console.error(response.message);
  return;
}

// Xử lý success
const { accessToken, user } = response.data;
```

### 3. Token Management
Tạo một auth store để quản lý tokens:
```typescript
// lib/store/authStore.ts
export const authStore = {
  getAccessToken: () => localStorage.getItem('accessToken'),
  setAccessToken: (token: string) => localStorage.setItem('accessToken', token),
  getRefreshToken: () => localStorage.getItem('refreshToken'),
  setRefreshToken: (token: string) => localStorage.setItem('refreshToken', token),
  clearTokens: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};
```

### 4. API Client với Auto Refresh
```typescript
// lib/api/client.ts
import { refreshToken } from './auth';
import { authStore } from '../store/authStore';

export async function apiClient<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authStore.getAccessToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    },
  });

  // Auto refresh on 401
  if (response.status === 401) {
    const refreshTokenValue = authStore.getRefreshToken();
    if (refreshTokenValue) {
      const refreshResponse = await refreshToken(refreshTokenValue);
      
      if (refreshResponse.success) {
        authStore.setAccessToken(refreshResponse.data.accessToken);
        authStore.setRefreshToken(refreshResponse.data.refreshToken);
        
        // Retry with new token
        return apiClient<T>(url, options);
      }
    }
    
    // Redirect to login if refresh fails
    authStore.clearTokens();
    window.location.href = '/login';
  }

  return response.json();
}
```

## 📚 API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | Đăng nhập | ❌ |
| POST | `/api/auth/refresh-token` | Làm mới token | ❌ |
| PUT | `/api/auth/change-password` | Đổi mật khẩu | ✅ |
| GET | `/api/auth/profiles` | Lấy danh sách profiles | ✅ |
| POST | `/api/auth/forget-password` | Quên mật khẩu | ❌ |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu | ❌ |
| POST | `/api/auth/profiles/verify-parent-pin` | Xác thực PIN phụ huynh | ✅ |
| POST | `/api/auth/profiles/select-student` | Chọn học sinh | ✅ |
| PUT | `/api/auth/change-pin` | Đổi PIN | ✅ |
| POST | `/api/auth/profiles/request-pin-reset` | Yêu cầu reset PIN | ✅ |
| GET | `/api/me` | Thông tin user hiện tại | ✅ |
| POST | `/api/me/logout` | Đăng xuất | ✅ |

## 🐛 Troubleshooting

### CORS Issues
Nếu gặp lỗi CORS, kiểm tra lại Backend đã enable CORS cho domain frontend chưa.

### 401 Unauthorized
- Kiểm tra token có được gửi đúng không
- Kiểm tra token có hết hạn không
- Thử refresh token

### Type Errors
Đảm bảo đã import đúng types từ `@/types/auth`

## 📖 Related Documentation
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [TypeScript Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
