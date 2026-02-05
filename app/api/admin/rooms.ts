/**
 * Admin Rooms API Helpers
 * Fetch classroom list for admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type { Room, Status, CreateRoomRequest, CreateRoomResponse } from "@/types/admin/rooms";

function mapApiRoom(item: any, index: number): Room {
  const id = String(item?.id ?? `ROOM-${index + 1}`);
  const name = String(item?.name ?? `Phòng ${index + 1}`);
  const branchId = item?.branchId ? String(item.branchId) : undefined;
  const branch = String(item?.branchName ?? item?.branch?.name ?? "").trim() || "Chưa có chi nhánh";
  const capacity = item?.capacity ?? 0;
  const note = (item?.note as string | undefined) ?? "";

  // Placeholder values if backend doesn't provide
  const floor = typeof item?.floor === "number" ? item.floor : 1;
  const area = typeof item?.area === "number" ? item.area : 30;

  const equipment: string[] = note ? [note] : ["Bàn ghế", "Máy lạnh", "Bảng viết"];

  const status: Status = item?.isActive === false ? "maintenance" : "free";

  return {
    id,
    name,
    branchId,
    branch,
    floor,
    area,
    capacity,
    equipment,
    utilization: 0,
    status,
  };
}

export async function fetchAdminRooms(options?: { branchId?: string }): Promise<Room[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách phòng học.");
  }

  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "100",
  });

  // Thêm branchId vào query params nếu có
  if (options?.branchId) {
    params.append("branchId", options.branchId);
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.CLASSROOMS}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch admin classrooms error:", res.status, text);
    throw new Error("Không thể tải danh sách phòng học từ máy chủ.");
  }

  const json: any = await res.json();

  let items: any[] = [];
  if (Array.isArray(json?.data?.classrooms?.items)) {
    items = json.data.classrooms.items;
  } else if (Array.isArray(json?.data?.items)) {
    items = json.data.items;
  } else if (Array.isArray(json?.data)) {
    items = json.data;
  } else if (Array.isArray(json)) {
    items = json;
  }

  return items.map(mapApiRoom).filter((r: Room) => r.id);
}

export async function createAdminRoom(
  payload: CreateRoomRequest
): Promise<CreateRoomResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để tạo phòng học.");
  }

  const res = await fetch(ADMIN_ENDPOINTS.CLASSROOMS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const detail = json?.detail || json?.message || json?.error;
    const title = json?.title;
    
    let msg = "Không thể tạo phòng học từ máy chủ.";
    if (detail) {
      msg = detail;
    } else if (title) {
      msg = title;
    } else if (typeof text === "string" && text.trim()) {
      msg = text;
    }
    
    throw new Error(msg);
  }

  const data = json?.data ?? json?.classroom ?? json;
  const roomData: CreateRoomResponse = {
    id: String(data?.id ?? ""),
    branchId: data?.branchId ?? payload.branchId ?? "",
    name: data?.name ?? payload.name ?? "",
    capacity: typeof data?.capacity === "number" ? data.capacity : payload.capacity ?? 0,
    note: data?.note ?? payload.note ?? undefined,
    isActive: data?.isActive ?? true,
  };

  if (!roomData.id) {
    roomData.id = `ROOM-${Date.now()}`;
  }

  return roomData;
}

export async function updateAdminRoom(
  roomId: string,
  payload: CreateRoomRequest
): Promise<CreateRoomResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để cập nhật phòng học.");
  }

  const res = await fetch(`${ADMIN_ENDPOINTS.CLASSROOMS}/${roomId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const detail = json?.detail || json?.message || json?.error;
    const title = json?.title;

    let msg = "Không thể cập nhật phòng học từ máy chủ.";
    if (detail) {
      msg = detail;
    } else if (title) {
      msg = title;
    } else if (typeof text === "string" && text.trim()) {
      msg = text;
    }

    throw new Error(msg);
  }

  const data = json?.data ?? json?.classroom ?? json;
  const roomData: CreateRoomResponse = {
    id: String(data?.id ?? roomId),
    branchId: data?.branchId ?? payload.branchId ?? "",
    name: data?.name ?? payload.name ?? "",
    capacity: typeof data?.capacity === "number" ? data.capacity : payload.capacity ?? 0,
    note: data?.note ?? payload.note ?? undefined,
    isActive: data?.isActive ?? true,
  };

  if (!roomData.id) {
    roomData.id = `ROOM-${Date.now()}`;
  }

  return roomData;
}
