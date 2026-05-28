# BE Request - Teacher Attendance mo full syllabus nhu admin

> Date: 2026-05-27
> FE area: Teacher attendance modal `Syllabus`
> Admin reference: modal detail syllabus dang dung `GET /api/syllabuses/{id}` + `GET /api/syllabuses/{id}/document`

## 1) Van de hien tai

Teacher da dung chung renderer voi admin, nhung co buoi khong mo duoc full syllabus vi FE khong resolve duoc `syllabusId`.

Noi cach khac:

- Admin mo duoc vi da biet truoc `syllabusId`
- Teacher dang di tu `sessionId` / `classId`
- Neu BE khong tra `syllabusId` tren flow session/class, FE khong biet goi:
  - `GET /api/syllabuses/{id}`
  - `GET /api/syllabuses/{id}/document`

## 2) API teacher dang di qua

### 2.1. Class syllabus cua lop

Endpoint hien FE dang goi:

- `GET /api/lesson-plans/classes/{classId}/syllabus`

Muc dich:

- Lay danh sach session cua lop
- Tim session hien tai trong class syllabus
- Resolve `syllabusId` de mo full syllabus

### 2.2. Lesson-plan-document cua session

Endpoint hien FE dang goi:

- `GET /api/sessions/{sessionId}/lesson-plan-document`

Muc dich:

- Lay document/template cua buoi hoc
- Neu template co `syllabusId` thi FE co the dung ngay

## 3) Yeu cau BE toi thieu

### 3.1. Bat buoc: tra `syllabusId`

BE can bo sung `syllabusId` o it nhat 1 trong 2 flow sau:

1. `GET /api/lesson-plans/classes/{classId}/syllabus`
2. `GET /api/sessions/{sessionId}/lesson-plan-document`

Neu chi chon 1 noi de fix nhanh, uu tien fix **endpoint class syllabus** truoc.

### 3.2. Bat buoc: mo quyen doc full syllabus cho Teacher

Sau khi FE resolve duoc `syllabusId`, teacher se goi y chang admin qua Next API proxy:

- `GET /api/syllabuses/{id}`
- `GET /api/syllabuses/{id}/document`

Hien tai neu backend van tra `403 Forbidden` cho token Teacher thi FE khong the mo full syllabus nhu admin du da co `syllabusId`.

Noi dung BE can dam bao:

- Teacher duoc phep doc syllabus detail/doc khi buoi hoc hoac lop do hop le voi teacher dang dang nhap.
- Neu backend check scope theo class/session/branch thi can map tu `syllabusId` ve dung lop/buoi ma teacher duoc phan cong.
- Khong chi tra `syllabusId`; can mo ca permission cho 2 endpoint detail/doc noi tren.

## 4) Contract de nghi

### 4.1. Uu tien 1: class syllabus endpoint tra root + session

Endpoint:

- `GET /api/lesson-plans/classes/{classId}/syllabus`

De nghi response co:

```json
{
  "classId": "class-uuid",
  "programId": "program-uuid",
  "programName": "Kids English",
  "levelId": "level-uuid",
  "levelName": "Starters",
  "syllabusId": "syllabus-uuid",
  "syllabusCode": "STARTERS_FULL",
  "syllabusVersion": "1",
  "syllabusTitle": "The Syllabus of Get Ready for Starters full",
  "sessions": [
    {
      "sessionId": "session-uuid",
      "sessionIndex": 3,
      "sessionIndexInModule": 3,
      "templateId": "template-uuid",
      "syllabusId": "syllabus-uuid",
      "syllabusCode": "STARTERS_FULL",
      "syllabusVersion": "1",
      "syllabusTitle": "The Syllabus of Get Ready for Starters full"
    }
  ]
}
```

Y nghia:

- `syllabusId` o root: dung cho toan bo lop neu lop chi gan 1 syllabus
- `syllabusId` o tung `sessions[]`: de FE khong phai doan, va an toan hon neu sau nay co case dac biet

### 4.2. Uu tien 2: lesson-plan-document endpoint tra `document.syllabusId`

Endpoint:

- `GET /api/sessions/{sessionId}/lesson-plan-document`

De nghi response co:

```json
{
  "sessionId": "session-uuid",
  "classId": "class-uuid",
  "document": {
    "id": "template-uuid",
    "title": "UNIT 1: I LOVE ANIMALS! - Lesson 3",
    "syllabusId": "syllabus-uuid",
    "syllabusCode": "STARTERS_FULL",
    "syllabusVersion": "1",
    "syllabusTitle": "The Syllabus of Get Ready for Starters full"
  }
}
```

Endpoint nay la fallback tot, nhung van nen co `syllabusId` o class syllabus endpoint.

## 5) Blocking vs nice-to-have

### Blocking

Bat buoc de teacher mo full syllabus nhu admin:

- `syllabusId`
- quyen `GET /api/syllabuses/{id}`
- quyen `GET /api/syllabuses/{id}/document`

### Nice-to-have

Nen tra them de FE hien title/debug ro hon, nhung khong bat buoc de mo modal:

- `syllabusCode`
- `syllabusVersion`
- `syllabusTitle`
- `programId`
- `levelId`

## 6) FE dang can gi sau khi co `syllabusId`

Khi resolve duoc `syllabusId`, FE se goi y chang admin:

1. `GET /api/syllabuses/{syllabusId}`
2. `GET /api/syllabuses/{syllabusId}/document`

Sau do merge 2 payload va render full modal syllabus.

## 7) Acceptance criteria cho BE

1. Tu `sessionId` cua teacher, FE resolve duoc `syllabusId` ma khong phai search heuristics.
2. Teacher bam `Syllabus` o attendance mo ra full modal nhu admin.
3. Teacher token goi `GET /api/syllabuses/{id}` khong bi `403 Forbidden`.
4. Teacher token goi `GET /api/syllabuses/{id}/document` khong bi `403 Forbidden`.
5. Khong con thong bao:
   - `Buổi này chưa resolve được syllabusId để mở full syllabus như admin.`
6. Cung mot lop, tat ca session deu co du thong tin de tim dung full syllabus.

## 8) Ket luan ngan gon cho BE

Neu can fix nhanh nhat:

- Bo sung `syllabusId` vao response `GET /api/lesson-plans/classes/{classId}/syllabus`
- Tot nhat tra o ca root va tung `sessions[]`
- Neu co san o template/session document, tra them `document.syllabusId` o `GET /api/sessions/{sessionId}/lesson-plan-document`

Day la field khoa de teacher goi lai dung 2 API syllabus detail/doc ma admin dang dung.