# Lesson Plan Admin Manual + Import Optimization (2026-04-24)

## 1) Muc tieu
Toi uu luong setup lesson plan cho Admin/Staff theo 2 cach:
- Tao thu cong (manual builder)
- Import Excel/CSV

Dam bao Teacher chi duoc cap nhat cac cot duoc phep sau buoi hoc.

## 2) Pham vi quyen
### Admin/Staff
- Setup syllabus truoc buoi hoc (manual hoac import).
- Quan ly `lesson_plan_templates` theo `Program + SessionIndex`.
- Chinh sua template va map vao buoi hoc theo contract backend.

### Teacher
Teacher chi duoc cap nhat cac truong noi dung sau buoi hoc:
- Content:
  - `classwork`
  - `requiredMaterials`
- Homework:
  - `homeworkRequiredMaterials`
  - `extra` / `note`

Teacher khong duoc sua cac cot setup boi Admin (time, book, skills, metadata, etc.).

## 3) Toi uu da ap dung (Frontend)
### 3.1 Manual creation
- Chan trung `Program + SessionIndex` ngay tren form tao/sua template.
- Neu trung, hien thi loi ro rang va yeu cau doi session index hoac cap nhat template cu.

### 3.2 Import
- Validate som dinh dang file: chi cho `.xlsx`, `.xls`, `.csv`.
- CSV bat buoc chon Program de map dung template.
- Them checklist truoc import trong UI de giam retry.
- Nang cap parse loi import: uu tien show loi theo row neu backend tra ve `errors[]`.

### 3.3 Teacher edit lock
- O che do structured lesson plan, teacher chi duoc sua dung cac cot duoc phep:
  - `classwork`
  - `requiredMaterials`
  - `homeworkRequiredMaterials`
  - `extra`
- Homework block cho teacher sua:
  - Required materials
  - Extra / Note
- Cac cot con lai hien thi read-only.

## 4) Quy trinh van hanh khuyen nghi
1. Admin setup template theo Program + SessionIndex (manual hoac import).
2. Kiem tra template da map dung session truoc khi buoi hoc dien ra.
3. Teacher vao buoi hoc va chi dien noi dung duoc phep sau buoi hoc.
4. Quan ly review nhanh theo class syllabus board.

## 5) Checklist UAT
- Tao thu cong template trung Program + SessionIndex -> bi chan.
- Import file sai dinh dang -> bi chan.
- Import CSV khong chon Program -> bi chan.
- Teacher o structured editor khong the sua time/book/skills.
- Teacher sua duoc classwork/required materials/homework required materials/extra note.
- Save thanh cong va du lieu hien thi dung tren syllabus view.
