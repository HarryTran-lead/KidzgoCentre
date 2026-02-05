# Hướng dẫn tích hợp Branch Filter vào các trang Admin

## Tổng quan

Tài liệu này hướng dẫn cách thêm branch filter vào các trang admin để lọc dữ liệu theo chi nhánh.

## Cấu trúc trang cần tích hợp

### 1. Tổng quan kinh doanh (Dashboard - `/portal/admin`)

**File**: `app/[locale]/portal/admin/page.tsx`

**Các API cần filter**:
- Tổng số học viên
- Doanh thu
- Giáo viên
- Lớp học

**Code mẫu**:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useBranchFilter } from "@/hooks/useBranchFilter";
// ... other imports

export default function AdminDashboard() {
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard stats khi branch filter thay đổi
  useEffect(() => {
    if (!isLoaded) return;

    const fetchDashboardStats = async () => {
      setLoading(true);
      try {
        const branchId = getBranchQueryParam();
        
        // TODO: Thay mock data bằng API call thật
        // const response = await getDashboardStats({ branchId });
        // setStats(response.data);
        
        // Tạm thời log để kiểm tra
        console.log("Fetching dashboard stats for branch:", branchId || "All branches");
        
        // Mock data
        setStats({
          students: selectedBranchId ? 150 : 550,
          revenue: selectedBranchId ? 45000000 : 268000000,
          teachers: selectedBranchId ? 5 : 21,
          classes: selectedBranchId ? 6 : 30,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, [selectedBranchId, isLoaded, getBranchQueryParam]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Hiển thị branch đang filter */}
      {selectedBranchId && (
        <div className="mb-4 px-4 py-2 bg-pink-50 border border-pink-200 rounded-lg">
          <span className="text-sm text-pink-700">
            Đang xem dữ liệu của chi nhánh được chọn
          </span>
        </div>
      )}
      
      {/* Dashboard content */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Tổng học viên" value={stats.students} />
        <StatCard label="Doanh thu" value={stats.revenue} />
        <StatCard label="Giáo viên" value={stats.teachers} />
        <StatCard label="Lớp học" value={stats.classes} />
      </div>
    </div>
  );
}
```

---

### 2. Tổng quan trung tâm (`/portal/admin/center`)

**File**: `app/[locale]/portal/admin/center/page.tsx`

**Code mẫu**:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useBranchFilter } from "@/hooks/useBranchFilter";

export default function CenterOverview() {
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchBranches = async () => {
      const branchId = getBranchQueryParam();
      
      // TODO: Replace with API call
      // const response = await getAllBranches({ branchId });
      
      console.log("Fetching branches, filter:", branchId || "All");
      
      // Mock data - lọc theo branch nếu có
      const allBranches = [
        { id: 'CN01', name: 'KidzGo Nguyễn Văn Trỗi', students: 240 },
        { id: 'CN02', name: 'KidzGo Phạm Văn Đồng', students: 190 },
        { id: 'CN03', name: 'KidzGo Thủ Đức', students: 120 },
      ];
      
      setBranches(
        branchId 
          ? allBranches.filter(b => b.id === branchId)
          : allBranches
      );
    };

    fetchBranches();
  }, [selectedBranchId, isLoaded, getBranchQueryParam]);

  return (
    <div>
      <h1>Tổng quan trung tâm</h1>
      <div className="grid gap-4">
        {branches.map(branch => (
          <div key={branch.id} className="p-4 border rounded">
            <h3>{branch.name}</h3>
            <p>Học viên: {branch.students}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

### 3. Quản lý tuyển sinh (`/portal/admin/leads`)

**File**: `app/[locale]/portal/admin/leads/page.tsx`

**API cần tích hợp**: `getAllLeads({ branchId })`

**Code mẫu**:

```typescript
"use client";

import { useState, useEffect } from "react";
import { useBranchFilter } from "@/hooks/useBranchFilter";
// import { getAllLeads } from "@/lib/api/leadService";

export default function LeadsPage() {
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    const fetchLeads = async () => {
      setLoading(true);
      try {
        const branchId = getBranchQueryParam();
        
        // TODO: Uncomment when API is ready
        // const response = await getAllLeads({ 
        //   branchId,
        //   page: 1,
        //   limit: 20
        // });
        // setLeads(response.data.leads);
        
        console.log("Fetching leads for branch:", branchId || "All branches");
        
        // Mock data tạm thời
        setLeads([
          { id: 'LD001', parentName: 'Nguyễn Thị Thu', branchId: 'CN01' },
          { id: 'LD002', parentName: 'Trần Văn Long', branchId: 'CN02' },
        ].filter(lead => !branchId || lead.branchId === branchId));
        
      } catch (error) {
        console.error("Error fetching leads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [selectedBranchId, isLoaded, getBranchQueryParam]);

  return (
    <div>
      <h1>Quản lý tuyển sinh</h1>
      {loading ? (
        <div>Đang tải...</div>
      ) : (
        <div className="space-y-2">
          {leads.map(lead => (
            <div key={lead.id} className="p-4 border rounded">
              {lead.parentName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 4. Học tập

#### 4.1. Khóa học (`/portal/admin/courses`)

**API**: `getAllCourses({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchCourses = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllCourses({ branchId });
    console.log("Fetching courses for branch:", branchId || "All");
  };
  
  fetchCourses();
}, [selectedBranchId, isLoaded]);
```

#### 4.2. Lớp học (`/portal/admin/classes`)

**API**: `getAllClasses({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchClasses = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllClasses({ branchId });
    console.log("Fetching classes for branch:", branchId || "All");
  };
  
  fetchClasses();
}, [selectedBranchId, isLoaded]);
```

#### 4.3. Học viên (`/portal/admin/students`)

**API**: `getAllStudents({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchStudents = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllStudents({ branchId });
    console.log("Fetching students for branch:", branchId || "All");
  };
  
  fetchStudents();
}, [selectedBranchId, isLoaded]);
```

---

### 5. Vận hành

#### 5.1. Phòng học (`/portal/admin/rooms`)

**API**: `getAllRooms({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchRooms = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllRooms({ branchId });
    console.log("Fetching rooms for branch:", branchId || "All");
  };
  
  fetchRooms();
}, [selectedBranchId, isLoaded]);
```

#### 5.2. Lịch học (`/portal/admin/schedule`)

**API**: `getAllSchedules({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchSchedules = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllSchedules({ branchId });
    console.log("Fetching schedules for branch:", branchId || "All");
  };
  
  fetchSchedules();
}, [selectedBranchId, isLoaded]);
```

#### 5.3. Học phí (`/portal/admin/fees`)

**API**: `getAllFees({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchFees = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllFees({ branchId });
    console.log("Fetching fees for branch:", branchId || "All");
  };
  
  fetchFees();
}, [selectedBranchId, isLoaded]);
```

#### 5.4. Feedback (`/portal/admin/feedback`)

**API**: `getAllFeedback({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchFeedback = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllFeedback({ branchId });
    console.log("Fetching feedback for branch:", branchId || "All");
  };
  
  fetchFeedback();
}, [selectedBranchId, isLoaded]);
```

#### 5.5. Ngoại khóa (`/portal/admin/extracurricular`)

**API**: `getAllExtracurricular({ branchId })`

```typescript
const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();

useEffect(() => {
  if (!isLoaded) return;
  
  const fetchExtracurricular = async () => {
    const branchId = getBranchQueryParam();
    // const response = await getAllExtracurricular({ branchId });
    console.log("Fetching extracurricular for branch:", branchId || "All");
  };
  
  fetchExtracurricular();
}, [selectedBranchId, isLoaded]);
```

---

## Checklist tích hợp Branch Filter

Khi tích hợp branch filter vào một trang mới, hãy làm theo các bước sau:

- [ ] Import `useBranchFilter` hook
- [ ] Destructure `selectedBranchId`, `isLoaded`, `getBranchQueryParam` từ hook
- [ ] Thêm `useEffect` để fetch data khi `selectedBranchId` thay đổi
- [ ] Kiểm tra `isLoaded` trước khi fetch data
- [ ] Truyền `branchId` vào API call: `getBranchQueryParam()`
- [ ] (Optional) Hiển thị badge/indicator khi đang filter theo branch
- [ ] Test với cả trường hợp: chọn branch cụ thể và "Tất cả chi nhánh"

## Tips & Best Practices

1. **Luôn kiểm tra `isLoaded`**: Tránh fetch data trước khi localStorage được đọc
   ```typescript
   if (!isLoaded) return;
   ```

2. **Sử dụng `getBranchQueryParam()`**: Trả về `undefined` thay vì `null`
   ```typescript
   const branchId = getBranchQueryParam(); // undefined hoặc string
   ```

3. **Hiển thị indicator khi đang filter**:
   ```typescript
   {selectedBranchId && (
     <div className="bg-pink-50 border border-pink-200 rounded p-2">
       Đang lọc theo chi nhánh
     </div>
   )}
   ```

4. **Console log để debug**:
   ```typescript
   console.log("Fetching data for branch:", branchId || "All branches");
   ```

5. **Loading state**: Luôn có loading state khi fetch data
   ```typescript
   const [loading, setLoading] = useState(true);
   ```

## Timeline triển khai

1. **Phase 1** (Hiện tại): Thêm hook và log console để sẵn sàng
2. **Phase 2** (Khi có API): Uncomment API calls và remove mock data
3. **Phase 3** (Testing): Test với data thật từ backend
4. **Phase 4** (Optimization): Cache, pagination, performance tuning

---

**Lưu ý**: Tất cả các trang hiện tại đều dùng mock data. Khi backend API sẵn sàng, chỉ cần uncomment các dòng API call và xóa mock data.
