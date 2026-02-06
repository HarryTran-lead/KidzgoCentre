# Branch Filter Feature

## Tổng quan

Tính năng Branch Filter cho phép Admin lọc và xem dữ liệu theo từng chi nhánh hoặc xem tất cả chi nhánh cùng lúc. Branch ID được lưu trong localStorage và tự động áp dụng cho các trang khác trong admin portal.

## Thành phần

### 1. BranchFilter Component
**File:** `components/portal/sidebar/BranchFilter.tsx`

Component hiển thị dropdown để chọn chi nhánh trong sidebar. 

**Props:**
- `branches: Branch[]` - Danh sách các chi nhánh
- `collapsed?: boolean` - Trạng thái sidebar có đang thu gọn không
- `onBranchChange?: (branchId: string | null) => void` - Callback khi thay đổi branch

**Features:**
- Lưu branch ID vào localStorage với key `kidzgo_selected_branch_id`
- Hỗ trợ chọn "Tất cả chi nhánh" (null value)
- Hiển thị trạng thái active/inactive của branch
- Tự động ẩn khi sidebar ở trạng thái collapsed

### 2. useBranchFilter Hook
**File:** `hooks/useBranchFilter.ts`

Custom hook để quản lý trạng thái branch filter.

**Exports:**
```typescript
function useBranchFilter(): {
  selectedBranchId: string | null;
  isLoaded: boolean;
  updateBranchId: (branchId: string | null) => void;
  clearSelection: () => void;
  getBranchQueryParam: () => string | undefined;
  isFilteringByBranch: boolean;
}
```

**Các utility functions:**
```typescript
// Get branch ID từ localStorage (client-side only)
function getSelectedBranchId(): string | null;

// Set branch ID vào localStorage
function setSelectedBranchId(branchId: string | null): void;
```

## Cách sử dụng

### 1. Trong Client Component

Sử dụng hook `useBranchFilter` để lấy branch ID đã chọn:

```typescript
"use client";

import { useBranchFilter } from "@/hooks/useBranchFilter";
import { getAllStudents } from "@/lib/api/studentService";
import { useEffect, useState } from "react";

export default function StudentsPage() {
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    if (!isLoaded) return;
    
    // Fetch students với branch filter
    const fetchStudents = async () => {
      const branchId = getBranchQueryParam();
      const response = await getAllStudents({ 
        branchId, // undefined nếu chọn "Tất cả chi nhánh"
        page: 1,
        limit: 10
      });
      
      if (response.success) {
        setStudents(response.data.students);
      }
    };
    
    fetchStudents();
  }, [selectedBranchId, isLoaded]);
  
  return (
    <div>
      <h1>Students {selectedBranchId ? `- Branch ${selectedBranchId}` : '- All Branches'}</h1>
      {/* Render students */}
    </div>
  );
}
```

### 2. Trong Server Component

Không thể sử dụng hook trong Server Component. Thay vào đó, truyền branch ID qua URL params hoặc sử dụng Client Component wrapper.

**Cách 1: Sử dụng Search Params**
```typescript
// app/[locale]/portal/admin/students/page.tsx
import StudentsList from "./StudentsList"; // Client Component

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ branchId?: string }>;
}) {
  const params = await searchParams;
  const branchId = params.branchId;
  
  return <StudentsList initialBranchId={branchId} />;
}
```

**Cách 2: Client Component Wrapper**
```typescript
// app/[locale]/portal/admin/students/page.tsx
import StudentsClientPage from "./StudentsClientPage";

export default function StudentsPage() {
  return <StudentsClientPage />;
}

// StudentsClientPage.tsx
"use client";

import { useBranchFilter } from "@/hooks/useBranchFilter";

export default function StudentsClientPage() {
  const { selectedBranchId, isLoaded } = useBranchFilter();
  
  // Sử dụng selectedBranchId để fetch data
}
```

### 3. Trong API Route Handler

Thêm `branchId` vào query parameters:

```typescript
// app/api/students/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const branchId = searchParams.get("branchId");
  
  // Fetch students with optional branch filter
  const students = await getStudentsFromDB({
    branchId: branchId || undefined, // undefined = all branches
  });
  
  return NextResponse.json({ success: true, data: students });
}
```

### 4. Trong Service Function

Thêm `branchId` parameter vào service functions:

```typescript
// lib/api/studentService.ts
export interface GetAllStudentsParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string; // ← Add this
  // ... other params
}

export async function getAllStudents(
  params?: GetAllStudentsParams
): Promise<GetAllStudentsApiResponse> {
  const queryParams = new URLSearchParams();
  
  if (params) {
    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.search) queryParams.append("search", params.search);
    if (params.branchId) queryParams.append("branchId", params.branchId); // ← Add this
  }
  
  const url = STUDENT_ENDPOINTS.GET_ALL;
  const fullUrl = queryParams.toString() ? `${url}?${queryParams}` : url;
  
  return get<GetAllStudentsApiResponse>(fullUrl);
}
```

## Best Practices

1. **Luôn kiểm tra `isLoaded`**: Đợi cho đến khi localStorage được đọc xong trước khi fetch data

```typescript
useEffect(() => {
  if (!isLoaded) return; // ← Important!
  fetchData();
}, [selectedBranchId, isLoaded]);
```

2. **Sử dụng `getBranchQueryParam()`**: Trả về `undefined` thay vì `null` để dễ sử dụng với API

```typescript
const params = {
  page: 1,
  branchId: getBranchQueryParam(), // undefined hoặc string
};
```

3. **Xử lý trường hợp "Tất cả chi nhánh"**: `selectedBranchId === null` nghĩa là xem tất cả

```typescript
if (selectedBranchId === null) {
  // Đang xem tất cả chi nhánh
  // Không thêm branchId vào query
}
```

4. **Hiển thị badge/indicator**: Thông báo cho người dùng biết đang filter theo branch nào

```typescript
{isFilteringByBranch && (
  <Badge>Đang lọc theo chi nhánh</Badge>
)}
```

## Tích hợp Backend

Backend API cần hỗ trợ query parameter `branchId`:

```typescript
// Backend endpoint example (NestJS)
@Get('students')
async getAllStudents(
  @Query('branchId') branchId?: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  const query: any = {};
  
  // Only filter by branch if branchId is provided
  if (branchId) {
    query.branchId = branchId;
  }
  
  // Fetch students with query
  const students = await this.studentService.findAll(query);
  
  return {
    success: true,
    data: students,
  };
}
```

## Lưu ý

1. **localStorage chỉ hoạt động trên client**: Không thể sử dụng trong Server Components
2. **SSR/Hydration**: Component sử dụng `mounted` state để tránh hydration mismatch
3. **Branch validation**: Component tự động xóa branch ID nếu branch không tồn tại trong danh sách
4. **Active/Inactive branches**: Branches không hoạt động vẫn hiển thị nhưng có visual indicator

## Troubleshooting

### Issue: Data không filter theo branch
**Solution**: Kiểm tra xem API có nhận và xử lý `branchId` parameter không

### Issue: Branch ID bị reset sau mỗi reload
**Solution**: Đảm bảo localStorage key `kidzgo_selected_branch_id` không bị xóa

### Issue: Component không render branch filter
**Solution**: 
- Kiểm tra role === "Admin"
- Kiểm tra branches array có dữ liệu không
- Kiểm tra collapsed state

## Testing

```typescript
// Test localStorage
localStorage.setItem('kidzgo_selected_branch_id', 'branch-123');
const branchId = localStorage.getItem('kidzgo_selected_branch_id');
console.log(branchId); // 'branch-123'

// Test "All branches"
localStorage.setItem('kidzgo_selected_branch_id', 'all');
const branchId = getSelectedBranchId();
console.log(branchId); // null
```
