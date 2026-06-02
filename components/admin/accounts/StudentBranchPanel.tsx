"use client";

import { ArrowRight, Building2, CheckCircle, Clock, GitBranch, Loader2, MapPin, Plus, X, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type BranchTransferRecord,
  type BranchTransferRequest,
  type StudentBranchInfo,
  createBranchTransfer,
  getBranchTransferHistory,
  getStudentActiveBranch,
  getStudentHomeBranch,
  setStudentHomeBranch,
} from "@/lib/api/studentBranchService";
import { getAllBranches } from "@/lib/api/branchService";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

function BranchCard({ label, info, loading }: { label: string; info: StudentBranchInfo | null | undefined; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-gray-400" />
        <span className="text-sm text-gray-400">Đang tải...</span>
      </div>
    );
  }
  return (
    <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50">
      <p className="text-xs font-semibold text-blue-600 mb-2">{label}</p>
      {info ? (
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-mono text-xs font-bold">{info.branchCode}</span>
            <span className="text-sm font-semibold text-gray-900">{info.branchName}</span>
          </div>
          {info.address && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={11} />{info.address}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Chưa gán</p>
      )}
    </div>
  );
}

const TRANSFER_TYPES = ["Permanent", "Temporary"] as const;

function TransferStatusBadge({ status }: { status: BranchTransferRecord["status"] }) {
  const map: Record<BranchTransferRecord["status"], string> = {
    Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Approved: "bg-blue-100 text-blue-700 border-blue-200",
    Completed: "bg-green-100 text-green-700 border-green-200",
    Cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  };
  const labels: Record<BranchTransferRecord["status"], string> = {
    Pending: "Chờ duyệt",
    Approved: "Đã duyệt",
    Completed: "Hoàn thành",
    Cancelled: "Đã hủy",
  };
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold border", map[status])}>{labels[status]}</span>;
}

export default function StudentBranchPanel({ studentId }: { studentId: string }) {
  const [homeBranch, setHomeBranchState] = useState<StudentBranchInfo | null>(null);
  const [activeBranch, setActiveBranchState] = useState<StudentBranchInfo | null>(null);
  const [transfers, setTransfers] = useState<BranchTransferRecord[]>([]);
  const [branchOptions, setBranchOptions] = useState<{ id: string; name: string; code: string }[]>([]);
  const [infoLoading, setInfoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Change home branch
  const [showChangeHome, setShowChangeHome] = useState(false);
  const [newHomeBranchId, setNewHomeBranchId] = useState("");
  const [changingHome, setChangingHome] = useState(false);

  // Transfer modal
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferForm, setTransferForm] = useState<
    Omit<BranchTransferRequest, "transferType" | "reason" | "notes"> & {
      transferType: "Permanent" | "Temporary";
      reason: string;
      notes: string;
    }
  >({
    targetBranchId: "",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: "",
    notes: "",
    transferType: "Permanent",
  });
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, [studentId]);

  const load = async () => {
    setInfoLoading(true);
    setError(null);
    try {
      const [home, active, history, branches] = await Promise.allSettled([
        getStudentHomeBranch(studentId),
        getStudentActiveBranch(studentId),
        getBranchTransferHistory(studentId),
        getAllBranches({ isActive: true, limit: 200 }),
      ]);
      if (home.status === "fulfilled") setHomeBranchState(home.value);
      if (active.status === "fulfilled") setActiveBranchState(active.value);
      if (history.status === "fulfilled") setTransfers(history.value ?? []);
      if (branches.status === "fulfilled") {
        const items = (branches.value as any)?.items ?? (Array.isArray(branches.value) ? branches.value : []);
        setBranchOptions(items.map((b: any) => ({ id: b.id, name: b.name, code: b.code })));
      }
    } catch (err: any) {
      setError(err?.message || "Không thể tải thông tin chi nhánh.");
    } finally {
      setInfoLoading(false);
    }
  };

  const handleChangeHome = async () => {
    if (!newHomeBranchId) return;
    setChangingHome(true);
    setError(null);
    try {
      const result = await setStudentHomeBranch(studentId, newHomeBranchId);
      if (result) setHomeBranchState(result);
      setShowChangeHome(false);
      setNewHomeBranchId("");
    } catch (err: any) {
      setError(err?.message || "Không thể thay đổi chi nhánh chủ.");
    } finally {
      setChangingHome(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.targetBranchId) {
      setTransferError("Vui lòng chọn chi nhánh đích.");
      return;
    }
    setSubmittingTransfer(true);
    setTransferError(null);
    try {
      const record = await createBranchTransfer(studentId, transferForm);
      setTransfers((prev) => [record, ...prev]);
      setShowTransferForm(false);
      setTransferForm({ targetBranchId: "", effectiveDate: new Date().toISOString().slice(0, 10), reason: "", notes: "", transferType: "Permanent" });
    } catch (err: any) {
      setTransferError(err?.message || "Không thể tạo yêu cầu chuyển chi nhánh.");
    } finally {
      setSubmittingTransfer(false);
    }
  };

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <XCircle size={15} className="shrink-0" />{error}
        </div>
      )}

      {/* Home / Active branch */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <BranchCard label="Chi nhánh chủ (Home Branch)" info={homeBranch} loading={infoLoading} />
          <button
            onClick={() => setShowChangeHome(true)}
            disabled={infoLoading}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Building2 size={13} />
            Thay đổi chi nhánh chủ
          </button>
        </div>
        <div>
          <BranchCard label="Chi nhánh hiện tại (Active)" info={activeBranch} loading={infoLoading} />
          <p className="text-xs text-gray-400 mt-2 px-1">Chi nhánh đang học (tự động từ enrollment)</p>
        </div>
      </div>

      {/* Change home branch form */}
      {showChangeHome && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 space-y-3">
          <p className="text-sm font-semibold text-blue-700 flex items-center gap-2"><Building2 size={14} />Chọn chi nhánh chủ mới</p>
          <select
            value={newHomeBranchId}
            onChange={(e) => setNewHomeBranchId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">-- Chọn chi nhánh --</option>
            {branchOptions.map((b) => (
              <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleChangeHome} disabled={!newHomeBranchId || changingHome} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
              {changingHome ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
              Xác nhận
            </button>
            <button onClick={() => { setShowChangeHome(false); setNewHomeBranchId(""); }} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">Hủy</button>
          </div>
        </div>
      )}

      {/* Transfer section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <GitBranch size={15} className="text-blue-500" />
            Lịch sử chuyển chi nhánh
          </h4>
          <button
            onClick={() => setShowTransferForm(true)}
            disabled={showTransferForm}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer transition-colors disabled:opacity-50"
          >
            <Plus size={12} />
            Chuyển chi nhánh
          </button>
        </div>

        {/* Transfer form */}
        {showTransferForm && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50 space-y-3">
            <p className="text-sm font-semibold text-blue-700">Tạo yêu cầu chuyển chi nhánh</p>
            {transferError && <p className="text-xs text-red-600 flex items-center gap-1"><XCircle size={12} />{transferError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Chi nhánh đích *</label>
                <select value={transferForm.targetBranchId} onChange={(e) => setTransferForm((p) => ({ ...p, targetBranchId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="">-- Chọn chi nhánh --</option>
                  {branchOptions.map((b) => <option key={b.id} value={b.id}>[{b.code}] {b.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ngày hiệu lực</label>
                <input type="date" value={transferForm.effectiveDate} onChange={(e) => setTransferForm((p) => ({ ...p, effectiveDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Loại chuyển</label>
                <select value={transferForm.transferType} onChange={(e) => setTransferForm((p) => ({ ...p, transferType: e.target.value as "Permanent" | "Temporary" }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {TRANSFER_TYPES.map((t) => <option key={t} value={t}>{t === "Permanent" ? "Vĩnh viễn" : "Tạm thời"}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lý do</label>
                <input type="text" placeholder="Lý do chuyển..." value={transferForm.reason} onChange={(e) => setTransferForm((p) => ({ ...p, reason: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
              <textarea rows={2} value={transferForm.notes} onChange={(e) => setTransferForm((p) => ({ ...p, notes: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleTransfer} disabled={submittingTransfer} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer transition-colors">
                {submittingTransfer ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                Tạo yêu cầu
              </button>
              <button onClick={() => { setShowTransferForm(false); setTransferError(null); }} className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">Hủy</button>
            </div>
          </div>
        )}

        {/* Transfer history */}
        {infoLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={22} className="animate-spin text-blue-400" />
          </div>
        ) : transfers.length === 0 ? (
          <div className="text-center py-6 rounded-xl border border-dashed border-gray-300 bg-gray-50">
            <Clock size={24} className="mx-auto mb-2 text-gray-300" />
            <p className="text-xs text-gray-500">Chưa có lịch sử chuyển chi nhánh.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {transfers.map((t) => (
              <div key={t.id} className="p-3 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800 flex-wrap">
                    <span className="text-xs text-gray-500">{t.fromBranchName ?? "?"}</span>
                    <ArrowRight size={13} className="text-gray-400 shrink-0" />
                    <span className="font-semibold text-blue-700">{t.toBranchName ?? "?"}</span>
                  </div>
                  <TransferStatusBadge status={t.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                  <span>{t.transferType === "Permanent" ? "Vĩnh viễn" : "Tạm thời"}</span>
                  <span>•</span>
                  <span>Hiệu lực: {new Date(t.effectiveDate).toLocaleDateString("vi-VN")}</span>
                  {t.reason && <><span>•</span><span>{t.reason}</span></>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
