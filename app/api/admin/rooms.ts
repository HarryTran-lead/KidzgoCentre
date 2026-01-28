/**
 * Admin Rooms API Helpers
 * Fetch classroom list for admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type { Room, Status } from "@/types/admin/rooms";

function mapApiRoom(item: any, index: number): Room {
  const id = String(item?.name ?? item?.id ?? `ROOM-${index + 1}`);
  const capacity = item?.capacity ?? 0;
  const note = (item?.note as string | undefined) ?? "";

  // Placeholder values if backend doesn't provide
  const floor = typeof item?.floor === "number" ? item.floor : 1;
  const area = typeof item?.area === "number" ? item.area : 30;

  const equipment: string[] = note ? [note] : ["Bàn ghế", "Máy lạnh", "Bảng viết"];

  const status: Status = item?.isActive === false ? "maintenance" : "free";

  return {
    id,
    floor,
    area,
    capacity,
    equipment,
    utilization: 0,
    status,
  };
}

export async function fetchAdminRooms(): Promise<Room[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách phòng học.");
  }

  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "100",
  });

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
