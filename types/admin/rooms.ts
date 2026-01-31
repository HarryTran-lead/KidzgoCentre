export type Status = "using" | "free" | "maintenance";

export type Room = {
  id: string;
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