# BE Design: Unit Hierarchy — Program → Level → Module → Unit → Lesson

> Ngày tạo: 2026-05-20  
> Mục tiêu: Biến Unit từ "parse chuỗi title giả" thành entity thật trong DB, hỗ trợ CRUD + drag-drop reorder.

---

## Vấn đề hiện tại

FE đang **parse chuỗi title** của `lesson_plan_templates` để tạo unit group:

```
"UNIT 03: FAMILY AND FRIENDS - Lesson 1"  →  group "UNIT 03: FAMILY AND FRIENDS"
"UNIT 3: FAMILY AND FRIENDS - Lesson 2"   →  group "UNIT 3: FAMILY AND FRIENDS"  ← DUPLICATE
```

Vì không có `unit_id` trong DB, không có canonical name, không có order → **không thể CRUD, không thể reorder**.

---

## PHẦN 1: DATABASE MIGRATION

### Migration 001 — Tạo bảng `units`

```sql
CREATE TABLE units (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id        UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  name             VARCHAR(255) NOT NULL,
  name_normalized  VARCHAR(255) NOT NULL,  -- uppercase, strip leading zeros
  order_index      INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMP DEFAULT NOW(),
  updated_at       TIMESTAMP DEFAULT NOW(),

  CONSTRAINT uq_unit_module_name UNIQUE (module_id, name_normalized)
);

CREATE INDEX idx_units_module_id ON units(module_id);
CREATE INDEX idx_units_order ON units(module_id, order_index);
```

### Migration 002 — Sửa bảng `lesson_plan_templates`

```sql
ALTER TABLE lesson_plan_templates
  ADD COLUMN unit_id               UUID REFERENCES units(id) ON DELETE SET NULL,
  ADD COLUMN order_index_in_unit   INT NOT NULL DEFAULT 0;

CREATE INDEX idx_lpt_unit_id ON lesson_plan_templates(unit_id);
```

### Cascade rules

| Xóa entity | Hành động |
|------------|-----------|
| Module bị xóa | Cascade xóa Units → SET NULL `unit_id` trên LessonPlanTemplates |
| Unit bị xóa | SET NULL `unit_id` trên LessonPlanTemplates (orphan, không xóa lesson) |

---

## PHẦN 2: NORMALIZE UTILITY

Dùng ở **mọi nơi**: import, CRUD, backfill — để đảm bảo so sánh nhất quán.

```typescript
// utils/normalizeUnitName.ts

export function normalizeUnitName(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\b(\d+)\b/g, (_, n) => String(parseInt(n, 10)))  // "03" → "3"
    .replace(/\s+/g, " ");
}

export function extractUnitNameFromTitle(title: string): string | null {
  // "UNIT 1: I LOVE ANIMALS! - Lesson 3"  → "UNIT 1: I LOVE ANIMALS!"
  // "UNIT STARTER: HELLO! - Lesson 1"     → "UNIT STARTER: HELLO!"
  // "REVISION 01 - Lesson 2"              → "REVISION 1"
  const match = title.match(/^(.+?)\s*[-–]\s*Lesson\s+\d+/i);
  if (!match) return null;
  return normalizeUnitName(match[1]);
}
```

---

## PHẦN 3: IMPORT LOGIC (sửa service hiện tại)

Thêm bước **find-or-create unit** trong transaction import:

```typescript
// services/importSyllabusService.ts

async function findOrCreateUnit(
  moduleId: string,
  rawUnitName: string,
  tx: Transaction,
): Promise<string> {
  const normalized = normalizeUnitName(rawUnitName);

  const existing = await tx.query(
    `SELECT id FROM units WHERE module_id = $1 AND name_normalized = $2`,
    [moduleId, normalized],
  );
  if (existing.rows[0]) return existing.rows[0].id;

  const maxOrder = await tx.query(
    `SELECT COALESCE(MAX(order_index), -1) AS max FROM units WHERE module_id = $1`,
    [moduleId],
  );

  const newUnit = await tx.query(
    `INSERT INTO units (module_id, name, name_normalized, order_index)
     VALUES ($1, $2, $3, $4) RETURNING id`,
    [moduleId, rawUnitName.trim().toUpperCase(), normalized, maxOrder.rows[0].max + 1],
  );

  return newUnit.rows[0].id;
}

async function processTemplateRow(row: ParsedRow, moduleId: string, tx: Transaction) {
  const rawUnitName = extractUnitNameFromTitle(row.title);
  let unitId: string | null = null;
  let orderInUnit = 0;

  if (rawUnitName) {
    unitId = await findOrCreateUnit(moduleId, rawUnitName, tx);

    const countResult = await tx.query(
      `SELECT COUNT(*) AS cnt FROM lesson_plan_templates WHERE unit_id = $1`,
      [unitId],
    );
    orderInUnit = parseInt(countResult.rows[0].cnt, 10);
  }

  await tx.query(
    `INSERT INTO lesson_plan_templates (..., unit_id, order_index_in_unit)
     VALUES (..., $n, $n1)
     ON CONFLICT (syllabus_id, session_index) DO UPDATE SET
       unit_id             = EXCLUDED.unit_id,
       order_index_in_unit = EXCLUDED.order_index_in_unit`,
    [..., unitId, orderInUnit],
  );
}
```

---

## PHẦN 4: BACKFILL SCRIPT (chạy 1 lần cho data cũ)

```typescript
// scripts/backfillUnits.ts
// Chạy: ts-node scripts/backfillUnits.ts

const templates = await db.query(`
  SELECT lpt.id, lpt.title, lpt.module_id, lpt.session_index
  FROM lesson_plan_templates lpt
  WHERE lpt.unit_id IS NULL
  ORDER BY lpt.module_id, lpt.session_index
`);

for (const t of templates.rows) {
  if (!t.module_id) continue;
  const rawUnitName = extractUnitNameFromTitle(t.title);
  if (!rawUnitName) continue;
  const unitId = await findOrCreateUnit(t.module_id, rawUnitName, db);
  await db.query(
    `UPDATE lesson_plan_templates SET unit_id = $1 WHERE id = $2`,
    [unitId, t.id],
  );
}

// Set order_index_in_unit theo session_index trong từng unit
await db.query(`
  UPDATE lesson_plan_templates lpt
  SET order_index_in_unit = sub.rn - 1
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY unit_id ORDER BY session_index) AS rn
    FROM lesson_plan_templates
    WHERE unit_id IS NOT NULL
  ) sub
  WHERE lpt.id = sub.id
`);
```

---

## PHẦN 5: API ENDPOINTS

### 5.1 Unit CRUD

| Method | Path | Mô tả |
|--------|------|-------|
| GET | `/api/modules/:moduleId/units` | Danh sách units trong module |
| POST | `/api/modules/:moduleId/units` | Tạo unit thủ công |
| PATCH | `/api/units/:unitId` | Sửa tên unit |
| DELETE | `/api/units/:unitId` | Xóa unit (nếu rỗng) |
| PATCH | `/api/modules/:moduleId/units/reorder` | Bulk reorder (drag-drop) |

**GET /modules/:moduleId/units**
```json
[
  { "id": "uuid", "name": "UNIT 1: I LOVE ANIMALS!", "orderIndex": 0, "lessonCount": 4 },
  { "id": "uuid", "name": "UNIT 2: AT HOME",          "orderIndex": 1, "lessonCount": 3 }
]
```

**POST /modules/:moduleId/units**
```json
// Request
{ "name": "UNIT 6: NEW UNIT" }

// Response 201
{ "id": "uuid", "name": "UNIT 6: NEW UNIT", "orderIndex": 5 }

// Error 409 (tên trùng sau normalize)
{ "error": "Unit với tên này đã tồn tại trong module" }
```

**DELETE /units/:unitId**
```json
// Còn lesson → 409
{ "error": "Unit còn 4 lesson plan, hãy chuyển chúng sang unit khác trước khi xóa", "lessonCount": 4 }

// Rỗng → 204 No Content
```

**PATCH /modules/:moduleId/units/reorder** — dùng cho drag-drop
```json
// Request
[
  { "id": "uuid-1", "orderIndex": 0 },
  { "id": "uuid-2", "orderIndex": 1 },
  { "id": "uuid-3", "orderIndex": 2 }
]

// Response 204 No Content
// BE wrap trong transaction, UPDATE tất cả một lần
```

---

### 5.2 Lesson trong Unit

| Method | Path | Mô tả |
|--------|------|-------|
| PATCH | `/api/lesson-plan-templates/:id` | Move lesson sang unit khác |
| PATCH | `/api/units/:unitId/lessons/reorder` | Reorder lessons trong unit |

**PATCH /lesson-plan-templates/:id** — move lesson
```json
// Request
{
  "unitId": "uuid-target-unit",   // null = bỏ khỏi unit (orphan)
  "orderIndexInUnit": 2
}
```

**PATCH /units/:unitId/lessons/reorder** — drag-drop lessons
```json
// Request
[
  { "id": "template-uuid-1", "orderIndexInUnit": 0 },
  { "id": "template-uuid-2", "orderIndexInUnit": 1 },
  { "id": "template-uuid-3", "orderIndexInUnit": 2 }
]

// Response 204
```

---

### 5.3 Cập nhật `GET /syllabuses/:id/unit-lesson-plans`

Response shape mới (nested hoàn chỉnh):

```json
{
  "totalTemplates": 50,
  "groups": [
    {
      "moduleId": "uuid",
      "moduleName": "Stater01",
      "moduleCode": "STARTERS_STATER01",
      "orderIndex": 0,
      "units": [
        {
          "unitId": "uuid",
          "unitName": "UNIT STARTER: HELLO!",
          "orderIndex": 0,
          "lessons": [
            {
              "id": "uuid",
              "title": "UNIT STARTER: HELLO! - Lesson 1",
              "sessionIndex": 1,
              "orderIndexInUnit": 0,
              "status": "active",
              "attachment": "https://...",
              "sourceFileName": "unit_starter_hello_lesson_1.docx"
            }
          ]
        }
      ]
    }
  ]
}
```

SQL query:
```sql
SELECT
  m.id              AS module_id,
  m.name            AS module_name,
  m.code            AS module_code,
  m.order_index     AS module_order,
  u.id              AS unit_id,
  u.name            AS unit_name,
  u.order_index     AS unit_order,
  lpt.id,
  lpt.title,
  lpt.session_index,
  lpt.order_index_in_unit,
  lpt.is_active,
  lpt.attachment,
  lpt.source_file_name
FROM modules m
LEFT JOIN units u
  ON u.module_id = m.id
LEFT JOIN lesson_plan_templates lpt
  ON lpt.unit_id = u.id
WHERE m.syllabus_id = $1
ORDER BY m.order_index, u.order_index, lpt.order_index_in_unit
```

---

## PHẦN 6: VALIDATION RULES

| Rule | Chi tiết |
|------|---------|
| Unit name unique trong module | So sánh bằng `name_normalized` (case-insensitive + strip zeros) |
| Reorder chỉ trong cùng module | Không cho move unit sang module khác qua reorder endpoint |
| Xóa unit còn lesson → 409 | FE phải move lesson trước |
| Import duplicate session_index | `ON CONFLICT DO UPDATE` — cập nhật, không insert thêm |
| orderIndex không âm | `CHECK (order_index >= 0)` trong DDL |
| Move lesson sang unit khác | Phải recalculate `order_index_in_unit` ở unit đích = `MAX + 1` |

---

## PHẦN 7: THỨ TỰ TRIỂN KHAI

```
1.  Migration 001 — tạo bảng units
2.  Migration 002 — thêm cột unit_id, order_index_in_unit vào lesson_plan_templates
3.  Viết normalizeUnitName + extractUnitNameFromTitle utility
4.  Chạy backfill script (fix data cũ)
5.  Sửa import service (findOrCreateUnit trong transaction)
6.  GET /modules/:moduleId/units
7.  POST /modules/:moduleId/units
8.  PATCH /units/:unitId
9.  DELETE /units/:unitId
10. PATCH /modules/:moduleId/units/reorder
11. PATCH /lesson-plan-templates/:id (move + reorder)
12. PATCH /units/:unitId/lessons/reorder
13. Cập nhật GET /syllabuses/:id/unit-lesson-plans → response shape mới
```

---

## PHẦN 8: FE CẦN SỬA SAU KHI BE XONG

- `LessonPlanTemplate` type: thêm `unitId?: string`, `unitName?: string`, `orderIndexInUnit?: number`
- `TemplateTable` accordion: bỏ `extractUnitGroup()` (parse chuỗi giả), dùng `unitId` + `unitName` từ API
- `GET /syllabuses/:id/unit-lesson-plans`: dùng response shape mới để render hierarchy
- Thêm drag-drop với `@dnd-kit` hoặc tương tự cho unit reorder và lesson reorder
