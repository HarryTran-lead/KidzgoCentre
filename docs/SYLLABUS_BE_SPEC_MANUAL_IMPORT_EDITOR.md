# SYLLABUS BE SPEC - Manual + Import + Editor

Updated: 2026-05-24
Owner: FE/BE handoff
Status: Proposed

## 1) Muc tieu

Ho tro day du 3 nhu cau:

1. Tao syllabus thu cong (manual)
2. Import syllabus tu file (Word/PDF parse)
3. Chinh sua truc tiep tren giao dien theo tung section/table cell

Muc tieu FE UI:

1. Hien thong tin chung o dau trang (metadata + narrative)
2. Hien danh sach section theo thu tu tai lieu
3. Moi bang duoc render dung bo cuc (co gop o) va edit duoc

## 2) Nguyen tac thiet ke

1. Manual va Import dung chung mot data model
2. FE render theo `sections[]` theo thu tu, khong tu doan
3. Table layout phai co `rowSpan`/`colSpan` tu BE
4. Moi thao tac edit la granular (section/cell/row), khong bat FE gui full document moi lan
5. Co optimistic concurrency bang `version`
6. Draft/Published tach biet ro

## 2.1 Cau truc archive import dau vao

BE can hieu dung cau truc folder import nhu sau:

- Folder lon `PPCT ...` chi chua 1 file syllabus goc `.docx`
- Moi folder `UNIT ...` chua cac file lesson plan cua unit do
- Folder `REVISION` chua cac file revision

Y nghia nghiep vu:

- 1 file syllabus goc = tai lieu tong cua ca chuong trinh / level
- 1 folder `UNIT X` = 1 module / unit
- Moi file lesson trong folder `UNIT X` = 1 lesson plan template cua unit do
- Moi file `Revision 01`, `Revision 02`, ... trong folder `REVISION` = 1 lesson plan template revision, thuong nam o cuoi 1 module hoac cau noi giua module truoc va module tiep theo

BE khong nen coi `REVISION` la 1 unit binh thuong neu nghiep vu dang map revision theo quy tac rieng.

## 2.2 Mapping import de nghi

Khi import archive, de nghi BE map theo thu tu sau:

1. Tim file syllabus duy nhat trong folder `PPCT ...` va parse thanh `SyllabusDocument`
2. Tim cac folder `UNIT ...` va map moi folder vao 1 module / unit
3. Tim cac file lesson trong tung folder `UNIT ...` va map thanh danh sach lesson plan templates cua module do
4. Tim folder `REVISION` va map moi file revision thanh 1 lesson plan template revision
5. Ap dung `Import Configuration` de quyet dinh revision thuoc module nao, co starter hay khong, va so lesson plan ky vong cho tung module

## 2.3 Import result FE can hieu duoc

Sau import archive, response nen cho FE du thong tin de admin audit duoc:

- file nao la syllabus tong
- file nao thuoc `UNIT X`
- file nao thuoc `REVISION`
- moi file da map vao module/lesson nao
- file nao bi skip va ly do

De nghi imported entry co shape toi thieu:

```json
{
  "entryName": "Unit 1 I love animals lesson 1 done.docx",
  "sourceFolder": "UNIT 1",
  "sourceType": "UnitLesson",
  "moduleId": "uuid",
  "moduleName": "Unit 1",
  "lessonPlanTemplateId": "uuid",
  "sessionIndex": 1,
  "sessionOrder": 1,
  "created": true,
  "title": "Unit 1 - Lesson 1"
}
```

`sourceType` de nghi co cac gia tri:

- `SyllabusDocument`
- `UnitLesson`
- `RevisionLesson`

## 3) Data model de xuat

## 3.1 SyllabusDocument

```json
{
  "id": "uuid",
  "programId": "uuid",
  "levelId": "uuid",
  "code": "STARTERS_V2",
  "title": "THE SYLLABUS OF GET READY FOR STARTERS",
  "edition": "Second edition",
  "status": "Draft",
  "sourceType": "Manual",
  "sourceFileName": null,
  "parserVersion": null,
  "version": 1,
  "summary": {
    "totalUnits": 15,
    "totalSessions": 50,
    "totalLessons": 50,
    "totalPeriods": 100,
    "minutesPerPeriod": 45
  },
  "sections": [],
  "warnings": []
}
```

### status

- `Draft`
- `Published`
- `Archived`

### sourceType

- `Manual`
- `Imported`
- `Hybrid`

## 3.2 Section

```json
{
  "sectionId": "uuid",
  "type": "narrative",
  "title": "Overview",
  "orderIndex": 1,
  "editable": true,
  "content": "..."
}
```

`type`:

- `heading`
- `narrative`
- `list`
- `table`

## 3.3 TableSection

```json
{
  "sectionId": "uuid",
  "type": "table",
  "title": "The Syllabus Of Get Ready For Starters",
  "orderIndex": 5,
  "editable": true,
  "table": {
    "columns": [
      { "key": "periods", "label": "Periods", "width": 120, "sticky": false },
      { "key": "topics", "label": "Topics", "width": 240, "sticky": true },
      { "key": "lessons", "label": "Lessons", "width": 90, "sticky": false },
      { "key": "contents", "label": "Contents", "width": 360, "sticky": false },
      { "key": "structures", "label": "Structures", "width": 260, "sticky": false },
      { "key": "studentsBook", "label": "Students book", "width": 140, "sticky": false },
      { "key": "teachersBook", "label": "Teacher's book", "width": 140, "sticky": false }
    ],
    "rows": [
      {
        "rowId": "uuid",
        "orderIndex": 1,
        "group": {
          "blockLabel": "Starter",
          "topicGroupId": "grp-1",
          "topicRowSpan": 2
        },
        "cells": [
          { "columnKey": "periods", "value": "1-2", "rowSpan": 1, "colSpan": 1, "align": "center", "bold": true },
          { "columnKey": "topics", "value": "Starter: HELLO!", "rowSpan": 2, "colSpan": 1, "align": "left", "bold": true },
          { "columnKey": "lessons", "value": "1", "rowSpan": 1, "colSpan": 1, "align": "center", "bold": false }
        ]
      }
    ]
  }
}
```

## 4) API contract de xuat

## 4.1 Tao syllabus manual

### POST `/api/syllabuses`

Body:

```json
{
  "programId": "uuid",
  "levelId": "uuid",
  "code": "STARTERS_V2",
  "title": "The Syllabus Of Get Ready For Starters",
  "edition": "Second edition",
  "status": "Draft",
  "sourceType": "Manual",
  "minutesPerPeriod": 45
}
```

Response: `SyllabusDocument`

## 4.2 Import preview (chua save)

### POST `/api/syllabuses/import-preview`

Multipart:

- `programId`
- `levelId`
- `file`

Response:

```json
{
  "document": { "...": "SyllabusDocument draft preview" },
  "warnings": [
    {
      "code": "LOW_CONFIDENCE_TOPIC",
      "severity": "Warning",
      "message": "Topic detection uncertain at table 2 row 17",
      "sectionRef": "sec-5",
      "rowRef": "row-17",
      "cellRef": "topics"
    }
  ]
}
```

## 4.3 Import commit (save that)

### POST `/api/syllabuses/import-commit`

Multipart:

- `programId`
- `levelId`
- `code`
- `title`
- `edition`
- `file`
- `asDraft` (default: true)

Response: `SyllabusDocument`

## 4.4 Lay detail document

### GET `/api/syllabuses/{id}/document`

Response: `SyllabusDocument`

## 4.5 Cap nhat metadata

### PATCH `/api/syllabuses/{id}/metadata`

Body:

```json
{
  "expectedVersion": 7,
  "title": "...",
  "edition": "...",
  "minutesPerPeriod": 45
}
```

## 4.6 Them section

### POST `/api/syllabuses/{id}/sections`

Body:

```json
{
  "expectedVersion": 7,
  "section": {
    "type": "narrative",
    "title": "Specific objectives",
    "orderIndex": 3,
    "content": "..."
  }
}
```

## 4.7 Sua section narrative/list/heading

### PATCH `/api/syllabuses/{id}/sections/{sectionId}`

Body:

```json
{
  "expectedVersion": 8,
  "title": "Overview",
  "content": "..."
}
```

## 4.8 Sua cell trong table

### PATCH `/api/syllabuses/{id}/sections/{sectionId}/rows/{rowId}/cells/{columnKey}`

Body:

```json
{
  "expectedVersion": 9,
  "value": "Starter: HELLO!",
  "rowSpan": 2,
  "colSpan": 1,
  "align": "left",
  "bold": true
}
```

## 4.9 Them row vao table

### POST `/api/syllabuses/{id}/sections/{sectionId}/rows`

Body:

```json
{
  "expectedVersion": 9,
  "orderIndex": 22,
  "cells": [
    { "columnKey": "periods", "value": "21-22" },
    { "columnKey": "topics", "value": "Unit 4: FOOD" },
    { "columnKey": "lessons", "value": "3" }
  ]
}
```

## 4.10 Xoa row

### DELETE `/api/syllabuses/{id}/sections/{sectionId}/rows/{rowId}?expectedVersion=10`

## 4.11 Reorder section

### PATCH `/api/syllabuses/{id}/sections/reorder`

Body:

```json
{
  "expectedVersion": 10,
  "orders": [
    { "sectionId": "sec-1", "orderIndex": 1 },
    { "sectionId": "sec-2", "orderIndex": 2 }
  ]
}
```

## 4.12 Publish

### POST `/api/syllabuses/{id}/publish`

Body:

```json
{
  "expectedVersion": 11
}
```

## 4.13 Archive

### POST `/api/syllabuses/{id}/archive`

Body:

```json
{
  "expectedVersion": 12,
  "reason": "Replaced by v3"
}
```

## 5) Validation va business rules

1. `(programId, levelId, code)` la unique trong trang thai active
2. Khong cho edit truc tiep ban `Published` (can clone sang `Draft`)
3. Mọi mutation can `expectedVersion`; lech -> `409 CONFLICT`
4. `rowSpan`, `colSpan` > 0 va khong vo hieu bo cuc bang
5. Truoc khi publish phai co it nhat 1 table curriculum hop le
6. `orderIndex` cua section/row phai unique trong scope

## 6) Warning model cho parser

```json
{
  "code": "MISSING_COLUMN",
  "severity": "Warning",
  "message": "Teachers book column missing in row 15",
  "sectionRef": "sec-5",
  "rowRef": "row-15",
  "cellRef": "teachersBook"
}
```

Codes goi y:

- `LOW_CONFIDENCE_TOPIC`
- `MISSING_COLUMN`
- `MIXED_TABLE_LAYOUT`
- `UNSUPPORTED_MERGED_CELL`
- `UNREADABLE_TEXT`

## 7) Error contract

```json
{
  "code": "Syllabus.VersionConflict",
  "message": "Version conflict. Please reload document.",
  "detail": "Expected version 9, current version 11",
  "status": 409
}
```

Errors nen co:

- `Syllabus.NotFound`
- `Syllabus.VersionConflict`
- `Syllabus.InvalidTableLayout`
- `Syllabus.PublishValidationFailed`
- `Syllabus.ImportParseFailed`
- `Syllabus.DuplicateCode`

## 8) Acceptance criteria

1. Tao manual syllabus -> FE render du bo cuc sections
2. Import file -> sinh section narrative + table theo thu tu tai lieu
3. Table tra ve dung `rowSpan`/`colSpan` de FE render giong Word
4. FE edit narrative/cell/row xong GET lai thay du lieu cap nhat dung
5. Mutation sai version tra `409`
6. Publish lock ban published, chi cho edit draft
7. Warnings parse hien dung section/row/cell

## 9) Ghi chu migration

Neu he thong hien tai dang luu `rawContentJson`/`pacingSchemeJson`:

1. BE co script migrate sang `sections[]`
2. Giu lai raw field de fallback read-only trong giai doan chuyen tiep
3. Sau khi parser on dinh, deprecate raw field trong API detail

## 10) Pham vi FE co the lam ngay sau khi BE xong

1. Builder giao dien cho manual create
2. Renderer document day du theo section order
3. Table editor theo cell/row
4. Sticky topic + block labels dung du lieu BE, bo parsing heuristic tai FE
5. Publish workflow voi conflict handling

## 11) Lesson Plan parity contract (Teacher/Admin)

Muc nay bo sung contract can co de FE render cung 1 lesson-plan document cho cung `sessionId` tren ca Teacher va Admin, dong thoi cho phep Admin xem full syllabus roi drill-down den tung buoi hoc.

### 11.1 Thu tu FE nen dung

Luong uu tien:

1. `GET /api/sessions/{sessionId}/lesson-plan-document`
2. Render `data.document`
3. Dung linkage/runtime fields o root de hien title + status

Luong fallback (legacy):

1. `GET /api/sessions/{sessionId}`
2. Lay `session.lessonPlanTemplateId`
3. `GET /api/lesson-plan-templates/{lessonPlanTemplateId}`

### 11.2 Session detail can co canonical linkage

`GET /api/sessions/{sessionId}` can tra toi thieu:

```json
{
  "session": {
    "id": "uuid",
    "classId": "uuid",
    "moduleId": "uuid",
    "moduleName": "Unit 4",
    "lessonPlanTemplateId": "uuid",
    "plannedLessonPlanTemplateId": "uuid",
    "actualLessonPlanTemplateId": "uuid-or-null",
    "sessionIndexInModule": 3,
    "plannedLessonTitle": "Unit 4 - Lesson 3",
    "actualLessonTitle": "Unit 4 - Lesson 3",
    "teachingLogId": "uuid-or-null",
    "teachingLogStatus": "Submitted",
    "teachingProgressStatus": "Partial",
    "actualTeachingType": "Review"
  }
}
```

Rules:

1. `lessonPlanTemplateId` la canonical template id cho render.
2. `plannedLessonPlanTemplateId` va `actualLessonPlanTemplateId` chi dung cho runtime state.
3. Khong tra `Guid.Empty` nhu 1 linkage hop le.

### 11.3 Dedicated session lesson-plan document

`GET /api/sessions/{sessionId}/lesson-plan-document` can tra:

```json
{
  "sessionId": "uuid",
  "classId": "uuid",
  "moduleId": "uuid",
  "moduleName": "Unit 4",
  "sessionIndexInModule": 3,
  "lessonPlanTemplateId": "uuid",
  "plannedLessonPlanTemplateId": "uuid",
  "actualLessonPlanTemplateId": "uuid-or-null",
  "plannedLessonTitle": "Unit 4 - Lesson 3",
  "actualLessonTitle": "Unit 4 - Lesson 3",
  "teachingLogId": "uuid-or-null",
  "teachingLogStatus": "Submitted",
  "teachingProgressStatus": "Partial",
  "document": {
    "id": "uuid",
    "moduleId": "uuid",
    "moduleCode": "UNIT_4",
    "moduleName": "Unit 4",
    "lessonPlanUnitId": "uuid-or-null",
    "lessonPlanUnitName": "Unit 4",
    "orderIndexInUnit": 3,
    "levelId": "uuid",
    "levelName": "Starters",
    "programId": "uuid",
    "programName": "Kids English",
    "title": "Unit 4 - Lesson 3",
    "sessionIndex": 3,
    "sessionOrder": 3,
    "syllabusMetadata": "...",
    "syllabusContent": "...",
    "objectives": "...",
    "languageContent": "...",
    "vocabulary": "...",
    "grammar": "...",
    "teachingMethodology": "...",
    "teacherMaterials": "...",
    "studentMaterials": "...",
    "procedure": "...",
    "evaluation": "..."
  }
}
```

### 11.4 Class syllabus payload cho overview -> detail mapping

`GET /api/lesson-plans/classes/{classId}/syllabus` nen tra mapping fields de FE highlight dung dong syllabus khi mo chi tiet tung buoi:

```json
{
  "classId": "uuid",
  "classCode": "CLS_STARTERS_02",
  "classTitle": "Starters 02",
  "programId": "uuid",
  "programName": "Kids English",
  "syllabusMetadata": "...",
  "sessions": [
    {
      "sessionId": "uuid",
      "sessionIndex": 12,
      "moduleId": "uuid",
      "sessionIndexInModule": 3,
      "sessionDate": "2026-06-10T18:00:00",
      "rowRef": "session:uuid",
      "unitName": "Unit 4",
      "lessonTitle": "Unit 4 - Lesson 3",
      "lessonPlanId": "uuid-or-null",
      "templateId": "uuid",
      "plannedLessonPlanTemplateId": "uuid",
      "actualLessonPlanTemplateId": "uuid-or-null",
      "templateTitle": "Unit 4 - Lesson 3",
      "plannedLessonTitle": "Unit 4 - Lesson 3",
      "actualLessonTitle": "Unit 4 - Lesson 3",
      "templateSyllabusContent": "...",
      "plannedContent": "...",
      "actualContent": "...",
      "actualHomework": "...",
      "teacherNotes": "...",
      "canEdit": true
    }
  ]
}
```

Rules:

1. `templateId` can dong bo voi logic resolve o session detail.
2. `rowRef`, `unitName`, `lessonTitle` phai on dinh de FE khong can merge local.

### 11.5 Error code va status handling

Khuyen nghi tra business errors (khong tra 404 ha tang neu session ton tai):

1. `Session.LessonPlanTemplateMissing`
2. `Session.LessonPlanTemplateInconsistent`
3. `Session.CurriculumMappingMissing`
4. `Session.LessonPlanDocumentNotFound`

### 11.6 Acceptance criteria parity

1. Admin mo full syllabus thay day du overview + bang curriculum.
2. Admin click tung buoi tu full syllabus mo dung session detail.
3. Teacher va Admin nhin cung document voi cung `sessionId`.
4. Endpoint dedicated tra `200` on dinh tren local/dev/staging khi du lieu hop le.
5. Neu khong resolve duoc mapping/document, BE tra error code nghiep vu ro rang.
