# Lesson Plan Import Quickstart

## File in this folder
- lesson-plan-import-template.csv: sample CSV with standard columns.
- lesson-plan-import-template.xlsx: sample Excel with 2 sheets (Program_Starters, Program_Flyers).
- generate-lesson-plan-import-template.mjs: script to regenerate the xlsx sample.

## CSV rules
- Required extension: .csv
- In UI, CSV import requires Program selection.
- Recommended headers:
  - Period
  - Date
  - Teacher
  - Time
  - Book
  - Skills
  - Classwork
  - Required Materials
  - Homework Required Materials
  - Extra / Note
- Backend groups rows by Period to build one session template.

## How to test import in UI
1. Open Lesson Plan Workspace.
2. Go to Template tab.
3. Click Import syllabus.
4. Choose one file:
  - lesson-plan-import-template.csv
  - lesson-plan-import-template.xlsx
5. If using CSV, select Program (required for CSV).
6. Set overwriteExisting = true if you want to update existing sessions.
7. Submit import and verify imported session count.

## Post-import checks
- Session templates created by Program + SessionIndex.
- Open one template and verify syllabusContent has activities.
- In class syllabus view, session should map to template by SessionIndex.

## Regenerate xlsx sample
Run from workspace root:

```bash
node ./docs/samples/generate-lesson-plan-import-template.mjs
```

## Teacher edit boundaries after import
Teacher should only update:
- classwork
- requiredMaterials
- homeworkRequiredMaterials
- extra / note
Other setup fields stay read-only.
