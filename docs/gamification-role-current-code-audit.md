# Gamification theo role - audit theo current code trong repo

## 1. Pham vi check

Audit nay duoc doi chieu theo code hien co trong workspace `KidzgoCentre`.

Nguon check truc tiep:

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
- `app/[locale]/portal/admin/gamification/page.tsx`
- `app/[locale]/portal/staff-management/gamification/page.tsx`
- `app/[locale]/portal/teacher/gamification/page.tsx`
- `app/[locale]/portal/student/gamification/page.tsx`
- `app/[locale]/portal/student/rewards/page.tsx`
- `app/[locale]/portal/parent/gamification/page.tsx`

Luu y quan trong:

- Backend source duoc nhac trong tai lieu goc (`Kidzgo.API`, `Kidzgo.Application`, `Kidzgo.Domain`, `Kidzgo.Infrastructure`) khong co trong workspace nay.
- Vi vay, cac diem ben duoi la "xac minh theo current frontend contract + proxy route + UI hien tai", khong phai backend audit 100%.
- Cac rule backend sau day chua the re-check tu repo nay: auto tracking chi tiet, fallback settings, Quartz job, ownership filter trong handler, cong thuc progress percentage trong handler.

## 2. Nhung diem van khop voi tai lieu goc

- Frontend hien tai van proxy dung nhom endpoint `/api/missions`, `/api/gamification`, `/api/homework`, `/api/homework/multiple-choice`, `/api/homework/{id}/link-mission`.
- Staff workspace ton tai cho `Admin`, `ManagementStaff`, `Teacher`.
- Learner workspace ton tai cho `Student` va `Parent`.
- Luong learner van dung cac endpoint `/me` cho sao, level, attendance streak, reward redemptions.
- Reward store active van duoc learner lay qua `/api/gamification/reward-store/items/active`.
- Reward redemption van co cac hanh dong approve, cancel, mark delivered, confirm received, batch deliver.
- Homework tao moi va homework multiple choice deu co `missionId` trong payload frontend.

## 3. Diem khac hoac can bo sung so voi tai lieu goc

### 3.1. Mission model tren current frontend khong day du nhu tai lieu goc

Trong `types/gamification/index.ts`, `Mission` hien chi expose:

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

Chua thay tren current frontend type:

- `targetStudentId`
- `totalRequired`
- `updatedAt`

He qua thuc te tren UI:

- Form tao/sua mission trong `components/gamification/staff-gamification-workspace.tsx` khong co input `targetStudentId`.
- Form tao/sua mission khong co input `totalRequired`.
- `scope = Student` dang ton tai trong select, nhung UI hien khong cho chon hoc sinh muc tieu.

De bo sung vao tai lieu:

- "Current frontend contract chua expose `TargetStudentId` va `TotalRequired`, nen UI hien tai chua ho tro day du mission scope Student va mission target theo so lan/streak."

### 3.2. `TargetGroup` tren frontend dang la `string`, khong phai danh sach ro rang

Tai lieu goc mo ta `TargetGroup` la danh sach `StudentProfileId`.
Nhung current frontend type dang de:

- `targetGroup?: string | null` trong `Mission`
- `targetGroup?: string` trong `MissionListParams`
- `targetGroup?: string` trong `UpsertMissionRequest`

UI staff hien cung chi cho nhap mot o text thuong cho `targetGroup`, chua co multi-select hoc sinh.

De bo sung vao tai lieu:

- "Current frontend dang bieu dien `TargetGroup` nhu mot string, chua co UI chon nhieu hoc sinh va chua ro format backend mong muon."

### 3.3. Frontend learner dang dung `/api/missions`, chua dung `/api/missions/me/progress`

Tai lieu goc co liet ke endpoint:

- `GET /api/missions/me/progress`

Nhung current frontend service khong co helper nao cho endpoint nay.
Learner workspace hien dang:

- goi `listMissions({ pageNumber: 1, pageSize: 50 })`
- sau do mo progress bang `getMissionProgress(missionId, { studentProfileId })`

De bo sung vao tai lieu:

- "Current frontend learner chua goi `GET /api/missions/me/progress`; UI dang phu thuoc vao `GET /api/missions` va filter/ownership cua backend."

### 3.4. Reward redemption shape tren current frontend co them field moi

Trong `types/gamification/index.ts`, `RewardRedemption` hien con co them:

- `branchName`
- `handledByName`
- `starsDeducted`
- `remainingStars`

UI hien dang dung:

- `branchName` trong staff list/detail
- `starsDeducted` trong learner lich su doi thuong

De bo sung vao tai lieu:

- "Response reward redemption hien tai co them `branchName`, `handledByName`, `starsDeducted`, `remainingStars` tren current frontend contract."

### 3.5. Cancel redemption tren frontend dang gui optional `reason`

Current frontend co:

- `RewardRedemptionCancelRequest { reason?: string }`
- Staff UI prompt ly do huy roi gui vao `/cancel`

De bo sung vao tai lieu:

- "Patch cancel redemption tren current frontend co the gui body `{ reason }`."

### 3.6. Batch deliver tren frontend dang ho tro query `year`, `month`

Current frontend type:

- `BatchDeliverParams { year?: number; month?: number }`

Staff UI co 2 o nhap `year` va `month`, roi goi:

- `PATCH /api/gamification/reward-redemptions/batch-deliver?year=...&month=...`

De bo sung vao tai lieu:

- "Batch deliver tren current frontend da ho tro filter theo `year` va `month`."

### 3.7. Gamification settings chua duoc wire vao current frontend

Tai lieu goc co:

- `GET /api/gamification/settings`
- `PUT /api/gamification/settings`

Trong current repo:

- co catch-all proxy `/api/gamification/[[...slug]]`, nen route nay co the pass-through neu goi tay
- nhung `constants/apiURL.ts` chua define endpoint settings
- `lib/api/gamificationService.ts` chua co service get/update settings
- khong thay UI page/tab nao de xem/sua settings gamification

De bo sung vao tai lieu:

- "Current frontend chua co typed service va UI cho gamification settings; moi dung proxy catch-all."

### 3.8. Homework lien ket mission: co them 1 proxy chua duoc tai lieu goc nhac toi

Ngoai cac route da neu trong tai lieu goc, current repo con co:

- `PUT /api/homework/{id}/reward-stars`

Route nay dang proxy toi:

- `/homework/{id}/reward-stars`

Tuy nhien, chua thay UI/service dang su dung route nay trong repo.

De bo sung vao tai lieu:

- "Current frontend repo co them proxy `PUT /api/homework/{id}/reward-stars`, nhung chua thay man hinh su dung."

### 3.9. Current frontend khong thay proxy cho `POST /api/homework/multiple-choice/from-bank`

Tai lieu goc co liet ke:

- `POST /api/homework/multiple-choice/from-bank`

Nhung current repo chi thay:

- `POST /api/homework`
- `POST /api/homework/multiple-choice`
- `POST /api/homework/{id}/link-mission`

Chua thay:

- route proxy `app/api/homework/multiple-choice/from-bank/...`
- service call tuong ung
- UI call tuong ung

De bo sung vao tai lieu:

- "Current frontend repo chua thay route/service/UI cho `multiple-choice/from-bank`."

### 3.10. Student menu hien dang tro toi nhieu route gamification chua co page

Trong `components/portal/menu/student.ts`, nhom gamification dang tro toi:

- `/missions`
- `/streak`
- `/stars`
- `/xp`
- `/level`
- `/rewards`

Nhung current student pages hien chi thay:

- `app/[locale]/portal/student/gamification/page.tsx`
- `app/[locale]/portal/student/rewards/page.tsx`

Chua thay page rieng cho:

- `missions`
- `streak`
- `stars`
- `xp`
- `level`

De bo sung vao tai lieu:

- "Current frontend menu student dang expose nhieu route gamification con thieu page thuc te; hien learner workspace moi duoc mount o `/gamification` va `/rewards`."

## 4. Diem can cap nhat truc tiep trong tai lieu goc

Neu cap nhat tai lieu goc theo current repo nay, nen them mot muc "Current frontend gaps / contract mismatch" gom:

1. Frontend mission chua expose `TargetStudentId`, `TotalRequired`.
2. Frontend `TargetGroup` dang la string, chua co multi-select.
3. Learner UI chua dung `/missions/me/progress`.
4. Reward redemption response dang co them `branchName`, `handledByName`, `starsDeducted`, `remainingStars`.
5. Cancel redemption co the gui optional `reason`.
6. Batch deliver co them query `year`, `month`.
7. Chua co UI/service cho gamification settings tren frontend.
8. Co them proxy `PUT /api/homework/{id}/reward-stars`.
9. Chua thay `multiple-choice/from-bank` trong current frontend repo.
10. Student submenu gamification dang tro toi mot so route chua co page.

## 5. Muc chua the ket luan tu repo nay

Do khong co backend source trong workspace, chua the re-check chac chan cac muc sau:

- Rule business cua `MissionController` va `GamificationController`
- Auto tracking `HomeworkStreak`, `NoUnexcusedAbsence`, `ReadingStreak`, `Custom`
- Logic `ProgressPercentage`
- Ownership filter trong mission va reward redemption detail
- Fallback `GamificationSettings`
- Quartz `AutoConfirmRewardRedemptionJob`
- Rule delete mission khi co/chua co `MissionProgress`
- Rule tinh level, XP, balance tru/exact conflict handling

Neu can chot lai 100% theo backend that, can co them backend repo hoac cac file:

- `Kidzgo.API/Controllers/MissionController.cs`
- `Kidzgo.API/Controllers/GamificationController.cs`
- `Kidzgo.API/Controllers/HomeworkController.cs`
- `Kidzgo.Application/Missions/*`
- `Kidzgo.Application/Gamification/*`
- `Kidzgo.Application/Homework/SubmitHomework/SubmitHomeworkCommandHandler.cs`
- `Kidzgo.Domain/Gamification/*`
- `Kidzgo.Infrastructure/BackgroundJobs/AutoConfirmRewardRedemptionJob.cs`
