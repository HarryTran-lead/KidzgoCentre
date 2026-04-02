# Luong 1: Tuyen sinh, Placement Test, Registration va Xep lop

Ngay cap nhat: 2026-04-02

Man hinh: `Leads -> Placement Tests -> Registrations -> Classes`

## 1. Muc dich

Tai lieu nay duoc viet lai de team FE/QA co mot ban mo ta Flow 1 hop logic hon voi code hien tai trong `KidzgoCentre`, dong thoi bam sat huong nghiep vu BE moi nhat cho:

- mixed program / secondary program
- `1 registration / 2 tracks`
- assign class theo `primary` hoac `secondary`
- session-level assignment cho cac buoc sau khi vao lop

## 2. Nguon doi chieu

Da doi chieu truc tiep tu FE integration layer hien co:

- `app/api/leads/*`
- `app/api/placement-tests/*`
- `app/api/registrations/*`
- `app/api/classes/*`
- `lib/api/leadService.ts`
- `lib/api/placementTestService.ts`
- `lib/api/registrationService.ts`
- `app/api/admin/classes.ts`
- `types/lead/index.ts`
- `types/placement-test/index.ts`
- `types/registration/index.ts`
- `types/admin/classes.ts`

Luu y quan trong:

- Workspace hien tai khong chua repo BE nhu `Kidzgo.API`, `Kidzgo.Application`, `Kidzgo.Domain`
- Vi vay tai lieu nay la ban `FE integration audit + BE contract alignment`, khong phai ban xac nhan domain logic tu source backend

## 3. Tom tat luong hien tai

1. Tao `Lead` tu public form hoac tu staff.
2. Quan ly `Lead`, `LeadChild`, note, owner va status tren man hinh Leads.
3. Dat lich `Placement Test`.
4. Nhap ket qua test, co the co `programRecommendation` va `secondaryProgramRecommendation`.
5. `Convert to enrolled` chi xu ly convert lead/student theo action placement test, khong nen assume la tu dong tao full registration mixed-track.
6. Tao `Registration` tu `StudentProfile` da co.
7. Registration co the co:
   - `programId`
   - `secondaryProgramId`
   - `secondaryProgramSkillFocus`
8. Goi `suggest-classes` de lay bucket goi y cho `primary` va `secondary`.
9. `assign-class` va `transfer-class` bat buoc xac dinh `track`.
10. Sau khi vao lop, cac flow timetable, attendance, leave/makeup, session report se doc theo session assignment that su.

## 4. Muc nao dang khop tot voi spec moi

### 4.1. Registrations

Day la phan FE dang bam sat spec moi nhat nhat:

- ho tro `secondaryProgramId`
- ho tro `secondaryProgramSkillFocus`
- ho tro `track = primary | secondary`
- ho tro `sessionSelectionPattern`
- co `waiting-list`, `transfer-class`, `upgrade`

Nen coi day la trung tam cua Flow 1 moi:

- placement test de xac dinh huong hoc
- registration de giu package chung
- assign class theo tung track

### 4.2. Placement Test results

FE da doc/ghi duoc cac field secondary quan trong:

- `secondaryProgramRecommendation`
- `isSecondaryProgramSupplementary`
- `secondaryProgramSkillFocus`

No phu hop voi huong demo moi: placement test co the de xuat chuong trinh chinh va them huong hoc phu.

## 5. Muc can hieu dung de tranh lech tai lieu

### 5.1. Error response neu test qua FE proxy

Neu QA/test di qua `KidzgoCentre/app/api`, loi thuong bi normalize boi helper chung thay vi giu nguyen raw `ProblemDetails`.

Dau hieu hien tai:

- `lib/api/routeHelpers.ts`

Dang loi thuong gap:

```json
{
  "success": false,
  "isSuccess": false,
  "data": null,
  "message": "..."
}
```

Vi vay:

- test BE direct: dung contract `ProblemDetails`
- test qua FE proxy: chap nhan them lop wrapper loi cua FE

### 5.2. Leads public dang chat hon business spec

Route public hien tai dang validate bat buoc ca:

- `contactName`
- `email`
- `phone`

Trong khi business rule BE thuong mo hon.

File lien quan:

- `app/api/leads/public/route.ts`
- `types/lead/index.ts`

Tac dong:

- neu test qua FE public form/proxy thi se fail som hon so voi mo ta BE
- tai lieu QA can ghi ro day la hanh vi hien tai cua FE, khong phai chac chan la rule cuoi cung cua BE

### 5.3. Placement Test types/service da duoc no rong de bam sat spec moi

Da chinh theo huong an toan:

- `CreatePlacementTestRequest` cho phep payload linh hoat hon
- `UpdatePlacementTestRequest` co them `studentProfileId`, `classId`
- `convertPlacementTestToEnrolled()` cho phep truyen `studentProfileId` neu can
- filter type duoc mo rong cho cac truong hop query moi

Nhung can luu y:

- UI hien tai van co the dang validate chat hon type o mot so form
- neu can mo rong flow convert hoac update placement test theo nghiep vu moi, can test lai man hinh staff/admin placement test

### 5.4. Classes tren FE chua expose day du tat ca API BE co the co

FE proxy hien tai xac nhan duoc:

- `GET /api/classes`
- `POST /api/classes`
- `GET /api/classes/{id}`
- `PUT /api/classes/{id}`
- `PATCH /api/classes/{id}/status`

Chua thay route proxy rieng trong repo hien tai cho:

- `DELETE /api/classes/{id}`
- `PATCH /api/classes/{id}/assign-teacher`
- `GET /api/classes/{id}/capacity`

Vi vay tai lieu demo/QA nen tach ro:

- `BE available`
- `FE exposure da co`

## 6. wording demo nen dung sau khi doi flow

Khong nen noi:

- moi hoc vien ghi danh vao mot lop va hoc toan bo lich lop do

Nen noi:

- placement test co the de xuat them secondary program
- mot registration co the hoc 1 hoac 2 track
- hoc vien co the hoc 2 lop khac nhau nhung van dung chung 1 package
- viec hoc that su duoc xac dinh boi session assignment, khong chi boi class enrollment

## 7. Cac diem follow-up nen lam tiep

1. Neu muon tai lieu nay thanh ban "verified from backend source", can doi chieu lai tren repo BE that.
2. Nen tiep tuc sync doc cu `PLACEMENT_TEST_GUIDE.md` va cac tai lieu swimlane de tranh giu assumption cu.
3. Nen QA lai chuoi sau theo spec moi:
   - Placement Test result co secondary recommendation
   - Registration co `secondaryProgramId`
   - Suggest classes tra ve bucket `primary` va `secondary`
   - Assign class theo `track`
   - Transfer class voi `sessionSelectionPattern`

## 8. Ket luan

Flow 1 hop logic nhat khi duoc hieu theo thu tu sau:

- `Lead`
- `Placement Test`
- `StudentProfile`
- `Registration`
- `Suggest Class`
- `Assign Class theo track`

Va diem thay doi lon nhat so voi flow cu la:

- registration khong con dong nghia voi chi mot huong hoc
- class enrollment khong con la nguon su that duy nhat cho lich hoc ve sau

Tai lieu nay nen duoc dung lam ban mo ta chuan cho team FE/QA trong repo hien tai.
