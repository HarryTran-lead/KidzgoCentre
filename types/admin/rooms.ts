export type Status = "using" | "free" | "maintenance";

export type Room = {
  id: string;      // UUID nội bộ
  name: string;    // Tên phòng hiển thị
  branchId?: string; // Id chi nhánh (dùng cho update)
  branch: string;
  floor: number;
  area: number;
  capacity: number;
  equipment: string[];
  utilization: number;
  status: Status;
  course?: string;
  teacher?: string;
  schedule?: string;
};

export interface CreateRoomRequest {
  branchId: string;
  name: string;
  capacity: number;
  note?: string;
}

export interface CreateRoomResponse {
  id: string;
  branchId: string;
  name: string;
  capacity: number;
  note?: string;
  isActive?: boolean;
}