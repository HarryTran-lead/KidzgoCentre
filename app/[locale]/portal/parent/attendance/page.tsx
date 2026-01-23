"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  MessageSquare,
  Send,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  createLeaveRequest,
  getLeaveRequests,
} from "@/lib/api/leaveRequestService";
import type {
  LeaveRequestPayload,
  LeaveRequestRecord,
  LeaveRequestStatus,
} from "@/types/leaveRequest";
import type { ListData } from "@/types/apiResponse";

type FormState = LeaveRequestPayload;

const initialFormState: FormState = {
  studentProfileId: "",
  classId: "",
  sessionDate: "",
  endDate: "",
  reason: "",
};

const statusLabels: Record<LeaveRequestStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
  AUTO_APPROVED: "Auto-approve",
};

const statusStyles: Record<LeaveRequestStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  REJECTED: "bg-rose-50 text-rose-700 border border-rose-200",
  AUTO_APPROVED: "bg-sky-50 text-sky-700 border border-sky-200",
};

export default function ParentAttendancePage() {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [requests, setRequests] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      setLoadingList(true);
      setError(null);
      try {
        const response = await getLeaveRequests();
     const data = Array.isArray(response.data)
  ? response.data
  : response.data.items;

        setRequests(data ?? []);
      } catch (err) {
        console.error("Fetch leave requests error:", err);
        setError("Không thể tải danh sách đơn xin nghỉ.");
      } finally {
        setLoadingList(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  const displayRequests = useMemo(() => requests.slice(0, 5), [requests]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await createLeaveRequest(formState);
      if (response?.data) {
        setRequests((prev) => [response.data, ...prev]);
      }
      setFormState(initialFormState);
      setSuccessMessage(
        "Đã tạo đơn xin nghỉ. Hệ thống sẽ tự duyệt theo luật 24h nếu đủ điều kiện."
      );
    } catch (err) {
      console.error("Create leave request error:", err);
      setError("Tạo đơn thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 grid place-items-center">
          <CalendarCheck size={20} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Điểm danh & vắng mặt
          </h1>
          <p className="text-sm text-slate-600">
            Xác nhận vắng mặt, nhận thông báo chậm trễ và ghi chú từ giáo viên.
          </p>
        </div>
      </div>

      {/* Create leave request */}
      <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-4">
        <div>
          <div className="font-semibold text-slate-900">
            Tạo đơn xin nghỉ
          </div>
          <p className="text-sm text-slate-600">
            Đơn nghỉ 1 ngày tạo trước 24h sẽ tự động auto-approve và cấp
            MakeUpCredit.
          </p>
          <p className="text-xs text-slate-500">
            Đơn tạo sau 24h hoặc dài ngày sẽ chờ staff duyệt. Duyệt thủ công
            không tự tạo MakeUpCredit.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Student Profile ID
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              value={formState.studentProfileId}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  studentProfileId: e.target.value,
                }))
              }
              placeholder="3fa85f64-..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Class ID
            </label>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              value={formState.classId}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  classId: e.target.value,
                }))
              }
              placeholder="3fa85f64-..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Ngày nghỉ
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              value={formState.sessionDate}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  sessionDate: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Ngày kết thúc
            </label>
            <input
              type="date"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              value={formState.endDate}
              onChange={(e) =>
                setFormState((p) => ({
                  ...p,
                  endDate: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-700">
            Lý do
          </label>
          <textarea
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
            value={formState.reason}
            onChange={(e) =>
              setFormState((p) => ({ ...p, reason: e.target.value }))
            }
            placeholder="Nhập lý do..."
          />
        </div>

        {error && (
          <div className="text-sm text-rose-600 flex items-center gap-2">
            <XCircle size={16} />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="text-sm text-emerald-600 flex items-center gap-2">
            <ShieldCheck size={16} />
            {successMessage}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Send size={16} />
          {loading ? "Đang gửi..." : "Gửi đơn xin nghỉ"}
        </button>
      </div>

      {/* Today attendance */}
      <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
        <div className="font-semibold text-slate-900">Hôm nay</div>
        <div className="text-sm text-slate-600">
          Học viên đã điểm danh lúc 18:55. Không có ghi chú bất thường.
        </div>
      </div>

      {/* Recent requests */}
      <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-slate-900">
            Đơn xin nghỉ gần đây
          </div>
          {loadingList && (
            <span className="text-xs text-slate-500">Đang tải...</span>
          )}
        </div>

        {displayRequests.length === 0 ? (
          <div className="text-sm text-slate-500">
            Chưa có đơn xin nghỉ.
          </div>
        ) : (
          <div className="space-y-2">
            {displayRequests.map((request) => {
              const status = request.status ?? "PENDING";
              return (
                <div
                  key={request.id}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-800">
                      {request.studentName ??
                        request.studentProfileId}
                    </div>
                    <div className="text-xs text-slate-500">
                      {request.sessionDate} → {request.endDate}
                    </div>
                    <div className="text-xs text-slate-500">
                      Lý do: {request.reason}
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-1 ${statusStyles[status]}`}
                  >
                    {statusLabels[status]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 p-4 bg-white flex items-start gap-3">
        <MessageSquare className="text-amber-600 mt-1" size={18} />
        <div className="flex-1 text-sm text-slate-700">
          Nếu học viên vắng, hệ thống sẽ gửi tin nhắn cho phụ huynh để xác
          nhận lý do và hỗ trợ bù buổi.
        </div>
      </div>
    </div>
  );
}
