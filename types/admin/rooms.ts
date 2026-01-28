export type Status = "using" | "free" | "maintenance";

export type Room = {
  id: string;
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
