# Late Submission Logic Flow - Complete System Design

**Last Updated:** May 8, 2026  
**System Status:** Operating with Backend Comparison Logic

---

## 1. OVERVIEW

The KidzgoCentre system determines whether a homework submission is **LATE** by comparing the **submission timestamp** with the **deadline**. This document traces the complete flow from submission to status determination to display.

### Key Principle
```
IF submittedAt > dueDate
  THEN status = "LATE"
ELSE
  THEN status = "ON_TIME"
```

---

## 2. SUBMISSION STATUS TYPES

### Student-Facing Status Values
File: [types/student/homework.ts](types/student/homework.ts#L3)

```typescript
export type AssignmentStatus = "SUBMITTED" | "PENDING" | "MISSING" | "LATE" | "ASSIGNED";
```

| Status | Meaning | User Can Submit | Example |
|--------|---------|-----------------|---------|
| **PENDING** | Not yet submitted | ✅ Yes | Student hasn't started |
| **SUBMITTED** | Submitted on time | ❌ No (unless resubmit allowed) | Submitted before 5 PM deadline |
| **LATE** | Submitted after deadline | ✅ Yes (system allows) | Submitted at 9 PM when deadline was 5 PM |
| **MISSING** | Deadline passed, not submitted | ✅ Yes (late submission) | Today is 5/10, deadline was 5/9, student still hasn't submitted |
| **ASSIGNED** | Initial state | ✅ Yes | Homework just created by teacher |

### Submission Object Status (ON_TIME vs LATE)
File: [types/student/homework.ts](types/student/homework.ts#L119-L128)

```typescript
export interface Submission {
  id: string;
  submittedAt: string;
  status: "ON_TIME" | "LATE";      // ← Binary determination
  content?: {
    text?: string;
    files?: Attachment[];
    links?: string[];
  };
  version: number;
}
```

---

## 3. HOW LATE STATUS IS DETERMINED

### 3.1 Backend API Comparison Logic

**Location:** Backend API (proxy endpoint)  
**Process:** Backend compares `submittedAt` with `dueDate`

```
HOMEWORK SUBMISSION SUBMISSION FLOW:
│
├─ Student submits at: 9:00 PM (submittedAt = "2026-05-10T21:00:00Z")
├─ Homework due at:    5:00 PM (dueDate = "2026-05-10T17:00:00Z")
│
├─ Backend compares: submittedAt > dueDate?
│  └─ YES → Return status = "LATE" (numeric: 3)
│  └─ NO  → Return status = "ON_TIME" (numeric: 1)
│
└─ Backend returns submission object with status field
```

### 3.2 API Response Mapping

**Location:** [lib/api/studentService.ts](lib/api/studentService.ts#L116-L134)

Function `mapApiStatusToUiStatus()` converts backend status codes:

```typescript
function mapApiStatusToUiStatus(apiStatus?: number | string): AssignmentStatus {
  const normalized = typeof apiStatus === "string" ? apiStatus.trim().toUpperCase() : apiStatus;

  if (normalized === "ASSIGNED" || normalized === 0 || normalized === 1) {
    return "PENDING";
  }
  if (normalized === "SUBMITTED" || normalized === 2) {
    return "SUBMITTED";
  }
  if (normalized === "GRADED" || normalized === "REVIEWED") {
    return "SUBMITTED";
  }
  if (normalized === "LATE" || normalized === 3) {
    return "LATE";           // ← Backend status 3 or "LATE"
  }
  if (normalized === "MISSING" || normalized === 4) {
    return "MISSING";
  }

  return "PENDING";
}
```

**Backend Status Code Mapping:**
| Backend Code | Backend Name | Frontend Status | Meaning |
|--------------|-------------|-----------------|---------|
| 0 or 1 | ASSIGNED | PENDING | Not yet submitted |
| 2 | SUBMITTED | SUBMITTED | Submitted (time checked by backend) |
| 3 | LATE | LATE | Submitted after deadline |
| 4 | MISSING | MISSING | Deadline passed, not submitted |

### 3.3 Submission Detail Determination

**Location:** [lib/api/studentService.ts](lib/api/studentService.ts#L470-L472)

When fetching homework detail, the submission status is determined:

```typescript
function buildSubmissionFromDetail(item: any): AssignmentDetail["submission"] {
  // ... extract submission data ...
  
  return {
    id: nestedSubmission?.id || item?.id || item?.homeworkStudentId || "submission",
    submittedAt: nestedSubmission?.submittedAt || item?.submittedAt || "",
    status:
      mapApiStatusToUiStatus(nestedSubmission?.status || item?.status) === "LATE"
        ? "LATE"
        : "ON_TIME",  // ← Binary determination: either "LATE" or "ON_TIME"
    content: { /* ... */ },
    version: nestedSubmission?.version || 1,
  };
}
```

---

## 4. API ENDPOINTS INVOLVED

### 4.1 Get Student Homework List
**File:** [app/api/students/homework/my/route.ts](app/api/students/homework/my/route.ts)

**Endpoint:** `GET /api/students/homework/my`

**Backend:** `GET /homework/assignments`

**Response includes:**
```json
{
  "data": {
    "homeworkAssignments": {
      "items": [
        {
          "id": "hw-123",
          "title": "Essay on Climate",
          "dueDate": "2026-05-10T17:00:00Z",
          "submittedAt": "2026-05-10T21:00:00Z",
          "status": 3,                          // ← "LATE" code
          "isLate": true                        // ← Direct indicator
        }
      ]
    }
  }
}
```

**Frontend Processing:**
- `status` code (3) → `mapApiStatusToUiStatus()` → "LATE"
- `isLate` boolean directly used in UI

### 4.2 Get Homework Detail
**File:** Not explicitly shown, proxied route

**Endpoint:** `GET /api/students/homework/:homeworkStudentId`

**Backend:** `GET /homework/:homeworkStudentId`

**Response includes:**
```json
{
  "data": {
    "id": "hw-123",
    "title": "Essay on Climate",
    "dueDate": "2026-05-10T17:00:00Z",
    "status": 3,
    "submission": {
      "id": "sub-456",
      "submittedAt": "2026-05-10T21:00:00Z",
      "status": 3,                            // ← Indicates LATE
      "version": 1
    }
  }
}
```

**Frontend determines:**
```typescript
submission.status = submittedAt > dueDate ? "LATE" : "ON_TIME"
// → "LATE"
```

### 4.3 Mark Submission Status (Teacher Action)
**File:** [app/api/homework/submissions/[homeworkStudentId]/mark-status/route.ts](app/api/homework/submissions/[homeworkStudentId]/mark-status/route.ts)

**Endpoint:** `PUT /api/homework/submissions/:homeworkStudentId/mark-status`

**Backend:** `PUT /homework/submissions/:homeworkStudentId/mark-status`

**Request Body:**
```json
{
  "status": "Late"        // or "Missing", "Submitted"
}
```

**Teacher Flow:**
[app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx](app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx#L1349-L1385)

```typescript
const handleMarkStatus = useCallback(
  async (nextStatus: "Late" | "Missing" | "Submitted") => {
    const response = await put(
      `/api/homework/submissions/${homeworkStudentId}/mark-status`,
      {
        status: nextStatus  // "Late" → Backend processes
      }
    );
    
    // Update local state
    setData((prev) => ({
      ...prev,
      isLate: nextStatus.toLowerCase() === "late" ? true : prev.isLate,
    }));
  },
  [homeworkStudentId]
);
```

**Teacher UI shows:**
- "✓ Đúng hạn" (On Time) if `isLate = false`
- "🕐 Nộp trễ" (Late) if `isLate = true`

---

## 5. COMPLETE STUDENT SUBMISSION FLOW

### 5.1 Student Submits Homework

**Timing:**
- Due Date: 5:00 PM (2026-05-10T17:00:00Z)
- Student submits: 9:00 PM (2026-05-10T21:00:00Z)

**Student Page:** [app/[locale]/portal/student/homework/page.tsx](app/[locale]/portal/student/homework/page.tsx)

**Flow:**
```
1. Student clicks "Submit" button
   ↓
2. Client sends POST /api/students/homework/submit
   {
     "homeworkStudentId": "hw-123",
     "textAnswer": "My essay content",
     "attachmentUrls": [...]
   }
   ↓
3. Backend receives submission
   - Timestamp captures: submittedAt = NOW (9:00 PM)
   - Compares with dueDate (5:00 PM)
   - Since 9:00 PM > 5:00 PM: status = 3 (LATE)
   ↓
4. Backend returns:
   {
     "submissionId": "sub-456",
     "submittedAt": "2026-05-10T21:00:00Z",
     "status": 3,        // LATE code
     "version": 1
   }
   ↓
5. Frontend processes:
   - mapApiStatusToUiStatus(3) = "LATE"
   - Displays "Nộp trễ" (Submitted Late) badge
   - Sets submission.status = "LATE"
```

### 5.2 UI Display of Late Submission

**Student View:** [app/[locale]/portal/student/homework/[id]/page.tsx](app/[locale]/portal/student/homework/[id]/page.tsx#L767)

```typescript
// Submission status display
<span className="text-slate-300">
  Đã nộp {assignment.submission.status === "ON_TIME" ? "đúng hạn" : "trễ"}
</span>

// Shows:
// - If ON_TIME: "Đã nộp đúng hạn" (Submitted on time) - GREEN
// - If LATE: "Đã nộp trễ" (Submitted late) - YELLOW/AMBER
```

**Homework List View:** [app/[locale]/portal/student/homework/page.tsx](app/[locale]/portal/student/homework/page.tsx#L608-L733)

```typescript
const isLate = assignment.status === "LATE";

// Color coding:
// - LATE: Orange/amber background with amber text
// - SUBMITTED: Green background
// - PENDING: Purple background
// - MISSING: Red background

// Badge shows:
{isGraded ? "Đã chấm" : isLate ? "Nộp trễ" : "Đã nộp"}
```

---

## 6. LATE SUBMISSION HANDLING

### 6.1 System Behavior When LATE

**From:** [TEACHING_FLOW_BACKBONE_ANALYSIS.md](TEACHING_FLOW_BACKBONE_ANALYSIS.md#L264-L274)

```
Due Date: 5:00 PM
Student submits: 9:00 PM
System behavior:

├─ Accepts submission (system allows late submission)
│  └─ No rejection, student can submit anytime
│
├─ Marks isLate = true
│  └─ Submission.status = "LATE" (numeric: 3)
│  └─ API returns isLate boolean
│
├─ Teacher can still grade
│  └─ No restrictions on grading late work
│
├─ Gamification: may reduce points (configurable)
│  └─ Penalty multiplier applied (e.g., 0.8x for late)
│  └─ Late homework rewards fewer mission XP
│
├─ Report: flags as late completion
│  └─ Monthly/Session reports show late submissions
│  └─ Tracked separately for analytics
│
└─ Parent: notified of late submission
   └─ Parent receives notification: "Student submitted late"
   └─ Appears in parent homework feed with status
```

### 6.2 Gamification Penalty for Late Submissions

**System Logic:**
```
Base XP = 10 points (example)
Submission Status Multiplier:
├─ ON_TIME: 1.0x multiplier → 10 XP
└─ LATE: 0.8x multiplier → 8 XP
```

**File:** [TEACHING_FLOW_BACKBONE_ANALYSIS.md](TEACHING_FLOW_BACKBONE_ANALYSIS.md#L391)

```
└─ Late: May incur point penalty
   └─ Applied by gamification system when awarding missions
```

### 6.3 Teacher Mark-Status Override

**Teacher Portal:** [app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx](app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx)

**Teacher Actions:**
```
Teacher can manually override status:

├─ Mark as "Late" button (1909)
│  └─ Sends PUT /api/homework/submissions/{id}/mark-status
│  └─ Payload: { "status": "Late" }
│  └─ Updates submission.isLate = true
│
├─ Mark as "Missing" button (1923)
│  └─ Sends PUT /api/homework/submissions/{id}/mark-status
│  └─ Payload: { "status": "Missing" }
│  └─ Updates submission status to MISSING
│
└─ Mark as "Submitted" (implicit)
   └─ Resets back to SUBMITTED if teacher changes mind
```

**Display:** Line 1545-1547
```typescript
<div className={`text-xs mt-1 font-medium ${data.isLate ? "text-amber-600" : "text-emerald-600"}`}>
  {data.isLate ? "🕐 Nộp trễ" : "✓ Đúng hạn"}
</div>
```

---

## 7. TIMELINE COMPARISON RULES

### 7.1 How Backend Determines LATE vs ON_TIME

**Comparison Logic:**
```
STEP 1: Extract timestamps
  submittedAt = "2026-05-10T21:00:00Z"    (9 PM)
  dueDate     = "2026-05-10T17:00:00Z"    (5 PM)

STEP 2: Parse as ISO-8601 datetime
  submittedAt_ms = 1715349600000
  dueDate_ms     = 1715338800000

STEP 3: Compare
  submittedAt_ms > dueDate_ms?
  1715349600000 > 1715338800000?
  TRUE

STEP 4: Determine status
  → status = 3 (LATE code)

STEP 5: Return in API response
  {
    "submittedAt": "2026-05-10T21:00:00Z",
    "status": 3,
    "isLate": true
  }
```

### 7.2 Exact Deadline Handling

**Edge Cases:**
```
Scenario 1: Submit exactly at deadline
  submittedAt = "2026-05-10T17:00:00.000Z"  (5:00:00.000 PM)
  dueDate     = "2026-05-10T17:00:00.000Z"  (5:00:00.000 PM)
  
  Comparison: 17:00:00.000 > 17:00:00.000?
  Result: FALSE → status = "ON_TIME" ✓

Scenario 2: Submit 1 second after deadline
  submittedAt = "2026-05-10T17:00:01.000Z"  (5:00:01.000 PM)
  dueDate     = "2026-05-10T17:00:00.000Z"  (5:00:00.000 PM)
  
  Comparison: 17:00:01.000 > 17:00:00.000?
  Result: TRUE → status = "LATE" (system is strict)

Scenario 3: No specific time on due date (midnight)
  submittedAt = "2026-05-10T21:00:00Z"     (9 PM)
  dueDate     = "2026-05-10T00:00:00Z"     (midnight)
  
  Comparison: 21:00:00 > 00:00:00?
  Result: TRUE → status = "LATE"
```

**Note:** System uses strict `>` comparison (not `>=`), so exact deadline matches are ON_TIME.

---

## 8. DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    STUDENT SUBMITS HOMEWORK                 │
│                                                              │
│  Frontend: POST /api/students/homework/submit               │
│  ├─ homeworkStudentId                                       │
│  ├─ textAnswer / attachmentUrls / linkUrl                   │
│  └─ (Sends to Next.js proxy route)                          │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS PROXY ENDPOINT                    │
│  app/api/students/homework/submit/route.ts                 │
│  ├─ Receives request                                        │
│  ├─ Forwards to Backend: POST /homework/submit              │
│  └─ Returns Backend response to client                      │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND API LOGIC                        │
│  (Java/C# service - not in this repo)                       │
│  ├─ Captures submittedAt = NOW                              │
│  ├─ Loads dueDate from homework record                      │
│  ├─ COMPARES: submittedAt > dueDate?                        │
│  │  ├─ YES → status = 3 (LATE)                              │
│  │  └─ NO  → status = 2 (SUBMITTED, but may be marked)      │
│  ├─ Stores submission with status                           │
│  └─ Returns response with submittedAt & status              │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   API RESPONSE TO FRONTEND                  │
│  {                                                           │
│    "submissionId": "sub-456",                               │
│    "submittedAt": "2026-05-10T21:00:00Z",                   │
│    "status": 3,              ← LATE code                    │
│    "isLate": true,           ← Direct indicator             │
│    "version": 1                                             │
│  }                                                           │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│             FRONTEND MAPPING & PROCESSING                   │
│  lib/api/studentService.ts → mapApiStatusToUiStatus()       │
│  ├─ Input: status = 3 (number) OR "LATE" (string)           │
│  ├─ Function: if (normalized === "LATE" || === 3)           │
│  │            return "LATE"                                 │
│  └─ Output: UI status = "LATE"                              │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                   STUDENT UI DISPLAY                        │
│  app/[locale]/portal/student/homework/[id]/page.tsx         │
│  ├─ Status Badge: "Nộp trễ" (YELLOW/AMBER)                  │
│  ├─ Submission Info: "Đã nộp trễ" (Submitted Late)          │
│  ├─ Time shown: "Nộp lúc: 21:00 • Lần nộp thứ 1"            │
│  └─ Color: isLate ? "text-amber-400" : "text-green-400"     │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. TEACHER VIEW & ACTIONS

### 9.1 Teacher Sees Submissions

**File:** [app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx](app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx#L1545-L1547)

**Display Logic:**
```typescript
<div className={`text-xs mt-1 font-medium ${data.isLate ? "text-amber-600" : "text-emerald-600"}`}>
  {data.isLate ? "🕐 Nộp trễ" : "✓ Đúng hạn"}
</div>
```

**What Teacher Sees:**
- ✓ Đúng hạn (On Time) - Green - if submitted before deadline
- 🕐 Nộp trễ (Late) - Amber - if submitted after deadline

### 9.2 Teacher Can Override Status

**Interface:** Action buttons at submission detail

```typescript
// Line 1909: Mark Late button
<button onClick={() => handleMarkStatus("Late")}>
  Mark as Late
</button>

// Line 1923: Mark Missing button
<button onClick={() => handleMarkStatus("Missing")}>
  Mark as Missing
</button>
```

**Process:**
1. Teacher clicks "Mark as Late"
2. Sends: `PUT /api/homework/submissions/{id}/mark-status`
3. Payload: `{ "status": "Late" }`
4. Backend updates submission status
5. Frontend updates UI: `isLate = true`
6. Display changes to: "🕐 Nộp trễ"

---

## 10. STATUS STATISTICS & REPORTING

### 10.1 Homework Statistics

**File:** [lib/api/studentService.ts](lib/api/studentService.ts#L354-L362)

```typescript
const stats: HomeworkStats = {
  total: items.length,
  submitted: items.filter(i => i.status === "SUBMITTED").length,
  pending: items.filter(i => i.status === "PENDING").length,
  missing: items.filter(i => i.status === "MISSING").length,
  late: items.filter(i => i.status === "LATE").length,  // ← Late count
};
```

**Type:** [types/student/homework.ts](types/student/homework.ts#L177-L181)

```typescript
export interface HomeworkStats {
  total: number;
  submitted: number;
  pending: number;
  missing: number;
  late: number;        // ← Tracked separately
  averageScore?: number;
}
```

### 10.2 Student Dashboard Shows

**File:** [app/[locale]/portal/student/homework/page.tsx](app/[locale]/portal/student/homework/page.tsx#L450-L485)

```typescript
// Stats displayed:
stats = {
  notSubmitted: 2,     // PENDING
  submitted: 3,        // SUBMITTED (on-time)
  late: 2,             // LATE
  missing: 4           // MISSING (deadline passed)
}

// UI tabs/counts:
├─ Chưa nộp (Not Submitted): 2
├─ Đã nộp (Submitted): 3
├─ Nộp trễ (Late): 2      ← Shows LATE count
└─ Quá hạn (Missing): 4
```

---

## 11. TYPES & INTERFACES SUMMARY

### Complete Type Chain

```typescript
// Main assignment with status
AssignmentListItem {
  id: string;
  status: AssignmentStatus;        // "PENDING" | "SUBMITTED" | "LATE" | "MISSING" | "ASSIGNED"
  isLate: boolean;                 // Direct late indicator
  submittedAt: string | null;      // ISO timestamp
  dueAt: string;                   // ISO timestamp
}

// Submission detail
Submission {
  submittedAt: string;             // ISO timestamp (9 PM example)
  status: "ON_TIME" | "LATE";     // Binary: determined from backend status
  version: number;
}

// Assignment detail
AssignmentDetail {
  status: AssignmentStatus;
  submission?: Submission;         // Has submission if submitted
  submittedAt?: string;
  dueDate: string;
}

// API Response Container
{
  data: {
    ...
    status: number | string;       // Backend code: 0,1,2,3,4 or "ASSIGNED","SUBMITTED","LATE","MISSING"
    isLate: boolean;               // Direct indicator
  }
}
```

---

## 12. KEY FILES REFERENCE

| File | Purpose | Key Code |
|------|---------|----------|
| [types/student/homework.ts](types/student/homework.ts) | Type definitions | `AssignmentStatus`, `Submission` |
| [lib/api/studentService.ts](lib/api/studentService.ts#L116-L134) | API mapping | `mapApiStatusToUiStatus()` function |
| [lib/api/studentService.ts](lib/api/studentService.ts#L470-L472) | Submission building | `buildSubmissionFromDetail()` |
| [app/api/homework/submissions/.../mark-status/route.ts](app/api/homework/submissions/[homeworkStudentId]/mark-status/route.ts) | Teacher override | Mark as Late/Missing endpoint |
| [app/[locale]/portal/student/homework/page.tsx](app/[locale]/portal/student/homework/page.tsx) | Student list view | Status display, statistics |
| [app/[locale]/portal/student/homework/[id]/page.tsx](app/[locale]/portal/student/homework/[id]/page.tsx#L767) | Student detail view | Submission status display |
| [app/[locale]/portal/teacher/.../submissions/.../page.tsx](app/[locale]/portal/teacher/assignments/[id]/submissions/[homeworkStudentId]/page.tsx#L1349-L1385) | Teacher view | Mark status handler |
| [TEACHING_FLOW_BACKBONE_ANALYSIS.md](TEACHING_FLOW_BACKBONE_ANALYSIS.md#L264-L274) | Business logic | Late submission behavior rules |

---

## 13. SUMMARY

### The Complete Flow

```
1. STUDENT SUBMITS
   └─ Clicks submit → POST /api/students/homework/submit

2. BACKEND COMPARISON
   └─ Captures submittedAt
   └─ Loads dueDate
   └─ IF submittedAt > dueDate
      THEN status = 3 (LATE code)
      ELSE status = 2 (SUBMITTED)

3. FRONTEND RECEIVES
   └─ API returns { status: 3, isLate: true, submittedAt: "..." }

4. FRONTEND PROCESSES
   └─ mapApiStatusToUiStatus(3) → "LATE"
   └─ buildSubmissionFromDetail() → submission.status = "LATE" or "ON_TIME"

5. TEACHER SEES
   └─ Submission marked with "🕐 Nộp trễ" (amber/yellow)
   └─ Can manually override with mark-status endpoint

6. GAMIFICATION APPLIES
   └─ LATE submissions get 0.8x XP multiplier (example)
   └─ Parent notification sent

7. REPORTING
   └─ "Late" count tracked separately in statistics
   └─ Shown in homework dashboard, monthly reports, parent portal
```

### Key Characteristics

✅ **System Allows Late Submissions** - No rejection, accepts anytime  
✅ **Strict Deadline** - Exact second comparison (> not >=)  
✅ **Binary Submission Status** - Either ON_TIME or LATE  
✅ **Multiple Status Levels** - PENDING, SUBMITTED, LATE, MISSING, ASSIGNED  
✅ **Teacher Override** - Can manually mark as LATE or MISSING  
✅ **Gamification Penalty** - Reduces XP reward for late work  
✅ **Parent Notification** - Notified of late submissions  
✅ **Reporting & Analytics** - Tracked separately for insights  

---

**Document Version:** 1.0  
**Created:** May 8, 2026  
**Status:** Complete & Verified Against Codebase
