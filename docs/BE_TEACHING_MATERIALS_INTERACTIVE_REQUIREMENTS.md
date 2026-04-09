# BE Requirements: Tương tác trực tiếp tài liệu trên web

> Ngày: 2026-04-09
> Mục tiêu: Cho phép tất cả role (Admin, Teacher, Staff, Student) xem và tương tác trực tiếp với tài liệu giảng dạy ngay trên web, không cần tải về.

---

## 1. Vấn đề hiện tại

| Vấn đề | Mô tả |
|---|---|
| **PPTX/DOCX/XLSX không preview được** | `GET /{id}/preview` trả raw binary → browser download thay vì render. FE phải hiển thị nút "Tải xuống để xem" |
| **Không có slide-by-slide** | Không thể xem từng slide của bài giảng trên web |
| **Student bị chặn** | Controller chỉ authorize `Teacher`, `ManagementStaff`, `Admin` |
| **Không tracking tiến độ** | Không biết ai đã xem tài liệu nào, xem đến đâu |
| **Không có bookmark/ghi chú** | User không thể đánh dấu hoặc ghi chú trên tài liệu |

---

## 2. Yêu cầu BE theo thứ tự ưu tiên

---

### 2.1 [P0] Office → PDF preview (QUAN TRỌNG NHẤT)

**Mục đích**: Cho phép xem PPTX, DOCX, XLSX trực tiếp trên browser dưới dạng PDF.

#### Endpoint mới

```http
GET /api/teaching-materials/{id}/preview-pdf
Authorization: Bearer <token>
```

#### Logic

1. Nhận `id` (TeachingMaterial.Id)
2. Kiểm tra `fileType`:
   - Nếu `Image`, `Pdf`, `Audio`, `Video` → redirect hoặc proxy sang `/{id}/preview` (đã có)
   - Nếu `Presentation`, `Document`, `Spreadsheet` → convert sang PDF rồi stream về
3. Cache PDF đã convert để không convert lại mỗi lần
4. Response: binary `application/pdf` (giống cách `/{id}/preview` hoạt động)

#### Cách convert (recommend)

**Option A — LibreOffice headless (FREE, recommend)**:
```bash
soffice --headless --convert-to pdf --outdir /tmp "input.pptx"
```
- Cài LibreOffice trên server
- Gọi CLI từ C# bằng `Process.Start`
- Chất lượng cao nhất, hỗ trợ font tiếng Việt tốt

**Option B — Aspose (PAID)**:
```csharp
// Aspose.Slides
var presentation = new Presentation("input.pptx");
presentation.Save("output.pdf", SaveFormat.Pdf);

// Aspose.Words
var doc = new Document("input.docx");
doc.Save("output.pdf", SaveFormat.Pdf);
```
- Không cần cài gì thêm trên server
- License ~$1000+/year

**Option C — GemBox (cheaper paid)**:
```csharp
var presentation = PresentationDocument.Load("input.pptx");
presentation.Save("output.pdf");
```

#### DB Migration

```sql
ALTER TABLE TeachingMaterials ADD
    PdfPreviewPath NVARCHAR(500) NULL,
    PdfPreviewGeneratedAt DATETIME2 NULL,
    PdfPreviewFileSize BIGINT NULL;
```

#### Entity update

```csharp
// Domain/Entities/TeachingMaterial.cs
public string? PdfPreviewPath { get; private set; }
public DateTime? PdfPreviewGeneratedAt { get; private set; }
public long? PdfPreviewFileSize { get; private set; }

public void SetPdfPreview(string path, long fileSize)
{
    PdfPreviewPath = path;
    PdfPreviewFileSize = fileSize;
    PdfPreviewGeneratedAt = DateTime.UtcNow;
}
```

#### Response bổ sung trong metadata

Thêm field vào response của `GET /api/teaching-materials` và `GET /{id}`:

```json
{
  "id": "...",
  "previewUrl": "/api/teaching-materials/{id}/preview",
  "previewPdfUrl": "/api/teaching-materials/{id}/preview-pdf",
  "downloadUrl": "/api/teaching-materials/{id}/download",
  "hasPdfPreview": true
}
```

#### Error mới

```json
{
  "title": "TeachingMaterial.PdfConversionFailed",
  "status": 500,
  "detail": "Failed to convert teaching material to PDF format"
}
```

```json
{
  "title": "TeachingMaterial.PdfConversionNotSupported",
  "status": 400,
  "detail": "PDF conversion is not supported for file type 'Archive'"
}
```

---

### 2.2 [P0] Slide-by-slide preview cho Presentation

**Mục đích**: Xem từng slide của bài giảng PPTX như PowerPoint Online, cho phép FE build slideshow viewer.

#### Endpoints mới

**Lấy danh sách slides**:
```http
GET /api/teaching-materials/{id}/slides
Authorization: Bearer <token>
```

**Response**:
```json
{
  "isSuccess": true,
  "data": {
    "materialId": "3c7ce48f-...",
    "displayName": "UNIT 1-L2-READING _ WRITING",
    "totalSlides": 15,
    "slides": [
      {
        "slideNumber": 1,
        "width": 1920,
        "height": 1080,
        "previewUrl": "/api/teaching-materials/3c7ce48f-.../slides/1/preview",
        "thumbnailUrl": "/api/teaching-materials/3c7ce48f-.../slides/1/thumbnail",
        "hasNotes": true
      },
      {
        "slideNumber": 2,
        "width": 1920,
        "height": 1080,
        "previewUrl": "/api/teaching-materials/3c7ce48f-.../slides/2/preview",
        "thumbnailUrl": "/api/teaching-materials/3c7ce48f-.../slides/2/thumbnail",
        "hasNotes": false
      }
    ]
  }
}
```

**Lấy ảnh slide full-size**:
```http
GET /api/teaching-materials/{id}/slides/{slideNumber}/preview
Authorization: Bearer <token>
```
→ Response: `image/png` hoặc `image/jpeg` (binary)

**Lấy thumbnail nhỏ**:
```http
GET /api/teaching-materials/{id}/slides/{slideNumber}/thumbnail
Authorization: Bearer <token>
```
→ Response: `image/jpeg` (binary, ~300px width)

**Lấy speaker notes** (optional):
```http
GET /api/teaching-materials/{id}/slides/{slideNumber}/notes
Authorization: Bearer <token>
```
→ Response:
```json
{
  "isSuccess": true,
  "data": {
    "slideNumber": 1,
    "notes": "Giới thiệu bài học, hỏi học sinh về chủ đề Reading..."
  }
}
```

#### Logic BE

1. Khi gọi `GET /{id}/slides` lần đầu:
   - Decrypt file PPTX
   - Dùng LibreOffice hoặc Aspose export từng slide thành PNG
   - Tạo thumbnail (resize ~300px width)
   - Cache vào disk (folder riêng theo materialId)
2. Các lần sau → serve từ cache
3. Khi file bị re-upload → xóa cache cũ

#### DB Migration

```sql
CREATE TABLE TeachingMaterialSlides (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    SlideNumber INT NOT NULL,
    PreviewImagePath NVARCHAR(500) NOT NULL,
    ThumbnailImagePath NVARCHAR(500) NOT NULL,
    Width INT NOT NULL DEFAULT 1920,
    Height INT NOT NULL DEFAULT 1080,
    Notes NVARCHAR(MAX) NULL,
    GeneratedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Slides_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT UQ_Slides_Material_Number
        UNIQUE (TeachingMaterialId, SlideNumber)
);

CREATE INDEX IX_Slides_MaterialId
    ON TeachingMaterialSlides(TeachingMaterialId);
```

#### Error mới

```json
{
  "title": "TeachingMaterial.NotAPresentation",
  "status": 400,
  "detail": "Slide preview is only available for Presentation file types"
}
```

```json
{
  "title": "TeachingMaterial.SlideNotFound",
  "status": 404,
  "detail": "Slide number 20 not found. This presentation has 15 slides"
}
```

```json
{
  "title": "TeachingMaterial.SlideGenerationFailed",
  "status": 500,
  "detail": "Failed to generate slide images for teaching material '...'"
}
```

---

### 2.3 [P0] Mở rộng Role Access cho Student

**Mục đích**: Student cần xem tài liệu bài học của mình.

#### Thay đổi Authorization

Hiện tại controller có:
```csharp
[Authorize(Roles = "Teacher,ManagementStaff,Admin")]
```

**Cần tách authorize theo từng endpoint**:

```csharp
// Upload — chỉ staff
[HttpPost("upload")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin")]
public async Task<IActionResult> Upload(...) { }

// Read endpoints — tất cả role
[HttpGet]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> GetAll(...) { }

[HttpGet("{id:guid}")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> GetById(Guid id) { }

[HttpGet("lesson-bundle")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> GetLessonBundle(...) { }

[HttpGet("{id:guid}/preview")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> Preview(Guid id) { }

[HttpGet("{id:guid}/preview-pdf")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> PreviewPdf(Guid id) { }

[HttpGet("{id:guid}/slides")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> GetSlides(Guid id) { }

[HttpGet("{id:guid}/slides/{slideNumber:int}/preview")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> GetSlidePreview(Guid id, int slideNumber) { }

[HttpGet("{id:guid}/slides/{slideNumber:int}/thumbnail")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> GetSlideThumbnail(Guid id, int slideNumber) { }

[HttpGet("{id:guid}/download")]
[Authorize(Roles = "Teacher,ManagementStaff,Admin,Student")]
public async Task<IActionResult> Download(Guid id) { }
```

#### Student data filtering

Student chỉ nên thấy materials thuộc program/class mà họ đang enrolled:

```csharp
// Trong query handler cho GetAll
if (currentUser.Role == "Student")
{
    var enrolledProgramIds = await _enrollmentRepository
        .GetActiveProgramIdsForStudent(currentUser.Id);

    query = query.Where(m => enrolledProgramIds.Contains(m.ProgramId));
}
```

---

### 2.4 [P1] Tracking tiến độ xem tài liệu

**Mục đích**: Teacher/Admin biết student đã xem tài liệu nào, xem đến đâu.

#### Endpoints mới

**Cập nhật tiến độ (user tự gọi khi xem)**:
```http
POST /api/teaching-materials/{id}/view-progress
Authorization: Bearer <token>
Content-Type: application/json
```

Request:
```json
{
  "progressPercent": 75,
  "lastSlideViewed": 8,
  "totalTimeSeconds": 320
}
```

Response:
```json
{
  "isSuccess": true,
  "data": {
    "materialId": "3c7ce48f-...",
    "userId": "05adf46b-...",
    "progressPercent": 75,
    "lastSlideViewed": 8,
    "totalTimeSeconds": 320,
    "firstViewedAt": "2026-04-09T10:00:00Z",
    "lastViewedAt": "2026-04-09T10:05:20Z",
    "viewCount": 3,
    "completed": false
  }
}
```

**Lấy tiến độ của mình**:
```http
GET /api/teaching-materials/{id}/view-progress
Authorization: Bearer <token>
```

**Lấy tổng hợp tiến độ (Admin/Teacher only)**:
```http
GET /api/teaching-materials/{id}/view-progress/summary
Authorization: Bearer <token>
```

Response:
```json
{
  "isSuccess": true,
  "data": {
    "materialId": "3c7ce48f-...",
    "totalViewers": 25,
    "completedCount": 18,
    "averageProgressPercent": 82,
    "averageTimeSeconds": 450,
    "viewers": [
      {
        "userId": "...",
        "userName": "Nguyễn Văn A",
        "avatarUrl": "...",
        "progressPercent": 100,
        "lastSlideViewed": 15,
        "totalTimeSeconds": 600,
        "viewCount": 2,
        "completed": true,
        "lastViewedAt": "2026-04-09T10:05:20Z"
      }
    ]
  }
}
```

**Lấy tiến độ theo lesson (Admin/Teacher only)**:
```http
GET /api/teaching-materials/lesson-progress?programId=...&unitNumber=...&lessonNumber=...
Authorization: Bearer <token>
```

Response:
```json
{
  "isSuccess": true,
  "data": {
    "programName": "Starter",
    "unitNumber": 1,
    "lessonNumber": 2,
    "lessonTitle": "READING _ WRITING",
    "totalMaterials": 5,
    "students": [
      {
        "userId": "...",
        "userName": "Nguyễn Văn A",
        "materialsViewed": 4,
        "materialsCompleted": 3,
        "overallProgress": 80,
        "totalTimeSeconds": 1200
      }
    ]
  }
}
```

#### DB Migration

```sql
CREATE TABLE TeachingMaterialViewProgress (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    ProgressPercent INT NOT NULL DEFAULT 0,
    LastSlideViewed INT NULL,
    TotalTimeSeconds INT NOT NULL DEFAULT 0,
    ViewCount INT NOT NULL DEFAULT 1,
    Completed BIT NOT NULL DEFAULT 0,
    FirstViewedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastViewedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_ViewProgress_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_ViewProgress_User
        FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
        ON DELETE CASCADE,

    CONSTRAINT UQ_ViewProgress_Material_User
        UNIQUE (TeachingMaterialId, UserId),

    CONSTRAINT CK_ViewProgress_Percent
        CHECK (ProgressPercent >= 0 AND ProgressPercent <= 100)
);

CREATE INDEX IX_ViewProgress_MaterialId ON TeachingMaterialViewProgress(TeachingMaterialId);
CREATE INDEX IX_ViewProgress_UserId ON TeachingMaterialViewProgress(UserId);
CREATE INDEX IX_ViewProgress_Completed ON TeachingMaterialViewProgress(Completed);
```

#### Authorization

| Endpoint | Admin | Teacher | Staff | Student |
|---|---|---|---|---|
| `POST /{id}/view-progress` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/view-progress` | ✅ | ✅ | ✅ | ✅ (own) |
| `GET /{id}/view-progress/summary` | ✅ | ✅ | ❌ | ❌ |
| `GET /lesson-progress` | ✅ | ✅ | ❌ | ❌ |

---

### 2.5 [P2] Bookmark tài liệu

**Mục đích**: User đánh dấu tài liệu quan trọng để xem lại.

#### Endpoints mới

```http
POST   /api/teaching-materials/{id}/bookmark
DELETE /api/teaching-materials/{id}/bookmark
GET    /api/teaching-materials/bookmarks?pageNumber=1&pageSize=20
```

**POST request**:
```json
{
  "note": "Ôn lại phần này trước khi kiểm tra"
}
```

**GET response**:
```json
{
  "isSuccess": true,
  "data": {
    "items": [
      {
        "bookmarkId": "...",
        "materialId": "3c7ce48f-...",
        "displayName": "UNIT 1-L2-READING _ WRITING",
        "fileType": "Presentation",
        "programName": "Starter",
        "unitNumber": 1,
        "lessonNumber": 2,
        "note": "Ôn lại phần này trước khi kiểm tra",
        "createdAt": "2026-04-09T10:00:00Z"
      }
    ],
    "totalCount": 5
  }
}
```

#### DB Migration

```sql
CREATE TABLE TeachingMaterialBookmarks (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Note NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Bookmark_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Bookmark_User
        FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
        ON DELETE CASCADE,

    CONSTRAINT UQ_Bookmark_Material_User
        UNIQUE (TeachingMaterialId, UserId)
);
```

#### Authorization

Tất cả role (`Admin`, `Teacher`, `ManagementStaff`, `Student`) đều dùng được. Mỗi user chỉ thao tác bookmark của mình.

---

### 2.6 [P2] Annotation / Ghi chú trên slide

**Mục đích**: Teacher ghi chú trên từng slide để hướng dẫn student, student ghi chú riêng cho mình.

#### Endpoints mới

```http
POST   /api/teaching-materials/{id}/annotations
GET    /api/teaching-materials/{id}/annotations?slideNumber=3&visibility=All
PUT    /api/teaching-materials/annotations/{annotationId}
DELETE /api/teaching-materials/annotations/{annotationId}
```

**POST request**:
```json
{
  "slideNumber": 3,
  "content": "Chú ý phần này cho bài kiểm tra",
  "color": "#FFD700",
  "positionX": 0.45,
  "positionY": 0.30,
  "type": "Note",
  "visibility": "Private"
}
```

**Các giá trị `visibility`**:
- `Private` — chỉ người tạo thấy
- `Class` — tất cả student trong cùng class thấy (Teacher dùng)
- `Public` — tất cả thấy (Admin dùng)

**Các giá trị `type`**:
- `Note` — ghi chú text
- `Highlight` — đánh dấu vùng trên slide
- `Pin` — ghim điểm quan trọng

**GET response**:
```json
{
  "isSuccess": true,
  "data": [
    {
      "id": "...",
      "slideNumber": 3,
      "content": "Chú ý phần này cho bài kiểm tra",
      "color": "#FFD700",
      "positionX": 0.45,
      "positionY": 0.30,
      "type": "Note",
      "visibility": "Class",
      "createdByUserId": "...",
      "createdByName": "Cô Hương",
      "createdAt": "2026-04-09T10:00:00Z",
      "updatedAt": "2026-04-09T10:00:00Z"
    }
  ]
}
```

#### DB Migration

```sql
CREATE TABLE TeachingMaterialAnnotations (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    SlideNumber INT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Content NVARCHAR(2000) NOT NULL,
    Color NVARCHAR(20) NULL DEFAULT '#FFD700',
    PositionX FLOAT NULL,
    PositionY FLOAT NULL,
    Type NVARCHAR(20) NOT NULL DEFAULT 'Note',
    Visibility NVARCHAR(20) NOT NULL DEFAULT 'Private',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Annotation_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Annotation_User
        FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
        ON DELETE CASCADE,

    CONSTRAINT CK_Annotation_Type
        CHECK (Type IN ('Note', 'Highlight', 'Pin')),

    CONSTRAINT CK_Annotation_Visibility
        CHECK (Visibility IN ('Private', 'Class', 'Public'))
);

CREATE INDEX IX_Annotation_MaterialId ON TeachingMaterialAnnotations(TeachingMaterialId);
CREATE INDEX IX_Annotation_UserId ON TeachingMaterialAnnotations(UserId);
CREATE INDEX IX_Annotation_SlideNumber ON TeachingMaterialAnnotations(TeachingMaterialId, SlideNumber);
```

#### Authorization

| Action | Admin | Teacher | Staff | Student |
|---|---|---|---|---|
| Create annotation | ✅ | ✅ | ✅ | ✅ (Private only) |
| Read own annotations | ✅ | ✅ | ✅ | ✅ |
| Read Class annotations | ✅ | ✅ | ✅ | ✅ |
| Read Public annotations | ✅ | ✅ | ✅ | ✅ |
| Edit own annotation | ✅ | ✅ | ✅ | ✅ |
| Delete own annotation | ✅ | ✅ | ✅ | ✅ |
| Create Class visibility | ✅ | ✅ | ❌ | ❌ |
| Create Public visibility | ✅ | ❌ | ❌ | ❌ |

---

## 3. Tổng hợp Authorize Matrix

| Endpoint | Admin | Teacher | Staff | Student |
|---|---|---|---|---|
| `POST /upload` | ✅ | ✅ | ✅ | ❌ |
| `GET /` (list) | ✅ | ✅ | ✅ | ✅ (filtered by enrollment) |
| `GET /{id}` | ✅ | ✅ | ✅ | ✅ |
| `GET /lesson-bundle` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/preview` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/preview-pdf` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/download` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/slides` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/slides/{n}/preview` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/slides/{n}/thumbnail` | ✅ | ✅ | ✅ | ✅ |
| `POST /{id}/view-progress` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/view-progress` | ✅ | ✅ | ✅ | ✅ (own) |
| `GET /{id}/view-progress/summary` | ✅ | ✅ | ❌ | ❌ |
| `GET /lesson-progress` | ✅ | ✅ | ❌ | ❌ |
| `POST /{id}/bookmark` | ✅ | ✅ | ✅ | ✅ |
| `DELETE /{id}/bookmark` | ✅ | ✅ | ✅ | ✅ |
| `GET /bookmarks` | ✅ | ✅ | ✅ | ✅ |
| `POST /{id}/annotations` | ✅ | ✅ | ✅ | ✅ |
| `GET /{id}/annotations` | ✅ | ✅ | ✅ | ✅ |
| `PUT /annotations/{id}` | ✅ | ✅ | ✅ | ✅ (own) |
| `DELETE /annotations/{id}` | ✅ | ✅ | ✅ | ✅ (own) |

---

## 4. DB Migration tổng hợp

```sql
-- =============================================
-- 1. Thêm cột PDF preview vào TeachingMaterials
-- =============================================
ALTER TABLE TeachingMaterials ADD
    PdfPreviewPath NVARCHAR(500) NULL,
    PdfPreviewGeneratedAt DATETIME2 NULL,
    PdfPreviewFileSize BIGINT NULL;

-- =============================================
-- 2. Bảng Slides (cache ảnh từng slide)
-- =============================================
CREATE TABLE TeachingMaterialSlides (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    SlideNumber INT NOT NULL,
    PreviewImagePath NVARCHAR(500) NOT NULL,
    ThumbnailImagePath NVARCHAR(500) NOT NULL,
    Width INT NOT NULL DEFAULT 1920,
    Height INT NOT NULL DEFAULT 1080,
    Notes NVARCHAR(MAX) NULL,
    GeneratedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Slides_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT UQ_Slides_Material_Number
        UNIQUE (TeachingMaterialId, SlideNumber)
);

CREATE INDEX IX_Slides_MaterialId
    ON TeachingMaterialSlides(TeachingMaterialId);

-- =============================================
-- 3. Bảng View Progress
-- =============================================
CREATE TABLE TeachingMaterialViewProgress (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    ProgressPercent INT NOT NULL DEFAULT 0,
    LastSlideViewed INT NULL,
    TotalTimeSeconds INT NOT NULL DEFAULT 0,
    ViewCount INT NOT NULL DEFAULT 1,
    Completed BIT NOT NULL DEFAULT 0,
    FirstViewedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    LastViewedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_ViewProgress_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_ViewProgress_User
        FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
        ON DELETE CASCADE,

    CONSTRAINT UQ_ViewProgress_Material_User
        UNIQUE (TeachingMaterialId, UserId),

    CONSTRAINT CK_ViewProgress_Percent
        CHECK (ProgressPercent >= 0 AND ProgressPercent <= 100)
);

CREATE INDEX IX_ViewProgress_MaterialId ON TeachingMaterialViewProgress(TeachingMaterialId);
CREATE INDEX IX_ViewProgress_UserId ON TeachingMaterialViewProgress(UserId);
CREATE INDEX IX_ViewProgress_Completed ON TeachingMaterialViewProgress(Completed);

-- =============================================
-- 4. Bảng Bookmarks
-- =============================================
CREATE TABLE TeachingMaterialBookmarks (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Note NVARCHAR(500) NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Bookmark_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Bookmark_User
        FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
        ON DELETE CASCADE,

    CONSTRAINT UQ_Bookmark_Material_User
        UNIQUE (TeachingMaterialId, UserId)
);

-- =============================================
-- 5. Bảng Annotations
-- =============================================
CREATE TABLE TeachingMaterialAnnotations (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TeachingMaterialId UNIQUEIDENTIFIER NOT NULL,
    SlideNumber INT NULL,
    UserId UNIQUEIDENTIFIER NOT NULL,
    Content NVARCHAR(2000) NOT NULL,
    Color NVARCHAR(20) NULL DEFAULT '#FFD700',
    PositionX FLOAT NULL,
    PositionY FLOAT NULL,
    Type NVARCHAR(20) NOT NULL DEFAULT 'Note',
    Visibility NVARCHAR(20) NOT NULL DEFAULT 'Private',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_Annotation_Material
        FOREIGN KEY (TeachingMaterialId)
        REFERENCES TeachingMaterials(Id)
        ON DELETE CASCADE,

    CONSTRAINT FK_Annotation_User
        FOREIGN KEY (UserId)
        REFERENCES AspNetUsers(Id)
        ON DELETE CASCADE,

    CONSTRAINT CK_Annotation_Type
        CHECK (Type IN ('Note', 'Highlight', 'Pin')),

    CONSTRAINT CK_Annotation_Visibility
        CHECK (Visibility IN ('Private', 'Class', 'Public'))
);

CREATE INDEX IX_Annotation_MaterialId ON TeachingMaterialAnnotations(TeachingMaterialId);
CREATE INDEX IX_Annotation_UserId ON TeachingMaterialAnnotations(UserId);
CREATE INDEX IX_Annotation_SlideNumber ON TeachingMaterialAnnotations(TeachingMaterialId, SlideNumber);
```

---

## 5. Thứ tự triển khai

| Phase | Feature | Impact | Effort | FE sẵn sàng? |
|---|---|---|---|---|
| **Phase 1** | Student role access (2.3) | Cao | Thấp | ✅ Đã có StudentLearningView |
| **Phase 2** | Office → PDF preview (2.1) | Rất cao | Trung bình | ✅ FE chỉ cần thêm iframe cho PDF |
| **Phase 3** | Slide-by-slide (2.2) | Rất cao | Trung bình | 🔄 FE cần build slideshow viewer |
| **Phase 4** | View progress tracking (2.4) | Trung bình | Trung bình | 🔄 FE cần gọi POST khi xem |
| **Phase 5** | Bookmarks (2.5) | Thấp | Thấp | 🔄 FE cần nút bookmark |
| **Phase 6** | Annotations (2.6) | Thấp | Cao | 🔄 FE cần overlay trên slide |

**Khuyến nghị**: Triển khai Phase 1 → 2 → 3 trước. Ba phase này unlock 90% trải nghiệm "tương tác trực tiếp trên web".

---

## 6. Lưu ý kỹ thuật

### LibreOffice trên server
- Cài: `apt install libreoffice-core libreoffice-impress libreoffice-writer libreoffice-calc`
- Font tiếng Việt: `apt install fonts-liberation fonts-noto-cjk`
- Convert: `soffice --headless --convert-to pdf input.pptx`
- Slide to image: `soffice --headless --convert-to png input.pptx` (export tất cả slide)
- Hoặc dùng LibreOffice UNO API để control từng slide

### Cache strategy
- Lưu PDF/image cache cùng folder với encrypted file
- Naming: `{materialId}_preview.pdf`, `{materialId}_slide_{n}.png`, `{materialId}_thumb_{n}.jpg`
- Invalidate cache khi file bị re-upload hoặc delete
- Optional: background job generate cache khi upload xong (không block upload response)

### Security
- Slide images và PDF preview cũng cần Bearer token để access
- Không expose file path ra response — chỉ expose URL endpoint
- Rate limit cho convert endpoint (tránh DoS bằng cách upload + convert liên tục)
- Giới hạn concurrent convert jobs (LibreOffice headless khá tốn RAM)
