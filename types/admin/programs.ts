export type CourseRow = {
  id: string;
  name: string;
  desc: string;
  level: string;
  duration: string;
  fee: string;
  classes: string;
  students: string;
  status: "Đang hoạt động" | "Tạm dừng" | "Đã kết thúc";
};
