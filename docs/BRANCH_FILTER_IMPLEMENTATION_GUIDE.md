# Branch Filter Integration - Ví dụ thực tế

## ✅ Đã thêm import vào 4 trang

Tôi đã thêm `import { useBranchFilter } from "@/hooks/useBranchFilter";` vào các file sau:

1. ✅ **Courses** - `app/[locale]/portal/admin/courses/page.tsx`
2. ✅ **Classes** - `app/[locale]/portal/admin/classes/page.tsx`  
3. ✅ **Rooms** - `app/[locale]/portal/admin/rooms/page.tsx`
4. ✅ **Schedule** - `app/[locale]/portal/admin/schedule/page.tsx`

---

## 📝 Bước tiếp theo - Cách áp dụng

### Bước 1: Thêm hook vào component chính

Tìm component chính (thường là `export default function ...Page()`) và thêm hook ở đầu:

```typescript
export default function CoursesPage() {
  // ✅ Thêm dòng này ngay đầu component
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  
  // ... các state khác
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ...
}
```

### Bước 2: Thêm useEffect để fetch data khi branch thay đổi

```typescript
// Fetch data khi branch filter thay đổi
useEffect(() => {
  if (!isLoaded) return; // Đợi load localStorage
  
  const loadCourses = async () => {
    setLoading(true);
    try {
      const branchId = getBranchQueryParam(); // undefined hoặc string
      
      // Log để debug
      console.log("📚 Fetching courses for branch:", branchId || "All branches");
      
      // Gọi API với branchId - API sẽ tự động filter nếu có branchId
      const response = await fetchAdminPrograms({
        branchId, // ← Thêm param này
        page: 1,
        limit: 100,
      });
      
      if (response.success && response.data) {
        const mapped = response.data.programs.map(mapApiProgramToRow);
        setCourses(mapped);
        console.log("✅ Loaded", mapped.length, "courses");
      }
    } catch (error) {
      console.error("❌ Error loading courses:", error);
    } finally {
      setLoading(false);
    }
  };
  
  loadCourses();
}, [selectedBranchId, isLoaded]); // ← Trigger khi branch thay đổi
```

### Bước 3: (Optional) Hiển thị indicator

Thêm visual indicator để user biết đang filter:

```typescript
return (
  <div className="space-y-6">
    {/* Branch Filter Indicator */}
    {selectedBranchId && (
      <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 border border-pink-200 rounded-lg">
        <Building2 size={16} className="text-pink-600" />
        <span className="text-sm text-pink-700 font-medium">
          Đang lọc theo chi nhánh đã chọn
        </span>
      </div>
    )}
    
    {/* Content */}
    <div className="bg-white rounded-xl shadow-sm p-6">
      {/* ... nội dung trang */}
    </div>
  </div>
);
```

---

## 🎯 Code mẫu hoàn chỉnh cho từng trang

### 1. Courses Page

Tìm function `export default function CoursesPage()` và thêm:

```typescript
export default function CoursesPage() {
  // ✅ ADD: Branch filter hook
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ ADD: Fetch courses khi branch thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    
    const loadCourses = async () => {
      setLoading(true);
      try {
        const branchId = getBranchQueryParam();
        console.log("📚 Fetching courses for branch:", branchId || "All");
        
        const response = await fetchAdminPrograms({ branchId });
        if (response.success && response.data) {
          const mapped = response.data.programs.map(mapApiProgramToRow);
          setCourses(mapped);
        }
      } catch (error) {
        console.error("Error loading courses:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourses();
  }, [selectedBranchId, isLoaded]);
  
  // ... rest of component
}
```

### 2. Classes Page

```typescript
export default function ClassesPage() {
  // ✅ ADD: Branch filter hook
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ ADD: Fetch classes khi branch thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    
    const loadClasses = async () => {
      setLoading(true);
      try {
        const branchId = getBranchQueryParam();
        console.log("🎓 Fetching classes for branch:", branchId || "All");
        
        const response = await fetchAdminClasses({ branchId });
        if (response.success && response.data) {
          const mapped = response.data.classes.map(mapApiClassToRow);
          setClasses(mapped);
        }
      } catch (error) {
        console.error("Error loading classes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadClasses();
  }, [selectedBranchId, isLoaded]);
  
  // ... rest of component
}
```

### 3. Rooms Page

```typescript
export default function RoomsPage() {
  // ✅ ADD: Branch filter hook  
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ ADD: Fetch rooms khi branch thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    
    const loadRooms = async () => {
      setLoading(true);
      try {
        const branchId = getBranchQueryParam();
        console.log("🏫 Fetching rooms for branch:", branchId || "All");
        
        const response = await fetchAdminRooms({ branchId });
        if (response.success && response.data) {
          setRooms(response.data.rooms);
        }
      } catch (error) {
        console.error("Error loading rooms:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadRooms();
  }, [selectedBranchId, isLoaded]);
  
  // ... rest of component
}
```

### 4. Schedule Page

```typescript
export default function SchedulePage() {
  // ✅ ADD: Branch filter hook
  const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ✅ ADD: Fetch sessions khi branch thay đổi
  useEffect(() => {
    if (!isLoaded) return;
    
    const loadSessions = async () => {
      setLoading(true);
      try {
        const branchId = getBranchQueryParam();
        console.log("📅 Fetching schedule for branch:", branchId || "All");
        
        const response = await fetchAdminSessions({ branchId });
        if (response.success && response.data) {
          setSessions(response.data.sessions);
        }
      } catch (error) {
        console.error("Error loading schedule:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadSessions();
  }, [selectedBranchId, isLoaded]);
  
  // ... rest of component
}
```

---

## ⚠️ Lưu ý quan trọng

### 1. Kiểm tra API có hỗ trợ `branchId` param chưa

Trước khi áp dụng, hãy kiểm tra backend API có nhận param `branchId` không:

```typescript
// Kiểm tra function signature
fetchAdminPrograms({ branchId?: string })
fetchAdminClasses({ branchId?: string })
fetchAdminRooms({ branchId?: string })
fetchAdminSessions({ branchId?: string })
```

Nếu chưa có, bạn cần:
- **Option 1**: Thêm param `branchId` vào API request
- **Option 2**: Filter ở client-side (chậm hơn)

### 2. Backend phải xử lý optional `branchId`

Backend cần logic:
```typescript
// Backend code example
if (branchId) {
  // Lọc theo branch cụ thể
  query.branchId = branchId;
} else {
  // Trả về tất cả branches
}
```

### 3. Test cả 2 trường hợp

- ✅ Chọn branch cụ thể → Chỉ hiển thị data của branch đó
- ✅ Chọn "Tất cả chi nhánh" → Hiển thị data của tất cả branches

### 4. Debug với console.log

Khi test, check console để xem:
```
📚 Fetching courses for branch: branch-id-123
✅ Loaded 5 courses

📚 Fetching courses for branch: All branches  
✅ Loaded 15 courses
```

---

## 🚀 Quick Start

### Bước nhanh để áp dụng cho 1 trang:

1. Mở file page (ví dụ `courses/page.tsx`)
2. Tìm `export default function`
3. Thêm ngay dưới đầu function:
   ```typescript
   const { selectedBranchId, isLoaded, getBranchQueryParam } = useBranchFilter();
   ```
4. Tìm nơi fetch data (thường trong `useEffect`)
5. Thêm `branchId: getBranchQueryParam()` vào API call
6. Thêm `selectedBranchId, isLoaded` vào dependency array của `useEffect`
7. Save và test!

---

## 🎉 Kết quả mong đợi

Sau khi áp dụng xong, bạn sẽ thấy:

1. **Dropdown branch filter** xuất hiện trong sidebar (đã có sẵn ✅)
2. **Chọn 1 branch** → Trang tự động reload và chỉ hiển thị data của branch đó
3. **Chọn "Tất cả"** → Hiển thị data của tất cả branches
4. **Reload trang** → Branch filter vẫn giữ nguyên (nhờ localStorage)
5. **Di chuyển giữa các trang** → Branch filter vẫn được áp dụng ở trang mới

---

**Nếu cần hỗ trợ thêm, hãy cho tôi biết trang nào bạn muốn tôi implement chi tiết!** 🚀
