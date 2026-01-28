/**
 * Admin Programs API Helpers
 * Fetch program list for admin portal
 */

import { getAccessToken } from "@/lib/store/authToken";
import { ADMIN_ENDPOINTS } from "@/constants/apiURL";
import type { CourseRow } from "@/types/admin/programs";

function mapApiProgramToRow(item: any): CourseRow {
  const id = String(item?.code ?? item?.id ?? "");
  const name = item?.name ?? "Chương trình";
  const desc = item?.description ?? "";

  const rawLevel = String(item?.level ?? "").toUpperCase();
  const level = rawLevel || "N/A";

  const totalSessions = item?.totalSessions ?? 0;
  const duration =
    typeof totalSessions === "number" && totalSessions > 0
      ? `${totalSessions} buổi`
      : "Đang cập nhật";

  const feeNumber =
    item?.defaultTuitionAmount ??
    item?.unitPriceSession ??
    0;
  const fee =
    typeof feeNumber === "number" && feeNumber > 0
      ? `${feeNumber.toLocaleString("vi-VN")} VND`
      : "Đang cập nhật";

  const classes = "0 lớp";
  const students = "0 học viên";

  let status: CourseRow["status"] = "Tạm dừng";
  if (item?.isActive === true) status = "Đang hoạt động";

  return {
    id,
    name,
    desc,
    level,
    duration,
    fee,
    classes,
    students,
    status,
  };
}

export async function fetchAdminPrograms(): Promise<CourseRow[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("Bạn chưa đăng nhập. Vui lòng đăng nhập để xem danh sách khóa học.");
  }

  const params = new URLSearchParams({
    pageNumber: "1",
    pageSize: "100",
  });

  const res = await fetch(`${ADMIN_ENDPOINTS.PROGRAMS}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Fetch admin programs error:", res.status, text);
    throw new Error("Không thể tải danh sách khóa học từ máy chủ.");
  }

  const json: any = await res.json();

  let items: any[] = [];
  if (Array.isArray(json?.data?.programs?.items)) {
    items = json.data.programs.items;
  } else if (Array.isArray(json?.data?.items)) {
    items = json.data.items;
  } else if (Array.isArray(json?.data)) {
    items = json.data;
  } else if (Array.isArray(json)) {
    items = json;
  }

  return items.map(mapApiProgramToRow).filter((c: CourseRow) => c.id);
}
