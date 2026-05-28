# BE Handoff - ZIP Import dang gan sai Unit va Lesson

Updated: 2026-05-26
Owner: BE import parser + syllabus read model
Priority: P0

## Problem Summary

Sau khi import archive ZIP lesson plan, du lieu unit/lesson dang bi gan sai ngay tu BE.

Day khong con la loi FE sort/render:
- FE doc danh sach unit tu `GET /api/modules/{moduleId}/units`.
- FE doc cay unit -> lesson tu `GET /api/syllabuses/{id}/unit-lesson-plans`.
- FE proxy `app/api/syllabuses/[id]/unit-lesson-plans/route.ts` chi forward request sang backend, khong bien doi payload.

Ket luan:
- Neu unit name, orderIndex, lessonCount da sai trong API BE thi UI se hien sai tuong ung.
- FE khong the tu sua lai quan he unit <-> lesson neu BE da luu sai `lessonPlanUnitId` hoac tao sai unit.

## Concrete Evidence Da Xac Nhan

### Module Starter01

Module id: `a4850df1-5ce3-4f97-a63c-365d4aea5318`

`GET /api/modules/{moduleId}/units` tra ve:
- `UNIT 4: FOOD` -> `orderIndex = 4`, `lessonCount = 5`
- `UNIT 5: I LOVE CLOTHES` -> `orderIndex = 5`, `lessonCount = 1`

Anh UI cho thay:
- `Unit 5 lesson 2.docx`
- `Unit 5 lesson 3.docx`
lai dang nam trong `UNIT 4: FOOD`.

Ket luan:
- Lesson cua Unit 5 da bi gan vao unit Unit 4 tu luc import/luu DB.

### Module Starter02

Module id: `5f1d6276-9099-431d-8486-091d9ab4a365`

`GET /api/modules/{moduleId}/units` tra ve:
- `UNIT 9: MY HOBBIES` -> `orderIndex = 3`, `lessonCount = 2`
- `UNIT 1: MY HOBBIES` -> `orderIndex = 4`, `lessonCount = 1`
- `UNIT 10: YOUR DAY` -> `orderIndex = 5`, `lessonCount = 3`

`UNIT 1: MY HOBBIES` la unit bat thuong trong module nay.

Ket luan:
- BE da tao hoac map nham mot unit moi ngay trong qua trinh import.
- Day khong phai loi sort ben FE, vi FE dang doc chinh `orderIndex` va `name` do BE tra ve.

### Module Starter03

Module id: `627f926c-f077-4eaf-b214-6f007d32a087`

`GET /api/modules/{moduleId}/units` tra ve:
- `UNIT 11: IN THE STREET` -> `orderIndex = 0`, `lessonCount = 1`
- `UNIT 10: IN THE STREET` -> `orderIndex = 1`, `lessonCount = 2`

Anh UI cho thay:
- `Unit 11 lesson 2.docx`
- `Unit 11 lesson 3.docx`
lai dang nam trong `UNIT 10: IN THE STREET`.

Ket luan:
- Lesson 2 va 3 cua Unit 11 da bi gan sang unit Unit 10 trong DB/read model.

## Dau Hieu Cho Thay Loi Nam O Import Mapping, Khong Nam O UI

1. `GET /api/modules/{moduleId}/units` da sai san:
   - Ten unit sai.
   - `lessonCount` sai.
   - `orderIndex` dang dung cho chinh tap unit sai do.

2. Subtitle tren UI da lech ngay tu du lieu he thong:
   - file goc co the la `Unit 5 lesson 2.docx`
   - nhung `title`/`system title` lai tro thanh `UNIT 4 ...`

3. FE hien tai da uu tien hierarchy tu API nested `unit-lesson-plans`, khong con parse title de tu nhom unit nhu ban cu.

## Cho BE Can Soi Dung

### 1. `POST /api/syllabuses/import-archive`

Can soi phan parser/mapping cho lesson entry trong archive:
- Xac dinh module tu folder/module root nao?
- Xac dinh unit tu folder/file name theo rule nao?
- Xac dinh lesson number theo file name theo rule nao?
- Khi co title parse tu DOCX khac voi folder/file name, he thong uu tien nguon nao?

Can fix:
- Folder/file path trong archive phai la nguon su that de gan module/unit/lesson.
- Title parse tu DOCX chi nen dung de hien thi/noi dung, khong duoc phep ghi de mapping unit neu xung dot voi archive path.
- Neu title parse xung dot voi folder/file name, tra warning/debug metadata hoac `skippedItems`, khong silently map sang unit khac.

### 2. Logic normalize va lookup unit khi upsert

Can soi doan lookup/upsert unit hien co:
- Co dang dung `StartsWith`, `Contains`, prefix match, hoac regex khong co numeric boundary hay khong?
- Co dang so sanh chuoi `UNIT 1` voi `UNIT 10`, `UNIT 11`, `UNIT 12`, `UNIT 15` theo kieu prefix hay khong?

Day la nghi van rat manh vi symptom dang co:
- `UNIT 1` xuat hien nham trong module `UNIT 6..10`
- `UNIT 11` lesson 2,3 bi roi vao `UNIT 10`
- `UNIT 5` lesson 2,3 bi roi vao `UNIT 4`

Can fix:
- Parse so unit thanh so nguyen ro rang (`1`, `10`, `11`, `12`, `15`), khong so sanh prefix text.
- Lookup unit phai match exact `(moduleId, unitNumber)` hoac exact normalized unit key.
- Khong lookup theo title mo hoac theo phan dau cua chuoi.

### 3. Gan `lesson_plan_template -> lesson_plan_unit`

Can soi doan save relationship:
- `lessonPlanTemplate.lessonPlanUnitId`
- `orderIndexInUnit`
- `sessionOrder`

Can fix:
- Moi lesson imported phai duoc gan dung `lessonPlanUnitId` theo folder/file archive.
- `orderIndexInUnit` chi duoc tinh trong pham vi unit dung.
- `sessionOrder` la thu tu cap level/module, nhung khong duoc lam thay doi quan he unit.

### 4. Read model / query APIs

Sau khi fix import, can verify ca 2 API doc du lieu deu dung:
- `GET /api/modules/{moduleId}/units`
- `GET /api/syllabuses/{id}/unit-lesson-plans`

Luu y:
- 2 API nay nen doc quan he DB da dung, khong tu suy luan lai unit tu `title`.
- Neu read model van infer lai tu title/fileName thi co the tiep tuc sai du import da dung.

## SQL / DB Check Goi Y Cho BE

### 1. Kiem tra lesson dang gan vao unit nao

```sql
SELECT
  m.id AS module_id,
  m.name AS module_name,
  u.id AS unit_id,
  u.name AS unit_name,
  u.order_index AS unit_order,
  lpt.id AS lesson_plan_template_id,
  lpt.source_file_name,
  lpt.title,
  lpt.session_index,
  lpt.session_order,
  lpt.order_index_in_unit
FROM lesson_plan_templates lpt
LEFT JOIN lesson_plan_units u
  ON u.id = lpt.lesson_plan_unit_id
LEFT JOIN modules m
  ON m.id = lpt.module_id
WHERE m.id IN (
  'a4850df1-5ce3-4f97-a63c-365d4aea5318',
  '5f1d6276-9099-431d-8486-091d9ab4a365',
  '627f926c-f077-4eaf-b214-6f007d32a087'
)
ORDER BY m.id, u.order_index, lpt.order_index_in_unit, lpt.session_order;
```

Muc tieu:
- Xem `source_file_name` co dang `Unit 11 lesson 2.docx` nhung lai nam duoi `UNIT 10` hay khong.
- Xem `Unit 5 lesson 2/3` co dang nam duoi `UNIT 4` hay khong.

### 2. Kiem tra unit duoc tao bat thuong

```sql
SELECT
  u.id,
  u.module_id,
  m.name AS module_name,
  u.name,
  u.order_index,
  COUNT(lpt.id) AS lesson_count
FROM lesson_plan_units u
LEFT JOIN lesson_plan_templates lpt
  ON lpt.lesson_plan_unit_id = u.id
LEFT JOIN modules m
  ON m.id = u.module_id
WHERE u.module_id IN (
  'a4850df1-5ce3-4f97-a63c-365d4aea5318',
  '5f1d6276-9099-431d-8486-091d9ab4a365',
  '627f926c-f077-4eaf-b214-6f007d32a087'
)
GROUP BY u.id, u.module_id, m.name, u.name, u.order_index
ORDER BY u.module_id, u.order_index;
```

Muc tieu:
- Xac nhan row unit bat thuong `UNIT 1: MY HOBBIES` da ton tai trong module Starter02.

## Reproduction Chuan

1. Import lai archive canonical:
   - `C:\Users\ADMIN\Downloads\LESSON PLAN GET READY STARTER 2ED.zip`
2. Sau import, lay `syllabusId`.
3. Goi:
   - `GET /api/syllabuses/{syllabusId}/unit-lesson-plans`
   - `GET /api/modules/{moduleId}/units` cho 3 module Starter01, Starter02, Starter03.
4. Verify:
   - Starter01 phai la `UNIT STARTER`, `UNIT 1`, `UNIT 2`, `UNIT 3`, `UNIT 4`, `UNIT 5`, `REVISION 1`
   - Starter02 phai la `UNIT 6`, `UNIT 7`, `UNIT 8`, `UNIT 9`, `UNIT 10`, `REVISION 2`
   - Starter03 phai la `UNIT 11`, `UNIT 12`, `UNIT 13`, `UNIT 14`, `UNIT 15`, `REVISION 3`
5. Verify lesson count:
   - `UNIT 11` phai co 3 lesson
   - `UNIT 5` phai co 3 lesson
   - khong duoc ton tai `UNIT 1: MY HOBBIES` trong Starter02

## Acceptance Criteria

1. Import cung 1 archive khong tao ra unit sai ten trong module.
2. `GET /api/modules/{moduleId}/units` tra ve dung ten unit, dung orderIndex, dung lessonCount.
3. `GET /api/syllabuses/{id}/unit-lesson-plans` group dung lesson vao dung unit.
4. Neu title parse trong DOCX xung dot voi folder/file archive, BE khong duoc silently map sai.
5. Re-import sau fix thi UI FE hien dung ma khong can them heuristic/fallback moi.

## Note Cho FE / QA

- FE da duoc chot theo huong doc hierarchy tu API va orderIndex tu BE.
- Neu 2 API ben tren da dung thi UI se dung theo.
- Sau khi BE fix, can re-import bo syllabus dang loi hoac chay migration relink `lessonPlanUnitId` cho du lieu da nhap sai.