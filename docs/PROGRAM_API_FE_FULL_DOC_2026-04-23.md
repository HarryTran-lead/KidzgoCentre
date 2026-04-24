# Program API FE Full Doc - 2026-04-23

Tai lieu nay mo ta day du cac API trong `ProgramController.cs` de FE tich hop.

> **Luu y kien truc:** Program la tai nguyen dung chung toan he thong. Mot program co the duoc gan vao nhieu chi nhanh (branch assignment). Cac chi nhanh dung chung program, khong phai moi chi nhanh co program rieng.

---

## 1. Tong quan role, scope va action

### Role scope

| Role | Duoc xem du lieu gi | Pham vi du lieu | Hanh dong duoc phep |
| --- | --- | --- | --- |
| Admin | Toan bo program va branch assignment | `all` | `view`, `create`, `edit`, `assign-branch`, `toggle-status`, `delete` |
| ManagementStaff | Toan bo program va branch assignment | `all` | `view`, `create`, `edit`, `assign-branch`, `toggle-status` |
| Teacher | Danh sach program | `all` | `view` |
| Parent | Khong duoc truy cap cac API co auth trong controller nay | `none` | `none` |
| Student | Khong duoc truy cap cac API co auth trong controller nay | `none` | `none` |
| Anonymous | Danh sach program active va chi tiet program | `public` | `view-active-list`, `view-detail` |

### Ghi chu scope

- Hien tai khong co `own` hay `department` scope.
- Cac role duoc phep se thay du lieu theo `all`.
- Neu FE gui `branchId` trong API list, backend loc theo branch assignment dang `isActive = true`.

---

## 2. Common response format

### Success

Tat ca response thanh cong duoc wrap theo:

```json
{
  "isSuccess": true,
  "data": {}
}
```

### Error business / not found / conflict

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.4",
  "title": "Program.NotFound",
  "status": 404,
  "detail": "Program with Id = '3fa85f64-5717-4562-b3fc-2c963f66afa6' was not found"
}
```

### Error validation

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation.General",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "errors": [
    {
      "code": "NotEmptyValidator",
      "description": "Program name is required"
    }
  ]
}
```

### HTTP mapping

| Error type | HTTP |
| --- | --- |
| Validation | `400` |
| NotFound | `404` |
| Conflict | `409` |
| Unauthorized | `401` |
| Forbidden | `403` |
| Failure / unexpected | `500` |

---

## 3. Danh sach API

| Method | Endpoint | Role | Mo ta |
| --- | --- | --- | --- |
| POST | `/api/programs` | Admin, ManagementStaff | Tao program moi |
| GET | `/api/programs` | Admin, ManagementStaff, Teacher | Lay danh sach program |
| GET | `/api/programs/active` | Anonymous | Lay danh sach program active |
| GET | `/api/programs/{id}` | Anonymous | Lay chi tiet 1 program |
| PUT | `/api/programs/{id}` | Admin, ManagementStaff | Cap nhat program |
| POST | `/api/programs/{id}/branches/{branchId}` | Admin, ManagementStaff | Gan program vao chi nhanh |
| DELETE | `/api/programs/{id}` | Admin | Soft delete program |
| PATCH | `/api/programs/{id}/toggle-status` | Admin, ManagementStaff | Dao trang thai active/inactive |

---

## 4. API detail

### 4.1 POST `/api/programs`

Dung de tao program dung chung cho toan he thong. Program moi chua gan branch nao cho den khi FE/Admin goi API assign branch.

**Roles:** `Admin`, `ManagementStaff`

**Body:**

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Khong rong, max `255` |
| `code` | `string` | Yes | Khong rong, max `10` |
| `isMakeup` | `bool` | Yes | |
| `isSupplementary` | `bool` | Yes | Khong duoc cung luc `true` voi `isMakeup` |

**Success response:**

```json
{
  "isSuccess": true,
  "data": {
    "id": "guid",
    "name": "Kids Starter",
    "code": "KS1",
    "isMakeup": false,
    "isSupplementary": false,
    "defaultTuitionAmount": 0,
    "unitPriceSession": 0,
    "description": null,
    "isActive": true
  }
}
```

**Error responses:**

| HTTP | Code | Khi nao |
| --- | --- | --- |
| 400 | `Validation.General` | Sai validator request |
| 401 | Unauthorized | Chua dang nhap |
| 403 | Forbidden | Role khong phai `Admin`, `ManagementStaff` |

**Validation rules:**

- `name` bat buoc.
- `code` bat buoc.
- `name` max 255.
- `code` max 10.
- `isMakeup` va `isSupplementary` khong duoc cung `true`.

---

### 4.2 GET `/api/programs`

Dung de lay danh sach program co phan trang va filter.

**Roles:** `Admin`, `ManagementStaff`, `Teacher`

**Query params:**

| Field | Type | Required | Default | Mo ta |
| --- | --- | --- | --- | --- |
| `branchId` | `Guid?` | No | `null` | Loc program da duoc assign vao branch do (assignment `isActive = true`) |
| `searchTerm` | `string?` | No | `null` | Tim theo `name`, `code`, `description` |
| `isActive` | `bool?` | No | `null` | Loc theo active/inactive |
| `isMakeup` | `bool?` | No | `null` | Loc theo loai makeup |
| `pageNumber` | `int` | No | `1` | |
| `pageSize` | `int` | No | `10` | |

**Success response:**

```json
{
  "isSuccess": true,
  "data": {
    "programs": {
      "items": [
        {
          "id": "guid",
          "name": "Kids Starter",
          "code": "KS1",
          "isMakeup": false,
          "isSupplementary": false,
          "defaultTuitionAmount": 3500000,
          "unitPriceSession": 175000,
          "description": null,
          "isActive": true,
          "totalSessions": 20,
          "assignedBranchCount": 2,
          "baseFee": 3500000,
          "fee": 3500000,
          "classCount": 4,
          "studentCount": 36,
          "status": "Active"
        }
      ],
      "pageNumber": 1,
      "totalPages": 1,
      "totalCount": 1,
      "hasPreviousPage": false,
      "hasNextPage": false
    }
  }
}
```

**Error responses:**

| HTTP | Code | Khi nao |
| --- | --- | --- |
| 401 | Unauthorized | Chua dang nhap |
| 403 | Forbidden | Role khong duoc phep |

**Ghi chu:**

- Backend tu dong bo qua program da soft delete.
- `defaultTuitionAmount`, `unitPriceSession`, `totalSessions`, `classCount`, `studentCount` duoc tinh tu du lieu lien quan.
- Neu co `branchId`, gia tri hoc phi va thong ke duoc tinh theo branch scope phu hop trong code.
- `assignedBranchCount` the hien so chi nhanh dang su dung program nay (mot program co the gan nhieu chi nhanh).

---

### 4.3 GET `/api/programs/active`

Dung cho public/portal de lay danh sach program active.

**Roles:** Anonymous (va tat ca role khac neu co token van goi duoc)

**Query params:**

| Field | Type | Required | Default |
| --- | --- | --- | --- |
| `branchId` | `Guid?` | No | `null` |
| `searchTerm` | `string?` | No | `null` |
| `pageNumber` | `int` | No | `1` |
| `pageSize` | `int` | No | `10` |

**Success response:**

- Cung format voi `GET /api/programs`, nhung backend ep `isActive = true`.

**Error responses:**

- Hien tai khong co auth error vi endpoint la `AllowAnonymous`.

---

### 4.4 GET `/api/programs/{id}`

Dung de lay chi tiet 1 program, kem danh sach tat ca chi nhanh da duoc assign vao program nay.

**Roles:** Anonymous (va tat ca role khac)

**Path params:**

| Field | Type | Required |
| --- | --- | --- |
| `id` | `Guid` | Yes |

**Success response:**

```json
{
  "isSuccess": true,
  "data": {
    "id": "guid",
    "name": "Kids Starter",
    "code": "KS1",
    "isMakeup": false,
    "isSupplementary": false,
    "defaultTuitionAmount": 3500000,
    "unitPriceSession": 175000,
    "description": null,
    "isActive": true,
    "totalSessions": 20,
    "branchAssignments": [
      {
        "branchId": "guid",
        "branchName": "Rex District 1",
        "isActive": true,
        "defaultMakeupClassId": null
      }
    ],
    "baseFee": 3500000,
    "fee": 3500000,
    "classCount": 4,
    "studentCount": 36,
    "status": "Active"
  }
}
```

> `branchAssignments` la mang cac chi nhanh dang dung chung program nay. Mot program co the co nhieu phan tu trong mang nay.

**Error responses:**

| HTTP | Code | Khi nao |
| --- | --- | --- |
| 404 | `Program.NotFound` | Program khong ton tai hoac da soft delete |

---

### 4.5 PUT `/api/programs/{id}`

Dung de cap nhat thong tin program (cap nhat toan he thong, anh huong tat ca chi nhanh dang dung program nay).

**Roles:** `Admin`, `ManagementStaff`

**Path params:**

| Field | Type | Required |
| --- | --- | --- |
| `id` | `Guid` | Yes |

**Body:**

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Khong rong, max `255` |
| `code` | `string` | Yes | Khong rong, max `10` |
| `isMakeup` | `bool` | Yes | |
| `isSupplementary` | `bool` | Yes | Khong duoc cung luc `true` voi `isMakeup` |

**Success response:**

```json
{
  "isSuccess": true,
  "data": {
    "id": "guid",
    "name": "Kids Starter Updated",
    "code": "KS1",
    "isMakeup": false,
    "isSupplementary": false,
    "defaultTuitionAmount": 0,
    "unitPriceSession": 0,
    "description": null,
    "isActive": true
  }
}
```

**Error responses:**

| HTTP | Code | Khi nao |
| --- | --- | --- |
| 400 | `Validation.General` | Sai validator request |
| 404 | `Program.NotFound` | Program khong ton tai hoac da soft delete |
| 401 | Unauthorized | Chua dang nhap |
| 403 | Forbidden | Role khong duoc phep |

---

### 4.6 POST `/api/programs/{id}/branches/{branchId}`

Dung de gan 1 program vao 1 chi nhanh. Vi program la tai nguyen dung chung, 1 program co the duoc gan vao nhieu chi nhanh khac nhau.

**Roles:** `Admin`, `ManagementStaff`

**Path params:**

| Field | Type | Required | Mo ta |
| --- | --- | --- | --- |
| `id` | `Guid` | Yes | Program id |
| `branchId` | `Guid` | Yes | Branch id |

**Body:** Khong co body.

**Success response:**

```json
{
  "isSuccess": true,
  "data": {
    "id": "guid",
    "programId": "guid",
    "programName": "Kids Starter",
    "branchId": "guid",
    "branchName": "Rex District 1",
    "isActive": true,
    "defaultMakeupClassId": null
  }
}
```

**Error responses:**

| HTTP | Code | Khi nao |
| --- | --- | --- |
| 400 | `Validation.General` | `id` hoac `branchId` rong |
| 404 | `Program.NotFound` | Program khong ton tai, bi delete hoac inactive |
| 404 | `Program.BranchNotFound` | Branch khong ton tai hoac khong active |
| 409 | `Program.AlreadyAssignedToBranch` | Program da duoc gan vao branch nay roi |
| 401 | Unauthorized | Chua dang nhap |
| 403 | Forbidden | Role khong duoc phep |

**Validation rules:**

- `programId` bat buoc.
- `branchId` bat buoc.
- Branch phai ton tai va `IsActive = true`.
- Program phai ton tai, `!IsDeleted`, `IsActive = true`.
- Khong cho tao assignment trung (same program + same branch).

---

### 4.7 DELETE `/api/programs/{id}`

Dung de soft delete program. Khi xoa, program se bi an khoi tat ca chi nhanh.

**Roles:** `Admin`

**Path params:**

| Field | Type | Required |
| --- | --- | --- |
| `id` | `Guid` | Yes |

**Success response:**

```json
{
  "isSuccess": true,
  "data": null
}
```

**Error responses:**

| HTTP | Code | Khi nao |
| --- | --- | --- |
| 400 | `Validation.General` | `id` rong |
| 404 | `Program.NotFound` | Program khong ton tai hoac da delete |
| 409 | `Program.HasActiveClasses` | Program dang duoc su dung boi class co `status = Active` (o bat ky chi nhanh nao) |
| 401 | Unauthorized | Chua dang nhap |
| 403 | Forbidden | Role khong phai `Admin` |

**Validation rules:**

- `id` bat buoc.
- Chi duoc xoa mem.
- Khi xoa, backend set `isDeleted = true`, `isActive = false`.
- Loi `Program.HasActiveClasses` se xay ra neu bat ky chi nhanh nao dang su dung program co class active.

---

### 4.8 PATCH `/api/programs/{id}/toggle-status`

Dung de dao trang thai active/inactive cua program (anh huong toan bo chi nhanh dang dung program nay).

**Roles:** `Admin`, `ManagementStaff`

**Path params:**

| Field | Type | Required |
| --- | --- | --- |
| `id` | `Guid` | Yes |

**Success response:**

```json
{
  "isSuccess": true,
  "data": {
    "id": "guid",
    "isActive": false
  }
}
```

**Error responses:**

| HTTP | Code | Khi nao |
| --- | --- | --- |
| 400 | `Validation.General` | `id` rong |
| 404 | `Program.NotFound` | Program khong ton tai hoac da soft delete |
| 401 | Unauthorized | Chua dang nhap |
| 403 | Forbidden | Role khong duoc phep |

---

## 5. Status definition

Program hien tai khong co enum status rieng. Trang thai duoc suy ra tu cac flag.

### Program status

| Flag / field | Y nghia |
| --- | --- |
| `isActive = true`, `isDeleted = false` | Program dang hoat dong (tat ca chi nhanh assign co the dung) |
| `isActive = false`, `isDeleted = false` | Program dang inactive (an tren tat ca chi nhanh) |
| `isDeleted = true` | Program da bi soft delete (khong hien thi o bat ky chi nhanh nao) |
| `status = "Active"` | Field read-only trong list/detail, derive tu `isActive = true` |
| `status = "Inactive"` | Field read-only trong list/detail, derive tu `isActive = false` |

### Branch assignment status

| Field | Y nghia |
| --- | --- |
| `branchAssignments[].isActive` | Chi nhanh nay dang su dung program |
| `assignedBranchCount` | So chi nhanh dang duoc gan vao program nay |
| `defaultMakeupClassId` | Class makeup mac dinh theo branch-program, co the null |

### Luong chuyen trang thai

1. `Create program` -> `isActive = true`, `isDeleted = false`, chua co branch nao
2. `Assign branch` -> tao branch assignment moi `isActive = true` (1 program co the assign nhieu branch)
3. `Toggle status` -> dao qua lai giua `active` va `inactive` (anh huong toan bo chi nhanh)
4. `Delete program` -> `isDeleted = true`, `isActive = false` (an khoi tat ca chi nhanh)

**Ghi chu:**

- Hien tai chua co API unassign branch.
- Hien tai khong co API branch-level toggle assignment trong `ProgramController`.

---

## 6. Permission matrix theo role

| Endpoint | Admin | ManagementStaff | Teacher | Parent | Student | Anonymous |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /api/programs` | Yes | Yes | No | No | No | No |
| `GET /api/programs` | Yes | Yes | Yes | No | No | No |
| `GET /api/programs/active` | Yes | Yes | Yes | Yes | Yes | Yes |
| `GET /api/programs/{id}` | Yes | Yes | Yes | Yes | Yes | Yes |
| `PUT /api/programs/{id}` | Yes | Yes | No | No | No | No |
| `POST /api/programs/{id}/branches/{branchId}` | Yes | Yes | No | No | No | No |
| `DELETE /api/programs/{id}` | Yes | No | No | No | No | No |
| `PATCH /api/programs/{id}/toggle-status` | Yes | Yes | No | No | No | No |

---

## 7. Validation rule tong hop

| Rule | API ap dung | Loi |
| --- | --- | --- |
| `name` khong duoc rong | create, update | 400 |
| `name` max 255 | create, update | 400 |
| `code` khong duoc rong | create, update | 400 |
| `code` max 10 | create, update | 400 |
| Khong duoc vua `isMakeup = true` vua `isSupplementary = true` | create, update | 400 |
| `id` bat buoc | update, delete, toggle | 400 |
| `programId`, `branchId` bat buoc | assign branch | 400 |
| Branch phai ton tai va active | assign branch | 404 `Program.BranchNotFound` |
| Program phai ton tai, active, chua delete | assign branch | 404 `Program.NotFound` |
| Khong duoc assign trung branch (same program + same branch) | assign branch | 409 `Program.AlreadyAssignedToBranch` |
| Khong duoc xoa khi con class active (o bat ky chi nhanh nao) | delete | 409 `Program.HasActiveClasses` |

---

## 8. Cac truong hop tra loi can luu y

- `GET /api/programs/{id}` tra `404` neu program da soft delete.
- `POST /api/programs/{id}/branches/{branchId}` tra `404` neu program inactive, du id van ton tai.
- `DELETE /api/programs/{id}` la soft delete, khong xoa vat ly.
- Hien tai backend khong validate unique `code` hay unique `name` cho program.
- Khi `branchId` duoc truyen trong list API, FE chi thay program da duoc assign cho branch do — nhung day van la program dung chung, khong phai program rieng cua branch.

---

## 9. Kien truc shared program — ghi chu FE

- **Program la global resource**: `POST /api/programs` tao 1 program thuoc toan he thong, khong thuoc rieng chi nhanh nao.
- **Branch assignment**: `POST /api/programs/{id}/branches/{branchId}` tao lien ket giua program va chi nhanh. 1 program co the duoc assign vao nhieu chi nhanh.
- **Filter theo branch**: Truyen `branchId` vao `GET /api/programs` hoac `GET /api/programs/active` de loc chi hien program da duoc assign vao chi nhanh do.
- **Toggle/Delete la global**: Toggle status va delete anh huong den program toan cuc, khong chi rieng 1 chi nhanh.
- **FE nen hien thi**: `assignedBranchCount` trong list view de user biet 1 program dang duoc bao nhieu chi nhanh dung.
