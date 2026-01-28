/**
 * Admin Classes API Helpers
 * Fetch class list for admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type { ClassRow } from "@/types/admin/classes";

function mapApiClassToRow(item: any): ClassRow {
  const id = String(item?.code ?? item?.id ?? "");
  const name = item?.title ?? "Lớp học";
  const sub = item?.programName ?? "";
  const teacher = item?.mainTeacherName ?? "Chưa phân công";
  const room = item?.roomName ?? "Chưa có phòng";
  const current = item?.currentEnrollmentCount ?? 0;
  const capacity = item?.capacity ?? 0;
  const schedulePattern = (item?.schedulePattern as string | undefined) ?? "";
  const schedule = schedulePattern.trim() || "Chưa có lịch";

  const rawStatus: string = (item?.status as string | undefined) ?? "";
  let status: ClassRow["status"] = "Sắp khai giảng";
  const normalized = rawStatus.toLowerCase();
  if (normalized === "active") status = "Đang học";
  else if (normalized === "closed") status = "Đã kết thúc";

  return {
    id,
    name,
    sub,
    teacher,
    room,
    current,
    capacity,
    schedule,
    status,
  };
}

export async function fetchAdminClasses(): Promise<ClassRow[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập lại để xem danh sách lớp.");
  }

  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "100",
  });

  const res = await fetch(`${ADMIN_ENDPOINTS.CLASSES}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch admin classes error:", res.status, text);
    throw new Error("Không thể tải danh sách lớp học từ máy chủ.");
  }

  const json: any = await res.json();

  let items: any[] = [];
  if (Array.isArray(json?.data?.classes?.items)) {
    items = json.data.classes.items;
  } else if (Array.isArray(json?.data?.items)) {
    items = json.data.items;
  } else if (Array.isArray(json?.data)) {
    items = json.data;
  } else if (Array.isArray(json)) {
    items = json;
  }

  return items.map(mapApiClassToRow).filter((c: ClassRow) => c.id);
}
