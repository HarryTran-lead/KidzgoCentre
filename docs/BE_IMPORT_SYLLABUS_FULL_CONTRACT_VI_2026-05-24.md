# [BE] Contract Tra Du Lieu Full Syllabus Sau Import DOCX

Updated: 2026-05-24
Priority: P0
Scope: Import DOCX syllabus cho trang Admin

## 1) Van de hien tai

File import co day du noi dung (overview + nhieu bang curriculum nhieu trang), nhung API sau import chi tra mot phan:

- /api/syllabuses/{id}/document: summary chi con 2 units, 2 lessons, 6 periods
- /api/syllabuses/{id}: lessons/sessionTemplates chi con 2 items
- Trong khi list lai co unitCount lon hon (khong nhat quan)

Ket luan: Parser/normalizer BE dang cat du lieu, FE khong the hien thi du lieu khong duoc tra ve.

## 2) BE can tra gi sau import de FE hien thi full

### 2.1 Import commit response

Sau khi import thanh cong, response nen co:

- isSuccess: true
- data.document: object day du sau parse (khong phai summary rut gon)

### 2.2 Document payload bat buoc

Document can co toi thieu:

- id, programId, levelId, code, title, edition, status, sourceType, sourceFileName, parserVersion, version
- summary: totalUnits, totalSessions, totalLessons, totalPeriods, minutesPerPeriod
- sections[] theo dung thu tu xuat hien trong file
- warnings[] (neu co)

### 2.3 Section payload bat buoc

Moi section:

- sectionId
- type: heading | narrative | list | table
- title
- orderIndex
- content (heading/narrative)
- items (list)
- table (table)

Khong duoc bo section o cac trang sau.

### 2.4 Table payload bat buoc

Table can co:

- columns[]: key, label, width, sticky
- rows[]: rowId, orderIndex, group, cells[]
- cells[]: columnKey, value, rowSpan, colSpan, align, bold

Yeu cau quan trong:

- Tra du toan bo rows cua bang curriculum (khong cat o chunk dau/trang dau)
- Bao toan merged cells (rowSpan/colSpan)
- Khong mat du lieu cua cac cot: Periods, Topics, Lessons, Contents, Structures, Students book, Teachers book

## 3) Tinh nhat quan giua cac endpoint

Cung 1 syllabus id, cac endpoint phai khop:

- GET /api/syllabuses (unitCount, sessionTemplateCount)
- GET /api/syllabuses/{id} (lessons, sessionTemplates, resources, rawContentJson)
- GET /api/syllabuses/{id}/document (summary + sections.table.rows)

Khong duoc co truong hop importedLessonPlanTemplateCount cao nhung lessons/sessionTemplates/document rows lai thap bat thuong.

## 4) Acceptance criteria

1. Import xong file The Syllabus of Get Ready for Starters full (1).docx thi mo detail thay day du cac phan:
- Overview + objectives
- Bang tong period
- Bang resources
- Bang curriculum day du tu Starter den cac Unit/Revision cuoi

2. summary phan anh dung toan bo bang, khong chi 6 periods/2 lessons.

3. lessons/sessionTemplates/document rows khop voi nhau va khop list counters.

4. Reload trang, dong/mo modal, du lieu van du, khong bi rut gon.

## 5) Goi y ky thuat BE

- Kiem tra parser DOCX table co bi dung o page-break/section-break khong.
- Kiem tra logic map bang nhieu trang co bi overwrite batch cu boi batch moi khong.
- Kiem tra transaction save sections/rows co bi cat do gioi han kich thuoc field khong.
- rawContentJson luu full object parse, khong truncate.

## 6) Dinh huong FE

FE da co fallback parser va nut xem table full.
Neu BE tra du payload theo contract tren, FE se render du full syllabus dung nhu file goc.
