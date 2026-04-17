# Tai lieu Gamification theo Role - ban bo sung theo current repo

## 1. Muc dich

Tai lieu nay dung de hop nhat:

- Noi dung nghiep vu trong ban mo ta goc
- Cac diem da xac minh duoc tu current repo `KidzgoCentre`

Luu y quan trong:

- Workspace hien tai chi co frontend/proxy route `KidzgoCentre`.
- Khong co backend source `Kidzgo.API`, `Kidzgo.Application`, `Kidzgo.Domain`, `Kidzgo.Infrastructure` trong repo nay.
- Vi vay:
  - Cac rule nghiep vu goc duoi day duoc giu lai nhu tai lieu nguon
  - Cac dong co prefix `Bo sung current frontend:` la nhung diem da xac minh truc tiep tu code hien tai trong repo
  - Cac muc lien quan handler/job/domain backend van duoc xem la "can re-check backend that" neu muon chot 100%

Nguon doi chieu current repo:

- `types/gamification/index.ts`
- `lib/api/gamificationService.ts`
- `components/gamification/staff-gamification-workspace.tsx`
- `components/gamification/learner-gamification-workspace.tsx`
- `types/teacher/homework.ts`
- `lib/api/homeworkService.ts`
- `app/api/gamification/[[...slug]]/route.ts`
- `app/api/missions/[[...slug]]/route.ts`
- `app/api/homework/[id]/link-mission/route.ts`
- `app/api/homework/[id]/reward-stars/route.ts`
- `app/api/homework/route.ts`
- `app/api/homework/multiple-choice/route.ts`
- `components/portal/menu/student.ts`

## 2. Tong quan mo hinh du lieu

### 2.1. Mission

Entity `Mission` theo tai lieu goc gom:

- `Id`
- `Title`
- `Description`
- `Scope`: `Class`, `Student`, `Group`
- `TargetClassId`
- `TargetStudentId`
- `TargetGroup`: danh sach `StudentProfileId`
- `MissionType`: `HomeworkStreak`, `ReadingStreak`, `NoUnexcusedAbsence`, `Custom`
- `StartAt`
- `EndAt`
- `RewardStars`
- `RewardExp`
- `TotalRequired`
- `CreatedBy`
- `CreatedAt`

Ghi chu goc:

- `TargetStudentId` chi dung cho `Scope = Student`.
- `TotalRequired` dang la target value cho cac mission dang streak/so lan.
- Mission hien tai khong co status enum rieng.

Bo sung current frontend:

- Type `Mission` tren frontend hien expose:
  - `id`
  - `title`
  - `description`
  - `scope`
  - `targetClassId`
  - `targetClassCode`
  - `targetClassTitle`
  - `targetGroup`
  - `missionType`
  - `startAt`
  - `endAt`
  - `rewardStars`
  - `rewardExp`
  - `createdBy`
  - `createdByName`
  - `createdAt`
- Current frontend type chua expose:
  - `targetStudentId`
  - `totalRequired`
  - `updatedAt`
- `TargetGroup` tren frontend hien dang duoc bieu dien la `string`, chua phai danh sach typed ro rang.

### 2.2. MissionProgress

Entity `MissionProgress` theo tai lieu goc gom:

- `Id`
- `MissionId`
- `StudentProfileId`
- `Status`: `Assigned`, `InProgress`, `Completed`, `Expired`
- `ProgressValue`
- `CompletedAt`
- `VerifiedBy`

Ghi chu:

- Mission progress duoc auto tao khi tao mission.
- Chua co public API de edit progress thu cong.

Bo sung current frontend:

- Frontend type con expose them:
  - `studentName`
  - `progressPercentage`
  - `verifiedByName`

### 2.3. StarTransaction

Stars duoc luu theo dang ledger, khong luu balance tong truc tiep.

Field chinh:

- `StudentProfileId`
- `Amount`
- `Reason`
- `SourceType`: `Mission`, `Manual`, `Homework`, `Test`, `Adjustment`
- `SourceId`
- `BalanceAfter`
- `CreatedBy`
- `CreatedAt`

Balance hien tai luon lay tu `BalanceAfter` cua transaction moi nhat.

Bo sung current frontend:

- Frontend type con expose `createdByName`.

### 2.4. StudentLevel

XP va level duoc luu trong `StudentLevel`:

- `StudentProfileId`
- `CurrentLevel`
- `CurrentXp`
- `UpdatedAt`

Cong thuc level dang dung:

- `Level = floor(totalXp / 100) + 1`
- `0-99 XP = Level 1`
- `100-199 XP = Level 2`
- `200-299 XP = Level 3`

XP can de len level tiep theo:

- `100 - (currentXp % 100)`
- Neu chia het cho `100` thi tra `100`

### 2.5. AttendanceStreak

Moi lan check-in tao 1 record:

- `StudentProfileId`
- `AttendanceDate`
- `CurrentStreak`
- `RewardStars`
- `RewardExp`
- `CreatedAt`

### 2.6. RewardStoreItem

Field chinh:

- `Title`
- `Description`
- `ImageUrl`
- `CostStars`
- `Quantity`
- `IsActive`
- `IsDeleted`
- `CreatedAt`
- `UpdatedAt`

Delete dang la soft delete bang `IsDeleted = true`.

### 2.7. RewardRedemption

Field chinh theo tai lieu goc:

- `ItemId`
- `ItemName`
- `Quantity`
- `StudentProfileId`
- `Status`: `Requested`, `Approved`, `Delivered`, `Received`, `Cancelled`
- `HandledBy`
- `HandledAt`
- `DeliveredAt`
- `ReceivedAt`
- `CreatedAt`

`ItemName` la snapshot ten qua tai thoi diem doi qua.

Bo sung current frontend:

- Frontend type hien con expose:
  - `studentName`
  - `branchName`
  - `handledByName`
  - `starsDeducted`
  - `remainingStars`

### 2.8. GamificationSettings

Bang settings hien tai theo tai lieu goc moi quan ly reward cho check-in:

- `CheckInRewardStars`
- `CheckInRewardExp`
- `CreatedAt`
- `UpdatedAt`

Neu chua co record settings, system fallback:

- `CheckInRewardStars = 1`
- `CheckInRewardExp = 5`

Bo sung current frontend:

- Current frontend chua co typed service va chua co UI de view/update settings nay.
- Repo hien chi co catch-all proxy `/api/gamification/[[...slug]]`, nen settings co the pass-through neu goi tay.

## 3. Business rule hien tai

### 3.1. Access model

- API dung `User.Role` trong JWT de authorize.
- Cac API learner dang dung student-context qua `StudentId` trong token.
- `StudentId` thuong duoc nap sau khi chon profile student.
- Cac endpoint `me`, `check-in`, `request reward`, `confirm received` phu thuoc truc tiep vao `StudentId`.

Bo sung current frontend:

- Learner workspace thuc te dung cac endpoint:
  - `/api/gamification/stars/balance/me`
  - `/api/gamification/level/me`
  - `/api/gamification/attendance-streak/me`
  - `/api/gamification/reward-redemptions/me`
- Frontend Parent va Student cung dung cung mot learner workspace.

### 3.2. Mission

- `Scope = Class` bat buoc co `TargetClassId`.
- `Scope = Student` bat buoc co `TargetStudentId`.
- `Scope = Group` bat buoc co `TargetGroup` va danh sach khong rong.
- `EndAt` phai sau `StartAt`.
- `StartAt` va `EndAt` neu co se duoc chuyen sang UTC trong handler.
- Khi tao mission, backend auto tao `MissionProgress` cho tung hoc sinh target.

Rule target student:

- `Class`: lay hoc sinh dang `EnrollmentStatus.Active` trong lop.
- `Student`: tao progress cho 1 hoc sinh.
- `Group`: tao progress cho danh sach hoc sinh trong `TargetGroup`.

Xoa mission:

- Chi xoa duoc khi mission chua co `MissionProgress`.
- Neu da co progress thi tra `MissionInUse`.

Bo sung current frontend:

- Form staff hien cho chon `Scope = Student`, `Class`, `Group`.
- Tuy nhien UI hien tai:
  - co select lop cho `Class`
  - co text input `targetGroup` cho `Group`
  - khong co input `targetStudentId` cho `Student`
  - khong co input `totalRequired`
- Nghia la frontend chua cover day du payload nghiep vu ma tai lieu goc mo ta.

### 3.3. Mission progress

Enum co san:

- `Assigned`
- `InProgress`
- `Completed`
- `Expired`

Trang thai `Expired` da ton tai trong domain nhung hien chua thay flow public/update job ro rang de set tu dong trong cac handler da ra soat.

### 3.4. Homework va Mission

Mission co the duoc gan vao homework theo 3 cach theo tai lieu goc:

- Gan ngay luc tao homework thuong
- Gan luc tao homework multiple choice
- Dung endpoint `POST /api/homework/{id}/link-mission`

Auto tracking dang co theo tai lieu goc:

- `HomeworkStreak`
- `NoUnexcusedAbsence`

Hien chua thay implementation auto tracking cho:

- `ReadingStreak`
- `Custom`

Bo sung current frontend:

- `missionId` dang co trong current type `CreateHomeworkPayload`.
- Current repo co service tao:
  - homework thuong
  - homework multiple choice
- Current repo co proxy:
  - `POST /api/homework/{id}/link-mission`
- Current repo co them proxy:
  - `PUT /api/homework/{id}/reward-stars`
- Chua thay route/service/UI cho:
  - `POST /api/homework/multiple-choice/from-bank`

### 3.5. Stars

- Stars luu theo ledger trong `StarTransactions`.
- `AddStars` tao transaction moi voi `Amount > 0`, `SourceType = Manual`.
- `DeductStars` tao transaction moi voi `Amount < 0`, `SourceType = Adjustment`.
- `DeductStars` se chan neu balance hien tai khong du.
- `GetStarBalance` va `GetMyStarBalance` lay balance tu transaction moi nhat.

### 3.6. XP / Level

- `AddXp` se tao hoac cap nhat `StudentLevel`.
- `DeductXp` khong cho XP am, gia tri toi thieu la `0`.
- Level duoc tinh lai moi lan add/deduct XP.

### 3.7. Attendance streak

- Moi hoc sinh chi check-in 1 lan/ngay theo `UTC date`.
- Neu hom nay da check-in roi, API tra lai record cu va `IsNewStreak = false`.
- Neu hom qua co check-in, `CurrentStreak = streak hom qua + 1`.
- Neu hom qua khong co check-in, streak reset ve `1`.
- Moi lan check-in moi nhan reward theo `GamificationSettings`.
- `GetAttendanceStreak` va `GetMyAttendanceStreak` tra:
  - `CurrentStreak`
  - `MaxStreak`
  - `LastAttendanceDate`
  - `RecentStreaks` toi da 30 ban ghi gan nhat

### 3.8. Reward store

- `CostStars` phai `> 0`
- `Quantity` phai `>= 0`
- Delete la soft delete
- Toggle status chi dao `IsActive`
- API active items cho learner chi loc `IsActive = true`, van bo qua item soft-deleted

Bo sung current frontend:

- Admin va ManagementStaff moi co UI CRUD reward store.
- Teacher co staff workspace nhung khong co tab reward store.

### 3.9. Reward redemption

Khi learner request doi qua:

- Xac thuc student profile trong token
- Item phai ton tai va khong bi soft delete
- Item phai `IsActive = true`
- `Quantity` request phai `> 0`
- Ton kho phai du
- Student phai du stars
- He thong tru stars ngay
- He thong giam ton kho ngay
- Tao `RewardRedemption` voi status `Requested`
- Snapshot `ItemName` tai thoi diem doi qua

Khi staff cancel:

- Chi cancel duoc tu `Requested` hoac `Approved`
- He thong hoan ton kho
- He thong refund stars
- Cap nhat redemption thanh `Cancelled`

Khi staff approve:

- Chi cho `Requested -> Approved`

Khi staff mark delivered:

- Chi cho `Approved -> Delivered`

Khi learner confirm received:

- Chi cho hoc sinh so huu redemption do
- Chi cho `Delivered -> Received`

Auto confirm:

- Quartz job `AutoConfirmRewardRedemptionJob`
- Quet redemption `Delivered` ma chua `Received`
- Neu `DeliveredAt` da qua N ngay thi auto set `Received`
- So ngay cho duoc doc tu `Quartz:Schedules:AutoConfirmRewardRedemptionJob_Days`
- Fallback hien tai la `3` ngay

Bo sung current frontend:

- Current frontend support gui optional `reason` khi cancel.
- Current frontend support batch deliver voi query `year`, `month`.
- Staff detail/list dang hien thi them `branchName`.
- Learner lich su redemption dang hien `starsDeducted`.

### 3.10. Gamification settings

- `GET /api/gamification/settings` tra settings hien tai
- `PUT /api/gamification/settings` cap nhat reward cho daily check-in
- Neu chua co row settings, update API se tao moi row dau tien voi `Id = 1`

Bo sung current frontend:

- Chua thay constants/service/UI su dung settings.
- Neu can frontend support, can bo sung:
  - endpoint constants
  - service get/update settings
  - page/tab cho Admin va ManagementStaff

## 4. Role va pham vi du lieu

| Role / Context | Data scope thuc te | Ghi chu |
|---|---|---|
| `Admin` | all | current frontend co page `/portal/admin/gamification` |
| `ManagementStaff` | all | current frontend co page `/portal/staff-management/gamification` |
| `Teacher` | all tren cac API duoc mo | current frontend co page `/portal/teacher/gamification`; UI khong co reward store, khong delete mission |
| `Parent` co `StudentId` | own student context | current frontend co page `/portal/parent/gamification` |
| `Student` co `StudentId` | own | current frontend co page `/portal/student/gamification` va `/portal/student/rewards` |
| `TeachingAssistant` | rat han che | current repo nay khong thay gamification workspace rieng |

Luu y quan trong:

- Mot so API learner hien khong check role rieng tai action, ma dua vao authenticated + `StudentId`.
- `GET /api/missions`, `GET /api/missions/{id}`, `GET /api/missions/{id}/progress` hien chua thay ownership filter trong handler theo tai lieu goc.
- `GET /api/gamification/reward-redemptions/{id}` hien la authenticated-only, chua co check ownership trong handler theo tai lieu goc.

Bo sung current frontend:

- Student menu dang tro den cac route gamification:
  - `/missions`
  - `/streak`
  - `/stars`
  - `/xp`
  - `/level`
  - `/rewards`
- Nhung current repo hien chi thay page learner cho:
  - `/gamification`
  - `/rewards`
- Cac route con lai chua thay page rieng trong repo.

## 5. Permission matrix

Tai lieu goc van hop le de giu lam reference backend.

Bo sung current frontend capability:

- `Admin` va `ManagementStaff`:
  - co full staff workspace
  - co reward store tab
  - co redemption actions
- `Teacher`:
  - co mission tab
  - co sao / XP tab
  - co redemption list/detail
  - khong co reward store tab
  - khong delete mission
  - khong co redemption action approve/cancel/deliver trong UI
- `Parent` va `Student`:
  - dung learner workspace
  - check-in
  - xem reward store active
  - request redemption
  - confirm received
  - xem mission progress qua `GET /missions` + `GET /missions/{id}/progress`

## 6. Status va state transition

### 6.1. MissionProgressStatus

| Status | Y nghia |
|---|---|
| `Assigned` | da duoc giao cho hoc sinh |
| `InProgress` | hoc sinh da bat dau tich luy tien do |
| `Completed` | da dat muc tieu `TotalRequired` hoac logic tuong ung |
| `Expired` | co enum trong domain, nhung chua thay flow public/update tu dong ro rang |

### 6.2. RedemptionStatus

| Status | Y nghia |
|---|---|
| `Requested` | learner vua doi qua, da bi tru stars va giu ton |
| `Approved` | staff da duyet |
| `Delivered` | staff da giao qua |
| `Received` | learner hoac system da xac nhan nhan qua |
| `Cancelled` | request bi huy, da refund stars va hoan ton |

### 6.3. State transition dang implement

| Tu | Sang | Trigger |
|---|---|---|
| `Requested` | `Approved` | approve API |
| `Requested` | `Cancelled` | cancel API |
| `Approved` | `Cancelled` | cancel API |
| `Approved` | `Delivered` | mark-delivered API |
| `Delivered` | `Received` | confirm-received API |
| `Delivered` | `Received` | auto-confirm Quartz job |

## 7. Danh sach API hien tai

### 7.1. Missions

| Method | Route | Ghi chu current repo |
|---|---|---|
| `POST` | `/api/missions` | co proxy + service |
| `GET` | `/api/missions` | co proxy + service; learner dang goi route nay |
| `GET` | `/api/missions/{id}` | co proxy |
| `PUT` | `/api/missions/{id}` | co proxy + service |
| `DELETE` | `/api/missions/{id}` | co proxy + service |
| `GET` | `/api/missions/{id}/progress` | co proxy + service |
| `GET` | `/api/missions/me/progress` | tai lieu goc co, nhung current frontend chua thay service/UI goi |

Filter/query hien co cho mission list theo tai lieu goc:

- `scope`
- `targetClassId`
- `targetStudentId`
- `missionType`
- `searchTerm`
- `pageNumber`
- `pageSize`

Bo sung current frontend:

- `MissionListParams` tren frontend hien co:
  - `scope`
  - `targetClassId`
  - `targetGroup`
  - `missionType`
  - `searchTerm`
  - `pageNumber`
  - `pageSize`
- Chua thay `targetStudentId` trong current frontend type.

### 7.2. Stars va XP

| Method | Route | Ghi chu current repo |
|---|---|---|
| `POST` | `/api/gamification/stars/add` | co service |
| `POST` | `/api/gamification/stars/deduct` | co service |
| `POST` | `/api/gamification/xp/add` | co service |
| `POST` | `/api/gamification/xp/deduct` | co service |
| `GET` | `/api/gamification/stars/transactions` | co service |
| `GET` | `/api/gamification/stars/balance` | co service |
| `GET` | `/api/gamification/level` | co service |
| `GET` | `/api/gamification/stars/balance/me` | co service |
| `GET` | `/api/gamification/level/me` | co service |

### 7.3. Attendance streak

| Method | Route | Ghi chu current repo |
|---|---|---|
| `GET` | `/api/gamification/attendance-streak` | co service |
| `POST` | `/api/gamification/attendance-streak/check-in` | co service |
| `GET` | `/api/gamification/attendance-streak/me` | co service |

### 7.4. Reward store

| Method | Route | Ghi chu current repo |
|---|---|---|
| `POST` | `/api/gamification/reward-store/items` | co service |
| `GET` | `/api/gamification/reward-store/items` | co service |
| `GET` | `/api/gamification/reward-store/items/{id}` | co service |
| `GET` | `/api/gamification/reward-store/items/active` | co service |
| `PUT` | `/api/gamification/reward-store/items/{id}` | co service |
| `DELETE` | `/api/gamification/reward-store/items/{id}` | co service |
| `PATCH` | `/api/gamification/reward-store/items/{id}/toggle-status` | co service |

### 7.5. Reward redemption

| Method | Route | Ghi chu current repo |
|---|---|---|
| `POST` | `/api/gamification/reward-redemptions` | co service |
| `GET` | `/api/gamification/reward-redemptions` | co service |
| `GET` | `/api/gamification/reward-redemptions/export-delivered` | endpoint export Excel cho redemption da giao (bao gom `Delivered` va `Received`), phuc vu staff/admin tong hop danh sach mua qua |
| `GET` | `/api/gamification/reward-redemptions/{id}` | co service |
| `GET` | `/api/gamification/reward-redemptions/me` | co service |
| `PATCH` | `/api/gamification/reward-redemptions/{id}/approve` | co service |
| `PATCH` | `/api/gamification/reward-redemptions/{id}/cancel` | co service, co the gui `{ reason }` |
| `PATCH` | `/api/gamification/reward-redemptions/{id}/mark-delivered` | co service |
| `PATCH` | `/api/gamification/reward-redemptions/{id}/confirm-received` | co service |
| `PATCH` | `/api/gamification/reward-redemptions/batch-deliver` | co service, ho tro query `year`, `month` |

### 7.6. Settings

| Method | Route | Ghi chu current repo |
|---|---|---|
| `GET` | `/api/gamification/settings` | co the pass-through qua catch-all proxy, chua co service typed |
| `PUT` | `/api/gamification/settings` | co the pass-through qua catch-all proxy, chua co service typed |

### 7.7. Homework lien quan Mission

| Method | Route | Ghi chu current repo |
|---|---|---|
| `POST` | `/api/homework` | co route + service; payload co `missionId` |
| `POST` | `/api/homework/multiple-choice` | co route + service; payload co `missionId` |
| `POST` | `/api/homework/multiple-choice/from-bank` | tai lieu goc co, nhung current repo chua thay route/service/UI |
| `PUT` | `/api/homework/{id}` | co route |
| `POST` | `/api/homework/{id}/link-mission` | co route + service |
| `PUT` | `/api/homework/{id}/reward-stars` | co route, chua thay service/UI su dung |

## 8. Response va status code

### 8.1. Success shape

He thong dang dung wrapper ket qua chung:

```json
{
  "isSuccess": true,
  "data": {}
}
```

### 8.2. Error shape

Loi thuong tra ve theo `ProblemDetails`, vi du:

```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation.General",
  "status": 400,
  "detail": "One or more validation errors occurred",
  "errors": []
}
```

### 8.3. HTTP status code thuong gap

| Code | Y nghia |
|---|---|
| `400` | validation / transition khong hop le |
| `401` | thieu token / token sai |
| `403` | sai role |
| `404` | khong tim thay, hoac learner khong so huu resource va bi che bang not found |
| `409` | conflict du lieu |
| `500` | loi he thong |

## 9. Cac diem can luu y khi tich hop Frontend

### 9.1. Mission

- Frontend nen hien thi `TotalRequired` cho cac mission streak vi backend dang dung field nay de tinh complete.
- Khong nen gia dinh moi mission type deu tu dong tang progress. Hien moi chac chan co `HomeworkStreak` va `NoUnexcusedAbsence`.

Bo sung current frontend:

- Current frontend chua expose `TotalRequired`, nen UI hien tai chua the hien target streak dung nghiep vu.
- Current frontend chua expose `TargetStudentId`, nen mission scope Student chua duoc support day du.

### 9.2. Reward redemption

- Request doi qua se tru stars ngay, khong doi staff approve moi tru.
- Cancel boi staff se refund stars va tra lai quantity.
- Learner co the thay redemption detail theo id, nhung hien backend chua check ownership trong handler. Neu day la man learner, frontend nen goi uu tien `/me`.
- Staff/admin co API export file Excel tu danh sach redemption da giao de xu ly quy trinh mua qua theo thang.
- API export: `GET /api/gamification/reward-redemptions/export-delivered?year=&month=&branchId=&itemId=`. Neu khong gui `year/month`, backend mac dinh thang hien tai.

Bo sung current frontend:

- Current learner workspace dang goi `/me` cho danh sach reward redemption, day la huong an toan hon cho learner list.
- Current frontend da san sang hien `starsDeducted`, `remainingStars`, `branchName`.

### 9.3. Attendance

- Check-in dung ngay UTC, khong phai local branch time.
- Neu UI tinh streak theo gio dia phuong thi can canh bao sai lech quanh moc `00:00 UTC`.

### 9.4. Balance va level

- Neu hoc sinh chua co transaction stars thi balance = `0`.
- Neu hoc sinh chua co `StudentLevel` thi level duoc tinh on-the-fly tu XP = `0`, tuc `Level 1`.

### 9.5. Settings

- Neu muon mo man hinh cau hinh reward check-in, current frontend can duoc bo sung service va UI rieng.

### 9.6. Learner routing

- Student menu hien dang tro toi nhieu route gamification con thieu page rieng.
- Neu khong tao them page, nen doi ve cung tro toi `/gamification` voi tab param hoac bo submenu chua co page.

## 10. Known gaps / implementation notes

Theo tai lieu goc:

- `ReadingStreak` co enum nhung chua thay logic auto-track trong code da ra soat.
- `Custom` mission type chua thay generic executor rieng.
- `MissionProgressStatus.Expired` co enum nhung chua thay job/handler public cap nhat ro rang.
- `GET /api/missions*` hien chua thay ownership filter trong handler.
- `GET /api/gamification/reward-redemptions/{id}` hien chua check ownership trong handler.
- `GetMissionProgress` hien tinh `ProgressPercentage` bang cach clamp `ProgressValue` ve `0..100`, khong dua tren `TotalRequired`.
- `GetMyMissions` lai tinh `ProgressPercentage` dua tren `TotalRequired` neu field nay co gia tri.
- `GetMissions` co field query `TargetGroup` trong object query nhung controller va handler hien chua dung de filter.

Bo sung current frontend:

- Frontend mission form chua cover `targetStudentId`.
- Frontend mission form chua cover `totalRequired`.
- Frontend `targetGroup` dang la string, chua co multi-select hoc sinh.
- Frontend learner chua dung `/api/missions/me/progress`.
- Frontend chua co typed support cho `/api/gamification/settings`.
- Current repo co them proxy `PUT /api/homework/{id}/reward-stars`.
- Current repo chua thay `POST /api/homework/multiple-choice/from-bank`.
- Student menu dang tro toi `/missions`, `/streak`, `/stars`, `/xp`, `/level` nhung chua thay page rieng.

## 11. Ket luan

Tinh den current repo `KidzgoCentre`, nhom chuc nang gamification duoc xac nhan tren frontend/proxy gom:

- Mission list/detail/progress va staff CRUD co ban
- Cong/tru stars
- Cong/tru XP va xem level
- Daily check-in va xem attendance streak
- Reward store
- Reward redemption day du status flow
- Homework co `missionId` va route link mission

Tuy nhien, de tai lieu sat voi code hien tai hon, can bo sung ro cac diem sau:

- current frontend contract cua mission chua du cac field nghiep vu backend mo ta
- current frontend learner chua dung `me/progress`
- current frontend co them shape/params cho reward redemption
- current frontend chua wire settings
- current frontend co them route `reward-stars`
- current frontend chua co route `multiple-choice/from-bank`
- current frontend learner routing cho gamification chua dong bo voi menu

## 12. File audit lien quan

De doi chieu nhanh cac diem lech voi current repo, xem them:

- `docs/gamification-role-current-code-audit.md`

## 13. So sanh voi code cu

Moc "code cu" duoc chon de doi chieu trong repo nay:

- commit `f1474f8` - `finish gamification`

Nhan xet tong quan:

- Tu commit `f1474f8` den `HEAD` hien tai, khong thay diff tren cac file frontend core gamification sau:
  - `types/gamification/index.ts`
  - `lib/api/gamificationService.ts`
  - `components/gamification/staff-gamification-workspace.tsx`
  - `components/gamification/learner-gamification-workspace.tsx`
  - `components/portal/menu/student.ts`
- Nghia la:
  - cac gap da neu trong tai lieu nay, nhu `Mission` chua expose `targetStudentId`, `totalRequired`
  - learner chua dung `/api/missions/me/progress`
  - settings chua co service/UI rieng
  - student submenu gamification chua khop page that
  - reward redemption shape frontend co cac field bo sung
  deu khong phai thay doi moi so voi code cu gan nhat trong repo, ma da ton tai tu giai doan `finish gamification`

Thay doi thuc te thay duoc so voi code cu:

- Co 1 thay doi tren `lib/api/homeworkService.ts`
- Commit lien quan:
  - `82650ce` - `feat: import question from excel`
- Noi dung diff thuc te thay duoc:
  - cap nhat cach format `dueAt` trong `mapSubmissionToUi`
  - xu ly parse chuoi datetime theo logic Vietnam time ro hon
  - day la thay doi phia homework display/formatting, khong thay rule gamification moi

Ket luan khi so voi code cu:

- Neu muc tieu la cap nhat tai lieu cho "current code", phan lon noi dung bo sung trong doc nay la de lam ro:
  - current frontend contract dang thuc su nhu the nao
  - nhung gi chua duoc wire o frontend
  - nhung gap nao da ton tai tu code cu
- Khong thay dau hieu current repo vua thay doi lon logic gamification frontend sau moc `finish gamification`.

## 14. So sanh voi doc moi va cach doc tai lieu nay

Tai lieu hop nhat nay da bo sung them 2 lop thong tin so voi ban mo ta goc:

1. Lop "Bo sung current frontend"

- Dung de ghi ro nhung gi current repo `KidzgoCentre` dang co that
- Vi du:
  - field frontend mission/reward redemption
  - service/API proxy dang ton tai
  - route/page/menu dang ton tai hay chua ton tai

2. Lop "So sanh voi code cu"

- Dung de phan biet:
  - dau la gap da co san tu truoc
  - dau la thay doi moi thuc su trong repo

Cach doc khuyen nghi:

- Neu can nghiep vu backend: uu tien noi dung goc o cac muc business rule va API.
- Neu can tich hop frontend theo current repo: uu tien cac dong `Bo sung current frontend`.
- Neu can biet cai nao moi phat sinh sau gan day: xem muc `So sanh voi code cu`.
