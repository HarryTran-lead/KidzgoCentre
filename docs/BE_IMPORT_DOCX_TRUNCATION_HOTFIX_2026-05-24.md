# BE Import DOCX Truncation Hotfix

Updated: 2026-05-24
Owner: BE Import Parser
Priority: P0

## Problem Summary

Imported syllabus file:
- The Syllabus of Get Ready for Starters full (1).docx

Current API data shows major truncation compared to source DOCX:
- Expected: many units and period ranges (from Starter through Unit 8 in the provided screenshots)
- Actual from document endpoint:
  - sections include only 1 table section
  - summary.totalUnits = 2
  - summary.totalSessions = 2
  - summary.totalLessons = 2
  - summary.totalPeriods = 6

Actual from detail endpoint for same syllabus id:
- importedLessonPlanTemplateCount = 50
- lessons length = 2 only
- sessionTemplates length = 2 only
- list view shows unitCount = 19 (mismatch with detail/document payload)

Conclusion:
- FE receives already truncated table/document payload from BE.
- FE cannot reconstruct missing rows that are absent in API response.

## Reproduction

1. Import file The Syllabus of Get Ready for Starters full (1).docx.
2. Call list endpoint and open created syllabus id 94d18d73-3bb2-4a84-9b83-6b3b73ce18da.
3. Compare source DOCX table pages vs API response from:
   - GET /api/syllabuses/{id}/document
   - GET /api/syllabuses/{id}
4. Observe response only includes first small subset rows (2 lessons, 6 periods).

## Concrete Evidence Extracted

For id 94d18d73-3bb2-4a84-9b83-6b3b73ce18da:

- GET /api/syllabuses/{id}/document returns:
  - sections[2].type = table
  - summary = { totalUnits: 2, totalSessions: 2, totalLessons: 2, totalPeriods: 6 }

- GET /api/syllabuses/{id} returns:
  - importedLessonPlanTemplateCount = 50
  - lessons = 2 items only
  - sessionTemplates = 2 items only
  - overview parsed, but table rows mostly missing

- GET /api/syllabuses list item returns:
  - unitCount = 19
  - sessionTemplateCount = 2

This is an internal inconsistency across BE outputs for the same syllabus.

## Expected Contract

For imported DOCX with full curriculum table:
- document.sections table must include all parsed rows from source table
- summary counts must reflect complete parsed data
- detail endpoint lessons/sessionTemplates should be consistent with document summary
- list endpoint counters must match detail/document counters

## Required BE Fix

1. Fix DOCX table parser to keep all rows across page breaks.
2. Preserve merged cells and row groups while still emitting each logical row.
3. Ensure parse does not stop at first page/table chunk.
4. Recompute summary from final full parsed dataset.
5. Guarantee consistency among:
   - GET /api/syllabuses
   - GET /api/syllabuses/{id}
   - GET /api/syllabuses/{id}/document

## Acceptance Criteria

1. Same imported file returns complete curriculum rows covering full DOCX table.
2. summary.totalPeriods and totalLessons align with full source table, not first chunk.
3. lessons/sessionTemplates counts are coherent with importedLessonPlanTemplateCount and list counters.
4. FE modal can render full table without fallback heuristics.

## Notes for FE/QA

- FE currently has a manual button to force full table view and robust schema fallback.
- However FE cannot display rows that BE never returns.
- After BE fix, re-import the same file and verify row count and unit coverage end-to-end.
