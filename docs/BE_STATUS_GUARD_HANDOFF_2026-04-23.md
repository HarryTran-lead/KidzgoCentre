# BE Handoff - Status Guard Rules (Admin)

Date: 2026-04-23  
Owner: FE audit handoff  
Scope: Admin status toggle/deactivate flows that currently allow unsafe transitions

## 1) Problem Summary

Current admin flows allow deactivation/toggle even when entity is still in active use.

Observed from FE + API proxy audit:
- FE sends toggle/update status directly without dependency pre-check.
- Next API routes mostly forward to backend as-is.
- Business protection must be enforced on BE as source of truth.

## 2) Confirmed Affected Domains

### A. Program (Chuong trinh hoc)
- FE call path: admin courses toggle status
- API proxy path: `PATCH /api/programs/{id}/toggle-status` -> backend `programs/toggle-status`
- Current issue: Program can be set inactive even when classes/students are still linked.

### B. Tuition Plan (Goi hoc)
- FE call path: admin tuition-plans toggle status
- API proxy path: `PATCH /api/tuition-plans/{id}/toggle-status` -> backend `tuition-plans/toggle-status`
- Current issue: Plan can be set inactive even when there are active enrollments/students using it.

### C. Classroom (Phong hoc)
- FE call path: admin rooms toggle status
- API proxy path: `PATCH /api/classrooms/{id}/toggle-status` -> backend `classrooms/toggle-status`
- Current issue: Room can be inactivated while having ongoing/upcoming class sessions.

### D. Branch (Chi nhanh)
- FE call path: admin branches activate/deactivate
- API proxy path: `PATCH /api/branches/{id}/status` -> backend `branches/{id}/status`
- Current issue: Branch can be deactivated while still operating (active classes/students/users/rooms).

## 3) Required BE Business Rules (Must Enforce)

Important: FE-side guard is only UX improvement. BE must reject invalid transitions.

### Rule Set - Program
When requested status is `inactive`, reject if ANY condition is true:
1. Exists class with status in active lifecycle (suggested: `Planned`, `Active`) for this program.
2. Exists active enrollment/student bound to this program.
3. Exists active tuition plan linked to this program (optional but recommended by data policy).

### Rule Set - Tuition Plan
When requested status is `inactive`, reject if ANY condition is true:
1. Exists enrollment/registration using this tuition plan and not completed/cancelled.
2. Exists student currently studying with this plan (active study state).

### Rule Set - Classroom
When requested status is `inactive`, reject if ANY condition is true:
1. Exists class using this classroom in `Active` state.
2. Exists future scheduled session in this classroom (suggested window: now onward).

### Rule Set - Branch
When requested status is `inactive`, reject if ANY condition is true:
1. Exists active class in branch.
2. Exists active enrollment/student in branch.
3. Exists active staff/teacher account assigned to branch.
4. Exists active classroom in branch.
5. Exists financial/open operational records that require branch active (optional, if policy requires).

## 4) API Contract Requirements

### 4.1. Keep current endpoints, add guarded behavior
- `PATCH /programs/{id}/toggle-status`
- `PATCH /tuition-plans/{id}/toggle-status`
- `PATCH /classrooms/{id}/toggle-status`
- `PATCH /branches/{id}/status`

### 4.2. Error response shape (standardized)
Use consistent JSON when rejecting transition:

```json
{
  "success": false,
  "code": "STATUS_CHANGE_BLOCKED",
  "message": "Khong the tam dung chuong trinh hoc do dang co lop hoc hoac hoc vien hoat dong.",
  "details": {
    "entity": "Program",
    "entityId": "...",
    "reasons": [
      "ACTIVE_CLASSES_EXIST",
      "ACTIVE_STUDENTS_EXIST"
    ],
    "counts": {
      "activeClasses": 3,
      "activeStudents": 42
    }
  }
}
```

Suggested HTTP status:
- `409 Conflict` for business-state conflict.
- `400 Bad Request` only for malformed input.

### 4.3. Success response remains backward compatible
Return existing success shape to avoid FE break.

## 5) Error Codes (Recommended)

- `STATUS_CHANGE_BLOCKED`
- `ACTIVE_CLASSES_EXIST`
- `ACTIVE_STUDENTS_EXIST`
- `ACTIVE_ENROLLMENTS_EXIST`
- `ACTIVE_STAFF_EXIST`
- `ACTIVE_ROOMS_EXIST`
- `FUTURE_SESSIONS_EXIST`

Notes:
- FE can map by `code`/`details.reasons` for precise toast/modal.
- Keep human-readable `message` in Vietnamese for current FE.

## 6) Concurrency + Data Integrity

BE should apply checks and update in one transaction boundary where possible:
1. Lock target row (or equivalent safe strategy).
2. Re-check dependencies inside transaction.
3. Apply status update only if checks pass.

This prevents race conditions where dependencies change during toggle request.

## 7) Audit Logging (Required)

For every accepted/rejected status change, log:
- actorId
- entityType/entityId
- oldStatus/newStatus
- result: `accepted` or `rejected`
- rejection reasons (if any)
- timestamp

## 8) Acceptance Criteria

### Program
- Cannot deactivate when program has at least one active/planned class.
- Cannot deactivate when students are actively enrolled.
- Can deactivate when no active dependencies remain.

### Tuition Plan
- Cannot deactivate when plan is referenced by active enrollment.
- Can deactivate after all linked enrollments are completed/cancelled.

### Classroom
- Cannot deactivate when room has ongoing class.
- Cannot deactivate when room has future sessions.
- Can deactivate when no ongoing/future usage.

### Branch
- Cannot deactivate when branch still has active classes/students/staff/rooms.
- Can deactivate only when branch has no active operational dependencies.

## 9) Suggested Test Matrix (BE)

For each entity:
1. `active -> inactive` with no dependencies: expect success.
2. `active -> inactive` with one dependency type present: expect 409 + reason.
3. `active -> inactive` with multiple dependency types: expect 409 + multi reasons.
4. `inactive -> active`: expect success unless specific policy blocks.
5. Parallel requests (race): only valid transition should commit.

## 10) FE Follow-up After BE Release

After BE ships guarded responses, FE will:
1. Map `STATUS_CHANGE_BLOCKED` and reason codes to specific warning dialogs.
2. Disable toggle button proactively when summary counts indicate unsafe state.
3. Keep BE as final source of truth for enforcement.

---

If BE agrees, FE can provide a small response-mapper patch to display detailed rejection reasons in modal/toast immediately after BE deployment.
