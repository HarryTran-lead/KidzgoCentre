# FE Archive Import Alignment (2026-05-25)

Scope: Align admin syllabus import UI with BE flow `ZIP upload -> BE parse -> DB JSON -> FE render`.

## Implemented In FE

File: `app/[locale]/portal/admin/syllabuses/page.tsx`

1. ZIP import confirmation now uses `POST /api/syllabuses/import-archive` response directly.
2. Result modal renders:
- `syllabusId`
- `importedLessonPlans`
- `importedEntries[]`
- `skippedEntries[]`
- sourceType/sourceFolder breakdown
3. Removed dependency on grouped fallback endpoint for ZIP confirmation (`getUnitLessonPlans`) to avoid zero-state mismatch.
4. Added explicit client-side guard for unsupported `RAR` upload in ZIP modal.
5. Added quick verification hints in modal:
- `GET /api/syllabuses/{syllabusId}`
- `GET /api/lessons/{lessonCode}` when available in imported entries.

## Behavior Notes

- FE does not parse DOCX/XLSX in client.
- FE reads and renders BE JSON response payloads.
- Word import remains available as syllabus-only import flow.

## Updated Types

File: `lib/api/syllabusService.ts`

`ImportedEntry` expanded to tolerate BE archive shape fields:
- `sourceFolder`
- `sourceType`
- `moduleId` optional
- `moduleName`
- `sessionOrder`
- `lessonCode`
