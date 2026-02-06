# Lead Children Management - Implementation Guide

## 📋 Tổng quan

Tính năng quản lý thông tin con (children) trong lead cho phép staff thêm, sửa, xóa và xem danh sách con của mỗi lead. Điều này quan trọng cho việc theo dõi học viên tiềm năng và tư vấn phù hợp.

## 🎯 Các thay đổi đã thực hiện

### 1. Types & Interfaces (types/lead/index.ts)

**Thêm các interface mới:**

```typescript
// Child Entity
export interface LeadChild {
  id: string;
  leadId: string;
  childName: string;
  dob?: string; // Date of birth in ISO format
  gender?: string;
  programInterest?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Child Request Types
export interface CreateLeadChildRequest {
  childName: string;
  dob?: string;
  gender?: string;
  programInterest?: string;
  notes?: string;
}

export interface UpdateLeadChildRequest {
  childName?: string;
  dob?: string;
  gender?: string;
  programInterest?: string;
  notes?: string;
}

// Child Response Types
export interface GetLeadChildrenApiResponse {
  success: boolean;
  data: LeadChild[];
  message?: string;
}

export interface CreateLeadChildApiResponse {
  success: boolean;
  data: LeadChild;
  message?: string;
}

export interface UpdateLeadChildApiResponse {
  success: boolean;
  data: LeadChild;
  message?: string;
}

export interface DeleteLeadChildApiResponse {
  success: boolean;
  message?: string;
}
```

**Update CreateLeadRequest:**
```typescript
export interface CreateLeadRequest extends CreateLeadPublicRequest {
  status?: string;
  source?: string;
  assignedTo?: string;
  children?: CreateLeadChildRequest[]; // ⭐ Thêm children array
}
```

### 2. API Endpoints (constants/apiURL.ts)

**Thêm children endpoints:**

```typescript
export const LEAD_ENDPOINTS = {
  // ... existing endpoints
  
  // Children endpoints
  GET_CHILDREN: (leadId: string) => `/api/leads/${leadId}/children`,
  CREATE_CHILD: (leadId: string) => `/api/leads/${leadId}/children`,
  UPDATE_CHILD: (leadId: string, childId: string) => 
    `/api/leads/${leadId}/children/${childId}`,
  DELETE_CHILD: (leadId: string, childId: string) => 
    `/api/leads/${leadId}/children/${childId}`,
} as const;

export const BACKEND_LEAD_ENDPOINTS = {
  // ... existing endpoints
  
  // Children endpoints (mirrored)
  GET_CHILDREN: (leadId: string) => `/leads/${leadId}/children`,
  CREATE_CHILD: (leadId: string) => `/leads/${leadId}/children`,
  UPDATE_CHILD: (leadId: string, childId: string) => 
    `/leads/${leadId}/children/${childId}`,
  DELETE_CHILD: (leadId: string, childId: string) => 
    `/leads/${leadId}/children/${childId}`,
} as const;
```

### 3. Service Functions (lib/api/leadService.ts)

**Thêm children management functions:**

```typescript
/**
 * Get all children for a specific lead
 */
export async function getLeadChildren(leadId: string): Promise<GetLeadChildrenApiResponse>

/**
 * Add a child to a lead
 */
export async function createLeadChild(
  leadId: string, 
  data: CreateLeadChildRequest
): Promise<CreateLeadChildApiResponse>

/**
 * Update a child's information
 */
export async function updateLeadChild(
  leadId: string, 
  childId: string, 
  data: UpdateLeadChildRequest
): Promise<UpdateLeadChildApiResponse>

/**
 * Delete a child from a lead
 */
export async function deleteLeadChild(
  leadId: string, 
  childId: string
): Promise<DeleteLeadChildApiResponse>
```

### 4. Next.js API Routes

**app/api/leads/[leadId]/children/route.ts**
- `GET` - Lấy danh sách children
- `POST` - Thêm child mới

**app/api/leads/[leadId]/children/[childId]/route.ts**
- `PUT` - Cập nhật thông tin child
- `DELETE` - Xóa child

### 5. UI Component (components/portal/leads/LeadChildrenManager.tsx)

**Component chính để quản lý children:**

```tsx
<LeadChildrenManager 
  leadId="lead-123"
  isEditable={true}
/>
```

**Features:**
- ✅ Hiển thị danh sách children với thông tin đầy đủ
- ✅ Form modal để thêm/sửa child
- ✅ Delete với confirmation
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling với toast notifications

## 📡 API Usage

### 1. Lấy danh sách children

```typescript
GET /api/leads/{leadId}/children

Response:
{
  "success": true,
  "data": [
    {
      "id": "child-1",
      "leadId": "lead-123",
      "childName": "Nguyễn Văn A",
      "dob": "2015-03-24T00:00:00Z",
      "gender": "Nam",
      "programInterest": "Tiếng Anh thiếu nhi",
      "notes": "Con thích vẽ",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 2. Thêm child mới

```typescript
POST /api/leads/{leadId}/children

Body:
{
  "childName": "Nguyễn Văn A",
  "dob": "2015-03-24T00:00:00Z",
  "gender": "Nam",
  "programInterest": "Tiếng Anh thiếu nhi",
  "notes": "Con thích vẽ"
}

Response:
{
  "success": true,
  "data": { /* LeadChild object */ },
  "message": "Child created successfully"
}
```

### 3. Cập nhật child

```typescript
PUT /api/leads/{leadId}/children/{childId}

Body:
{
  "childName": "Nguyễn Văn A",
  "programInterest": "STEAM"
}
```

### 4. Xóa child

```typescript
DELETE /api/leads/{leadId}/children/{childId}

Response:
{
  "success": true,
  "message": "Child deleted successfully"
}
```

## 🎨 UI Integration

### Sử dụng trong Lead Detail Modal

```tsx
import { LeadChildrenManager } from "@/components/portal/leads";

function LeadDetailModal({ lead }) {
  return (
    <div>
      {/* ... other lead info ... */}
      
      <div className="mt-6">
        <LeadChildrenManager 
          leadId={lead.id}
          isEditable={canEdit}
        />
      </div>
    </div>
  );
}
```

### Sử dụng trong Lead Form (Create/Edit)

```tsx
import { LeadChildrenManager } from "@/components/portal/leads";

function LeadFormModal({ leadId, mode }) {
  return (
    <form>
      {/* ... lead basic info ... */}
      
      {mode === "edit" && leadId && (
        <div className="mt-6 border-t pt-6">
          <LeadChildrenManager 
            leadId={leadId}
            isEditable={true}
          />
        </div>
      )}
    </form>
  );
}
```

## 📊 Component Props

```typescript
interface LeadChildrenManagerProps {
  leadId: string;          // Required: ID của lead
  isEditable?: boolean;    // Optional: Cho phép edit (default: true)
}
```

## 🔄 Data Flow

```
User Action → Component State → API Call → Backend → Database
                    ↓
              Update UI ← API Response
```

**Ví dụ: Thêm child mới**

1. User click "Thêm con" → Form modal mở
2. User điền thông tin → Submit form
3. Component call `createLeadChild(leadId, data)`
4. Next.js API route forward request tới backend
5. Backend tạo child record trong database
6. Response trả về component
7. Component refresh danh sách children
8. Show success toast

## 🎯 Features

### ✅ Đã implement

- Hiển thị danh sách children với đầy đủ thông tin
- Thêm child mới với validation
- Cập nhật thông tin child
- Xóa child với confirmation
- Responsive design (mobile-friendly)
- Loading states
- Error handling
- Toast notifications
- Empty state với hướng dẫn

### 🔮 Future Enhancements

- Bulk import children từ Excel
- Avatar upload cho children
- Age calculation từ DOB
- Program recommendation dựa trên age
- Children activity history
- Export children list to PDF

## 🧪 Testing

### Test Cases

1. **Load children list**
   - Verify API được gọi với đúng leadId
   - Verify danh sách hiển thị đúng

2. **Create child**
   - Submit với tất cả fields → Success
   - Submit chỉ required fields → Success
   - Submit without childName → Show validation error

3. **Update child**
   - Click Edit → Form fill with existing data
   - Update and submit → Success
   - Verify updated data hiển thị đúng

4. **Delete child**
   - Click Delete → Show confirmation
   - Confirm → Child removed from list
   - Cancel → Nothing happens

5. **Empty state**
   - Lead without children → Show empty state
   - Click "Thêm thông tin con" → Open form

## 🔐 Security Considerations

**Backend PHẢI validate:**

1. User có quyền access lead này không?
2. LeadId có tồn tại không?
3. ChildId có thuộc về leadId không? (khi update/delete)
4. Input validation cho tất cả fields

**Example backend validation:**

```typescript
// Before allowing CRUD operations
const lead = await db.leads.findOne({ id: leadId });
if (!lead) throw new Error("Lead not found");

if (lead.branchId !== user.branchId && user.role !== "Admin") {
  throw new Error("Unauthorized");
}
```

## 📝 Notes

- DOB được lưu dưới dạng ISO 8601 string
- Gender là free text (có thể dùng enum sau)
- ProgramInterest là free text (có thể link tới Programs table sau)
- Component sử dụng `useToast` hook cho notifications
- API routes tự động forward authentication header

## 🆘 Common Issues

### Issue: Children không load

**Giải pháp:**
- Check network tab: API có được gọi không?
- Check console: Có error gì không?
- Verify leadId đúng format
- Check authentication token

### Issue: Create/Update không work

**Giải pháp:**
- Validate request body format
- Check backend logs
- Verify endpoint URLs đúng
- Test với Postman/Thunder Client trước

---

**Status:** ✅ Implementation Complete  
**Ready for:** Backend Integration & Testing
