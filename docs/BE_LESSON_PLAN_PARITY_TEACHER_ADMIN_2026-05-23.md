# BE Handoff - Lesson Plan Parity (Teacher vs Admin)

Updated: 2026-05-23
Owner: FE handoff to BE
Scope: Ensure Teacher lesson-plan view renders the same structured document as Admin for the same session.

---

## 1) Problem Summary

For the same teaching session, Admin can render a full structured Lesson Plan document, but Teacher often receives incomplete linkage data and falls back to plain text content.

Current impact:
- Admin UI shows full lesson-plan document (A/B/C... sections, structured layout).
- Teacher UI often only has plannedContent/templateSyllabusContent text fallback.
- This creates a visible mismatch and user confusion.

---

## 2) Target Outcome

For any given sessionId:
- Admin and Teacher must resolve to the same lesson plan template/document source.
- Teacher must receive enough data to render the same structured document component as Admin.
- Fallback text is only a last resort for legacy/invalid data.

---

## 3) Required Data Contract (Minimum)

Please guarantee these fields are present and consistent on Teacher session payloads (list and detail):

### Session linkage fields
- lessonPlanTemplateId
- plannedLessonPlanTemplateId
- actualLessonPlanTemplateId
- moduleId
- moduleName
- sessionIndexInModule
- plannedLessonTitle
- actualLessonTitle

Rules:
1. At least one of lessonPlanTemplateId/plannedLessonPlanTemplateId/actualLessonPlanTemplateId must be populated when a session is curriculum-linked.
2. If more than one exists, values must be internally consistent with curriculum runtime.
3. Do not return zero-guid as a valid linkage value.

### Optional but strongly recommended
- templateId on class syllabus session mapping for direct lookup
- teachingLogId, teachingLogStatus, teachingProgressStatus

---

## 4) Endpoint Consistency Requirements

The following endpoints must be consistent for the same sessionId:

- Teacher session list endpoint (used in attendance page)
- Teacher session detail endpoint
- Any class syllabus runtime endpoint used to map session -> template
- Admin session detail endpoint

Consistency rule:
- For same sessionId, resolved template ID must be identical across Admin and Teacher flows.

---

## 5) Document Source Requirement

Teacher needs the same renderable document source as Admin.

Accepted approaches:
1. Keep current template flow but guarantee valid template ID resolution for Teacher.
2. Expose a dedicated endpoint to return resolved lesson-plan document for session:
   - GET /api/sessions/{sessionId}/lesson-plan-document
   - returns structured document model ready for FE render.

If option (2) is used, FE can remove most fallback parsing logic.

---

## 6) Error Handling Contract

When linkage is missing/invalid, return explicit error codes instead of silent nulls.

Suggested codes:
- Session.LessonPlanTemplateMissing
- Session.LessonPlanTemplateInconsistent
- Session.CurriculumMappingMissing
- Session.LessonPlanDocumentNotFound

Each should include a clear message and relevant IDs (sessionId/classId/moduleId/templateId when available).

---

## 7) Acceptance Criteria (Must Pass)

For at least 20 sampled sessions across branches/programs:

1. Admin and Teacher resolve same template ID.
2. Teacher renders structured lesson-plan document (not plain text fallback) for all valid curriculum-linked sessions.
3. Teacher fallback path triggered only for truly legacy/unmapped sessions.
4. No zero-guid template IDs in successful responses.
5. Session detail and session list are consistent for lesson-plan linkage fields.

---

## 8) Quick Verification Matrix

For each sampled sessionId, verify:

- adminSessionDetail.templateId
- teacherSessionDetail.lessonPlanTemplateId (or planned/actual)
- classSyllabusMapping.templateId
- resolvedTemplateId (server-side)
- template fetch result (200 + document exists)

Expected:
- All IDs align to one final template.

---

## 9) FE Notes (Current State)

FE currently:
- Prioritizes template IDs from Teacher session detail first, then other runtime sources.
- Renders structured component when template is available.
- Falls back to parsed plain-text blocks only when structured template cannot be resolved.

To achieve parity, BE contract consistency is the key missing piece.

---

## 10) Implementation Priority for BE

P0:
- Ensure Teacher session detail always returns valid template linkage for curriculum-linked sessions.
- Align template resolution result between Admin and Teacher.

P1:
- Normalize list/detail payload parity for lesson-plan fields.

P2:
- Provide dedicated session lesson-plan-document endpoint to simplify FE and reduce fallback usage.

---

## 11) Proposed BE Deliverables

1. Contract update (swagger/doc) for Teacher session list/detail fields.
2. Logic fix for template linkage resolution in Teacher flow.
3. Consistency tests (Admin vs Teacher template resolution).
4. Optional dedicated document endpoint.
5. Release note with migration notes for legacy sessions.

---

## 12) Concrete Payload Evidence (2026-05-27)

Sample session under investigation:

- `sessionId = 8b40403b-42a3-4c19-a393-81cfc5ca7351`
- `lessonPlanId = 1568ebba-9b41-4990-8b74-df2f2f4339f5`
- `templateId = 7b0c4f28-e817-47d8-acc4-7c1583000c4c`

### 12.1. Session detail says current session is Lesson 3

`GET /api/sessions/{sessionId}` returns:

- `sessionIndexInModule = 8`
- `plannedLessonTitle = "UNIT 1: I LOVE ANIMALS! - Lesson 3"`
- `lessonPlanId = 1568ebba-9b41-4990-8b74-df2f2f4339f5`
- `lessonPlanTemplateId = 7b0c4f28-e817-47d8-acc4-7c1583000c4c`
- `plannedLessonPlanTemplateId = 7b0c4f28-e817-47d8-acc4-7c1583000c4c`

Conclusion:
- Session linkage points to a concrete lesson plan and a concrete template for this exact session.

### 12.2. Lesson plan record is linked to the correct session but still carries the wrong template content

`GET /api/lesson-plans/1568ebba-9b41-4990-8b74-df2f2f4339f5` returns:

- `sessionId = 8b40403b-42a3-4c19-a393-81cfc5ca7351` (correct)
- `templateId = 7b0c4f28-e817-47d8-acc4-7c1583000c4c`
- `templateSessionIndex = 2`
- `plannedContent` still contains lesson text that references `Lesson 2`

Conclusion:
- The lesson-plan row is attached to the right session, but the template/content resolved behind it is already inconsistent.

### 12.3. Template payload is internally inconsistent

`GET /api/lesson-plan-templates/7b0c4f28-e817-47d8-acc4-7c1583000c4c` returns:

- `title = "UNIT 1: I LOVE ANIMALS! - Lesson 3"`
- `sessionIndex = 2`
- `sessionOrder = 2`
- `sourceFileName = "Unit starter lesson 2.docx"`
- `procedure` text includes `continue with Hello! - Lesson 2`

Conclusion:
- This template is the broken source of truth. It claims to be Lesson 3 in title, but metadata/file source/content point to Lesson 2.

### 12.4. session lesson-plan-document endpoint only wraps the same broken template

`GET /api/sessions/{sessionId}/lesson-plan-document` returns:

- `plannedLessonTitle = "UNIT 1: I LOVE ANIMALS! - Lesson 3"`
- `lessonPlanTemplateId = 7b0c4f28-e817-47d8-acc4-7c1583000c4c`
- `plannedLessonPlanTemplateId = 7b0c4f28-e817-47d8-acc4-7c1583000c4c`
- `document.id = 7b0c4f28-e817-47d8-acc4-7c1583000c4c`
- `document.sessionIndex = 2`
- `document.sessionOrder = 2`
- `document.sourceFileName = "Unit starter lesson 2.docx"`

Conclusion:
- `lesson-plan-document` is not producing a corrected session-specific document. It is returning the same mismatched template payload.

## 13) Final BE Conclusion

For this session, the wrong mapping is already present in backend lesson-plan/template data. FE can guard against rendering the wrong document, but FE cannot repair the source mapping.

BE needs to fix the canonical relation:

1. `sessionId -> lessonPlanId` must point to a lesson plan whose `templateId` is truly the template for that session.
2. `templateId -> lesson-plan-template` must be internally consistent across title, sessionIndex/sessionOrder, source file, and content.
3. `GET /api/sessions/{sessionId}/lesson-plan-document` must not wrap a template whose lesson metadata contradicts `plannedLessonTitle` for the same session.
