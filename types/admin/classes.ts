export type ClassRow = {
  id: string;
  name: string;
  sub: string;
  teacher: string;
  room: string;
  current: number;
  capacity: number;
  schedule: string;
  status: "Đang học" | "Sắp khai giảng" | "Đã kết thúc";
};
