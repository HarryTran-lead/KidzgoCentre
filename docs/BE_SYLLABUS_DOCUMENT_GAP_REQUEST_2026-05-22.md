# BE Request - Bo sung du lieu cho Syllabus Document Parser

> Date: 2026-05-22
> FE area: Syllabus detail modal + document editor/read model
> Related endpoint: `GET /api/syllabuses/{id}/document`, import preview/commit flow

## 1) Muc tieu

FE da render duoc khung chinh (heading + narrative + table), nhung de hien thi day du nhu file Word thuc te thi can BE bo sung/tach du lieu ro hon trong `sections[]`.

Muc tieu la FE co the render day du noi dung ma KHONG can fallback ve "Raw content".

## 2) Thuc trang gap

1. Mot so noi dung narrative dang bi don vao 1 block dai (vi du: Overview + Course objectives + Specific objectives + Ethics + Book info).
2. Bang curriculum lon co truong hop chua day du toan bo rows/cells theo tai lieu nguon.
3. Cac bang phu (vi du "Text books and references", "Other activities") chua on dinh trong model section.
4. FE phai dung heuristic de tach noi dung (de gay sai lech tieu de/muc khi format Word thay doi nhe).

## 3) Yeu cau BE bo sung

### 3.0. Chuan hoa contract import theo cau truc folder

FE can BE hieu dung cau truc archive import nhu sau:

- Folder lon `PPCT ...` chi chua 1 file syllabus goc `.docx`
- Moi folder `UNIT ...` chua cac file lesson plan cua unit do
- Folder `REVISION` chua cac file revision

Y nghia nghiep vu:

- 1 file syllabus goc = tai lieu tong cua ca chuong trinh / level
- 1 folder `UNIT X` = 1 module / unit
- Moi file lesson trong folder `UNIT X` = 1 lesson plan template cua unit do
- Moi file `Revision 01`, `Revision 02`, ... trong folder `REVISION` = 1 lesson plan template revision, thuong nam o cuoi 1 module hoac cau noi giua module truoc va module tiep theo

De nghi BE khong coi `REVISION` la 1 unit binh thuong neu nghiep vu dang map revision theo quy tac rieng.

### 3.0.1. Mapping backend de nghi

Khi import archive, de nghi BE map theo thu tu sau:

1. Tim file syllabus duy nhat trong folder `PPCT ...` va parse thanh `SyllabusDocument`
2. Tim cac folder `UNIT ...` va map moi folder vao 1 module / unit
3. Tim cac file lesson trong tung folder `UNIT ...` va map thanh danh sach lesson plan templates cua module do
4. Tim folder `REVISION` va map moi file revision thanh 1 lesson plan template revision
5. Ap dung `Import Configuration` de quyet dinh revision thuoc module nao, co starter hay khong, va so lesson plan ky vong cho tung module

### 3.0.2. Import result FE can nhin thay

Sau import archive, FE can co du lieu de hien thi ro rang cho admin:

- `syllabusFileName`
- `unitFolders[]`
- `revisionFiles[]`
- `importedEntries[]` kem thong tin module, lesson, revision
- `skippedEntries[]`
- `warnings[]`

De nghi moi imported entry co them metadata giai thich no den tu dau:

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

Neu la revision, de nghi response co them:

- `revisionNumber`
- `mappedModuleId`
- `mappedModuleName`

### 3.1. Chuan hoa section narrative

De nghi BE tra ve moi nhom noi dung thanh section rieng trong `sections[]`:

- `Overview`
- `Overall objectives`
- `Specific objectives`
- `Ethics and attitudes`
- `Book overview / Text books and references`
- `Other activities in class` (neu co)

Yeu cau:

- Moi section co `type` phu hop (`narrative`/`list`/`table`).
- `orderIndex` chinh xac theo thu tu tai lieu.
- Khong don nhieu heading logic vao 1 `content` dai neu BE co the xac dinh duoc heading con.

### 3.2. Day du table model cho curriculum

Voi section `type: table` (Curriculum), de nghi BE dam bao:

- Tra day du tat ca `columns[]`.
- Tra day du tat ca `rows[]` theo thu tu (`orderIndex`).
- Moi row co `cells[]` du cot theo `columnKey`.
- `rowSpan`/`colSpan` dung gia tri parser tim duoc (FE khong tu tinh).
- Neu 1 o trong bi thieu du lieu parser => tra chuoi rong `""` thay vi bo mat cell de FE giu dung layout.

### 3.3. Support nhieu bang trong 1 tai lieu

Tai lieu Word co the co nhieu bang khac nhau (khong chi Curriculum).

De nghi BE:

- Tao section `type: table` rieng cho tung bang co y nghia nghiep vu.
- Dat `title` ro rang cho tung bang.
- Khong gop bang khac cau truc vao chung mot section table.

### 3.4. Metadata/fallback can co

De FE khong phai doan:

- `edition` nen co o top-level document (neu parser xac dinh duoc).
- Neu parser khong tách duoc 100%, BE van tra `warnings[]` co `code`, `message`, `sectionRef`, `rowRef`, `cellRef` de FE hien canh bao.

Ngoai ra, voi archive import, de nghi tra them metadata hierarchy de FE render duoc view dang cay:

- `syllabusFileName`
- `sourceFolderName`
- `unitFolderName`
- `sourceType`
- `revisionNumber`
- `sessionOrder`

## 4) Contract de nghi (toi thieu)

```json
{
  "id": "uuid",
  "code": "STARTERS_V2",
  "title": "THE SYLLABUS OF GET READY FOR STARTERS",
  "edition": "Second edition",
  "summary": {
    "totalUnits": 15,
    "totalSessions": 50,
    "totalLessons": 50,
    "totalPeriods": 100,
    "minutesPerPeriod": 45
  },
  "sections": [
    {
      "sectionId": "uuid",
      "type": "narrative",
      "title": "Overview",
      "orderIndex": 2,
      "editable": true,
      "content": "..."
    },
    {
      "sectionId": "uuid",
      "type": "table",
      "title": "Curriculum",
      "orderIndex": 3,
      "editable": true,
      "table": {
        "columns": [
          { "key": "periods", "label": "Periods" },
          { "key": "topics", "label": "Topics" },
          { "key": "lessons", "label": "Lessons" }
        ],
        "rows": [
          {
            "rowId": "uuid",
            "orderIndex": 1,
            "cells": [
              { "columnKey": "periods", "value": "1-2", "rowSpan": 1, "colSpan": 1 },
              { "columnKey": "topics", "value": "Starter: HELLO!", "rowSpan": 2, "colSpan": 1 },
              { "columnKey": "lessons", "value": "1", "rowSpan": 1, "colSpan": 1 }
            ]
          }
        ]
      }
    }
  ],
  "warnings": []
}
```

## 5) Acceptance criteria (de BE/FE doi chieu)

1. FE mo chi tiet syllabus KHONG can fallback Raw content de doc noi dung chinh.
2. Cac section narrative chinh hien dung, tach dung heading.
3. Bang Curriculum hien du dong/cot so voi tai lieu parser.
4. Cac bang phu (neu co) hien thanh section table rieng.
5. Khi parser thieu/khong chac chan, `warnings[]` co du reference de FE canh bao.
6. Sau import archive, admin co the biet ro:
  - file nao la syllabus tong
  - file nao thuoc `UNIT X`
  - file nao thuoc `REVISION`
  - moi file da map vao module/lesson nao
  - file nao bi skip va ly do
7. Teacher view co the lay dung lesson plan / syllabus slice cua tung buoi thay vi phai doc toan bo syllabus.

## 6) Uu tien trien khai

1. Uu tien 1: Curriculum table day du rows/cells.
2. Uu tien 2: Tra ro hierarchy archive import (`syllabus` / `unit` / `revision` / `lesson`).
3. Uu tien 3: Tach narrative sections theo heading logic.
4. Uu tien 4: Bang phu + warning metadata chi tiet.

---

Neu BE can, FE co the gui them danh sach file Word mau dang gay miss parse de benchmark parser.
