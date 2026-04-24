# BE One-Page Handoff - Chan tam dung khi con du lieu hoat dong

Date: 2026-04-23

## 1) Van de can fix ngay

He thong hien cho phep tam dung/vo hieu hoa doi tuong du doi tuong do van dang duoc su dung.

Case da xac nhan:
- Chuong trinh hoc van tam dung duoc khi con lop/hoc vien.
- Goi hoc van tam dung duoc khi con hoc vien dang hoc.
- Phong hoc van tam dung duoc khi con lop/buoi sap dien ra.
- Chi nhanh van vo hieu hoa duoc khi van con van hanh.

Ket luan:
- BE la noi can chan cung nghiep vu.
- FE chi bo sung canh bao UX, khong du tin cay de enforce.

## 2) Endpoint can them guard nghiep vu

- PATCH /programs/{id}/toggle-status
- PATCH /tuition-plans/{id}/toggle-status
- PATCH /classrooms/{id}/toggle-status
- PATCH /branches/{id}/status

## 3) Rule chan bat buoc (chi ap dung khi chuyen sang inactive)

Program:
- Chan neu con class Active/Planned.
- Chan neu con hoc vien/enrollment dang hoat dong.

Tuition plan:
- Chan neu con enrollment dang su dung goi.

Classroom:
- Chan neu co lop dang hoc.
- Chan neu co buoi hoc tu hien tai tro di.

Branch:
- Chan neu con active classes.
- Chan neu con active students/enrollments.
- Chan neu con active staff/teachers.
- Chan neu con active classrooms.

## 4) Hop dong loi de FE map nhanh

HTTP:
- 409 Conflict khi bi chan nghiep vu.

Response de xuat:

```json
{
  "success": false,
  "code": "STATUS_CHANGE_BLOCKED",
  "message": "Khong the tam dung vi doi tuong dang duoc su dung.",
  "details": {
    "entity": "Program",
    "entityId": "...",
    "reasons": ["ACTIVE_CLASSES_EXIST", "ACTIVE_STUDENTS_EXIST"],
    "counts": {"activeClasses": 3, "activeStudents": 42}
  }
}
```

## 5) Reason code de dung chung

- STATUS_CHANGE_BLOCKED
- ACTIVE_CLASSES_EXIST
- ACTIVE_STUDENTS_EXIST
- ACTIVE_ENROLLMENTS_EXIST
- FUTURE_SESSIONS_EXIST
- ACTIVE_STAFF_EXIST
- ACTIVE_ROOMS_EXIST

## 6) Acceptance test toi thieu

Moi entity test 4 case:
- active -> inactive, khong dependency: pass.
- active -> inactive, co 1 dependency: 409 + reason.
- active -> inactive, co nhieu dependency: 409 + nhieu reason.
- inactive -> active: pass (tru khi co policy dac biet).

## 7) Ghi chu trien khai

- Check + update trong cung transaction de tranh race condition.
- Ghi audit log moi lan accepted/rejected status change.
