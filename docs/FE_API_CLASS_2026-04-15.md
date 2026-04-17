# Tai Lieu API FE - Class - 2026-04-15

Tai lieu nay mo ta cac API trong ClassController.cs, bao gom bo sung tinh nang gian lop tuong lai.

## Ghi chu

- Controller khong co `[Authorize]` o class level, nhung tung endpoint deu co `[Authorize(Roles=...)]`.
- `GET /api/classes` hien cho `Admin`, `ManagementStaff`, `Parent`; khong cho `Teacher`.
- `GET /api/classes/{id}/students` cho `Teacher`, nhung teacher chi xem duoc lop ma minh la main/assistant teacher.
- API schedule segment chi dung cho chuong trinh phu (`Program.IsSupplementary = true`).

## Role va pham vi du lieu

| Role | Du lieu duoc xem | Pham vi du lieu | Hanh dong |
| --- | --- | --- | --- |
| Admin | Classes, students, capacity, schedule segments, future stretch | all | view, create, edit, delete, change_status, assign_teacher, update_color, add_schedule_segment, stretch_future_schedule |
| ManagementStaff | Classes, students, capacity, schedule segments, future stretch | all | view, create, edit, change_status, assign_teacher, update_color, add_schedule_segment, stretch_future_schedule |
| Teacher | Students trong lop teacher day | own voi `/students` | view_students |
| Parent | Danh sach lop makeup theo filter hien tai | own-ish theo query/filter | view |
| Student | Khong duoc truy cap controller nay | none | none |
| Anonymous | Khong duoc truy cap | none | none |

## Response format

Success:

```json
{ "isSuccess": true, "data": {} }
```

Rieng `PATCH /api/classes/{classId}/color` tra:

```json
{ "isSuccess": true }
```

Error:

```json
{
  "title": "Class.CodeExists",
  "status": 409,
  "detail": "Class code already exists"
}
```

## Enum/status

| Enum | Values |
| --- | --- |
| `ClassStatus` | `Planned`, `Recruiting`, `Active`, `Full`, `Closed`, `Completed`, `Suspended`, `Cancelled` |
| `EnrollmentStatus` lien quan | `Active`, `Paused`, `Dropped` |

## Danh sach API

| Method | Endpoint | Roles | Mo ta |
| --- | --- | --- | --- |
| POST | `/api/classes` | Admin, ManagementStaff | Tao lop |
| GET | `/api/classes` | Admin, ManagementStaff, Parent | Lay danh sach lop |
| GET | `/api/classes/{id}` | Admin, ManagementStaff | Xem chi tiet lop |
| POST | `/api/classes/{id}/schedule-segments` | Admin, ManagementStaff | Them segment lich cho lop supplementary, gom ca use-case gian buoi hoc trong tuong lai (2 -> 3/5 buoi/tuan) |
| GET | `/api/classes/{id}/students` | Admin, ManagementStaff, Teacher | Xem hoc sinh trong lop |
| PUT | `/api/classes/{id}` | Admin, ManagementStaff | Cap nhat lop |
| PATCH | `/api/classes/{classId}/color` | Admin, ManagementStaff | Cap nhat mau lop |
| DELETE | `/api/classes/{id}` | Admin | Xoa mem lop |
| PATCH | `/api/classes/{id}/status` | Admin, ManagementStaff | Doi status lop |
| PATCH | `/api/classes/{id}/assign-teacher` | Admin, ManagementStaff | Gan main/assistant teacher |
| GET | `/api/classes/{id}/capacity` | Admin, ManagementStaff | Check si so lop |

## Bo sung moi: Gian lop tuong lai

### POST `/api/classes/{id}/schedule-segments` (use-case gian lop tuong lai)

Muc dich:

- Cho phep Admin/ManagementStaff tang mat do lich hoc o mot moc thoi gian trong tuong lai.
- Vi du lop hien tai 2 buoi/tuan, tu ngay hieu luc co the chuyen thanh 3 hoac 5 buoi/tuan.
- Chi ap dung cho lich tuong lai, khong sua session da qua.

Body:

| Field | Type | Required | Default | Mo ta |
| --- | --- | --- | --- | --- |
| `effectiveFrom` | `DateOnly` | Yes | - | Ngay bat dau ap dung lich gian |
| `schedulePattern` | `string` | Yes | - | RRULE moi tuong ung so buoi/tuan |
| `effectiveTo` | `DateOnly?` | No | null | Ngay ket thuc segment neu can |
| `generateSessions` | `bool` | No | true | Co generate lai sessions khong |
| `onlyFutureSessions` | `bool` | No | true | Chi tac dong len sessions chua dien ra |

Success `200`:

```json
{
  "isSuccess": true,
  "data": {
    "id": "f8c9b6df-7ec8-4c06-b8d6-3ca6d69bc5a2",
    "classId": "a87b0d63-4f06-4f03-b228-2869ceef74f0",
    "effectiveFrom": "2026-05-01",
    "effectiveTo": null,
    "schedulePattern": "FREQ=WEEKLY;BYDAY=MO,TU,TH,FR,SA",
    "generatedSessionsCount": 24
  }
}
```

Errors:

- `404 Class.NotFound`
- `400 Class.ScheduleSegmentInvalidEffectiveDate`
- `400 SchedulePattern.Empty`
- `400 SchedulePattern.Invalid`
- `409 Class.ScheduleSegmentAlreadyExists`
- `409 Class.FutureScheduleSegmentExists`
- Session generation/conflict errors
- `401`, `403`

Notes FE:

- FE nen cho user chon nhanh preset `3 buoi/tuan`, `5 buoi/tuan` va cho phep custom (UI), sau do map thanh `schedulePattern` truoc khi submit.
- FE nen preview lich moi truoc khi submit (tu RRULE).
- FE can warning ro rang: thay doi chi ap dung cho tuong lai.

### FE integration (helper da co san)

```ts
import {
  addClassScheduleSegment,
  buildFutureStretchPayload,
  validateFutureStretchPayload,
} from "@/lib/api/classService";

const errors = validateFutureStretchPayload({
  effectiveFrom: "2026-05-01",
  days: ["MO", "TU", "TH", "FR", "SA"],
  currentSessionsPerWeek: 2,
});

if (errors.length > 0) {
  throw new Error(errors.join("; "));
}

const payload = buildFutureStretchPayload({
  effectiveFrom: "2026-05-01",
  days: ["MO", "TU", "TH", "FR", "SA"],
  startTime: "18:00",
  durationMinutes: 90,
  generateSessions: true,
  onlyFutureSessions: true,
});

await addClassScheduleSegment(classId, payload);
```

## Permission matrix

| API | Admin | ManagementStaff | Teacher | Parent | Student | Anonymous |
| --- | --- | --- | --- | --- | --- | --- |
| `POST /api/classes` | Yes | Yes | No | No | No | No |
| `GET /api/classes` | Yes | Yes | No | Yes | No | No |
| `GET /api/classes/{id}` | Yes | Yes | No | No | No | No |
| `POST /api/classes/{id}/schedule-segments` | Yes | Yes | No | No | No | No |
| `GET /api/classes/{id}/students` | Yes | Yes | Yes, lop minh day | No | No | No |
| `PUT /api/classes/{id}` | Yes | Yes | No | No | No | No |
| `PATCH /api/classes/{classId}/color` | Yes | Yes | No | No | No | No |
| `DELETE /api/classes/{id}` | Yes | No | No | No | No | No |
| `PATCH /api/classes/{id}/status` | Yes | Yes | No | No | No | No |
| `PATCH /api/classes/{id}/assign-teacher` | Yes | Yes | No | No | No | No |
| `GET /api/classes/{id}/capacity` | Yes | Yes | No | No | No | No |

## Validation rules (bo sung)

| Rule | API ap dung | Loi |
| --- | --- | --- |
| Role dung | Tat ca | 403 |
| `branchId`, `programId`, `code`, `title/name`, `startDate`, `capacity` bat buoc | Create/update | 400 validation |
| `code` max 50 va unique | Create/update | 400/409 |
| `title` max 255 | Create/update | 400 |
| `startDate` khong o qua khu | Create/update | 400 |
| Neu co `schedulePattern` thi can `endDate` | Create/update | 400 |
| `endDate >= startDate` va khong o qua khu | Create/update | 400 |
| `capacity > 0` | Create/update | 400 |
| Branch/program phai active | Create/update | 404 |
| Teacher phai ton tai, dung role, cung branch | Create/update/assign-teacher | 404/409 |
| Lich/phong/teacher khong duoc conflict | Create/update/assign-teacher | 409 |
| Schedule segment chi cho supplementary program | Add schedule segment | 400 |
| Segment effective date phai nam trong range lop | Add schedule segment | 400 |
| Khong duoc them segment trung `effectiveFrom` hoac them truoc future segment da co | Add schedule segment | 409 |
| Khong delete class co active enrollments | Delete | 409 |
| Color phai dung format `#RRGGBB` | Update color | 400 |
| Gian lich tuong lai phai co `effectiveFrom` hop le va nam trong range cho phep | Add schedule segment | 400 |
| RRULE gian lich tuong lai do FE map tu cau hinh so buoi/tuan | Add schedule segment | 400 |
| Khong duoc tao segment trung moc hoac conflict voi segment khac | Add schedule segment | 409 |

## Status definition

| Status | Y nghia |
| --- | --- |
| `Planned` | Lop da len ke hoach |
| `Recruiting` | Dang tuyen sinh |
| `Active` | Dang hoc |
| `Full` | Da du si so |
| `Closed` | Da dong/ket thuc |
| `Completed` | Hoan thanh |
| `Suspended` | Tam ngung |
| `Cancelled` | Da huy |

Luong chuyen trang thai hien tai:

```text
PATCH /status cho phep doi status linh hoat
Neu status hien tai la Closed thi khong duoc doi ve Planned
Neu status moi bang status hien tai -> Class.StatusUnchanged
```
