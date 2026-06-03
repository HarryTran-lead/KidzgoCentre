# Student Academic Progress FE Doc

Tai lieu nay tom tat phan "Tien trinh HV" trong he thong de frontend map dung backend.

## 1. Phan nao trong he thong dang xu ly "tien trinh hoc vien"

Neu dang noi den tab `Tien trinh HV` trong man `Academic Progression`, backend chinh la:

- Controller: `Kidzgo.API/Controllers/StudentProgressController.cs`
- Entity luu du lieu: `Kidzgo.Domain/AcademicProgression/StudentProgress.cs`
- Service tinh toan: `Kidzgo.Application/Services/ProgressionService.cs`

Phan nay khac voi:

- `Level & Module`: quan ly cau truc hoc thuat (`levels`, `modules`)
- `Level Progression`: danh gia len level/chuyen chuong trinh (`api/level-progressions/...`)

Noi ngan gon:

- `student-progress` = hoc vien dang hoc toi dau trong module nao, hoan thanh bao nhieu %, da assessment chua, co can remedial khong.
- `level-progressions` = quy trinh danh gia va phe duyet len level/chuyen chuong trinh.

## 2. API FE can dung cho tab `Tien trinh HV`

### 2.1 Dashboard tong quan

`GET /api/student-progress/dashboard`

Role:

- `Admin`
- `ManagementStaff`
- `Teacher`

Dung de hien cac o tong quan o dau man:

- `inProgressStudents`
- `completedStudents`
- `remedialRequiredStudents`
- `failedPromotions`
- `weakModules[]`

Response mau:

```json
{
  "isSuccess": true,
  "data": {
    "inProgressStudents": 32,
    "completedStudents": 18,
    "remedialRequiredStudents": 4,
    "failedPromotions": 2,
    "weakModules": [
      {
        "moduleId": "guid",
        "moduleCode": "STARTERS_M1",
        "moduleName": "Alphabet",
        "remedialCount": 3,
        "averageCompletionPercent": 64.2
      }
    ]
  }
}
```

### 2.2 Chi tiet tien trinh cua 1 hoc vien

`GET /api/student-progress/{studentId}`

Role:

- `Admin`
- `ManagementStaff`
- `Teacher`

API nay tra ve danh sach progress theo tung module cua hoc vien.

Response mau:

```json
{
  "isSuccess": true,
  "data": {
    "items": [
      {
        "id": "guid",
        "studentProfileId": "guid",
        "moduleId": "guid",
        "moduleCode": "STARTERS_M1",
        "moduleName": "Alphabet",
        "levelCode": "STARTERS",
        "status": "InProgress",
        "completionPercent": 85.5,
        "assessmentStatus": "Passed",
        "promotionStatus": "Pending",
        "lastAssessmentId": "guid",
        "currentLessonPlanTemplateId": "guid",
        "startedAt": "2026-05-16T10:00:00Z",
        "completedAt": null
      }
    ]
  }
}
```

Y nghia field:

- `status`: trang thai hoc trong module
- `completionPercent`: % hoan thanh module
- `assessmentStatus`: ket qua assessment gan nhat
- `promotionStatus`: ket qua xet len module/len level
- `currentLessonPlanTemplateId`: bai dang hoc den
- `lastAssessmentId`: assessment noi voi hoc vien/module nay

### 2.3 Update tay progress

`POST /api/student-progress/update`

Role:

- `Admin`
- `ManagementStaff`
- `Teacher`

Request:

```json
{
  "studentProfileId": "guid",
  "moduleId": "guid",
  "currentLessonPlanTemplateId": "guid",
  "completionPercent": 50
}
```

Dung khi can force sync/chinh tay. Trong flow binh thuong FE khong nen goi API nay thuong xuyen neu da co lesson plan va teaching log.

## 3. Progress duoc tinh nhu the nao

Logic nam trong `ProgressionService`.

### 3.1 Nguon du lieu tinh completion

`completionPercent` duoc tinh tu:

- `LessonPlanTemplates` thuoc module
- `Attendances` cua hoc vien
- `Sessions`
- `LessonPlans`

Backend chi tinh tren cac session ma hoc vien co diem danh:

- `Present`
- `Makeup`

Va lay `CompletionPercent` cua `LessonPlan` theo tung template. Neu 1 template xuat hien nhieu lan thi backend lay gia tri cao nhat cua template do.

Cong thuc rut gon:

`completionPercent = average(max completion cua moi lesson template trong module)`

### 3.2 Nguong trang thai

Backend dang dung nguong:

- `Completed` khi `completionPercent >= 80`
- `NotStarted` va cac nguong con lai can doi chieu them voi backend neu thay doi logic trong `ProgressionService`.

## 4. Mapping FE hien tai

Trong frontend, phan student progress da duoc map tai:

- `lib/api/academicProgressionService.ts`
- `components/academic-progression/StudentProgressWorkspace.tsx`
- `components/academic-progression/AcademicProgressionWorkspace.tsx`

Goi y FE:

- Uu tien `GET /api/student-progress/{studentId}` de hien thi chi tiet module.
- Dung `dashboard` de render tong quan.
- Khong spam API `update` trong flow binh thuong.
