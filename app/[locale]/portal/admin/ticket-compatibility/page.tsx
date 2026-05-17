"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  GitMerge,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getTicketTypeCompatibilities,
  createTicketTypeCompatibility,
  updateTicketTypeCompatibility,
  deleteTicketTypeCompatibility,
} from "@/lib/api/ticketCompatibilityService";
import { getLearningTicketTypes } from "@/lib/api/learningTicketTypeService";
import { getSlotTypes } from "@/lib/api/slotTypeService";
import ConfirmModal from "@/components/ConfirmModal";
import type { TicketTypeCompatibility } from "@/types/ticket-type-compatibility";
import type { LearningTicketType } from "@/types/learning-ticket-type";
import type { SlotType } from "@/types/slot-type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/lightswind/select";

function cn(...a: Array<string | false | null | undefined>) {
  return a.filter(Boolean).join(" ");
}

type FormData = {
  learningTicketTypeId: string;
  slotTypeIds: string[];
  isCompatible: boolean;
};

const emptyForm: FormData = {
  learningTicketTypeId: "",
  slotTypeIds: [],
  isCompatible: true,
};

function CompatibleBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle size={12} /> Tương thích
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
      <XCircle size={12} /> Không tương thích
    </span>
  );
}

function FormModal({
  open,
  onClose,
  onSubmit,
  mode,
  initial,
  ticketTypes,
  slotTypes,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  mode: "create" | "edit";
  initial?: FormData;
  ticketTypes: LearningTicketType[];
  slotTypes: SlotType[];
}) {
  const [form, setForm] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initial ?? emptyForm);
      setErrors({});
    }
  }, [open, initial]);

  if (!open) return null;

  const handleChange = (field: "learningTicketTypeId" | "isCompatible", value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleSlotType = (id: string) => {
    setForm((prev) => {
      const already = prev.slotTypeIds.includes(id);
      const next = mode === "edit"
        ? [id]
        : already ? prev.slotTypeIds.filter((x) => x !== id) : [...prev.slotTypeIds, id];
      return { ...prev, slotTypeIds: next };
    });
    setErrors((prev) => ({ ...prev, slotTypeIds: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.learningTicketTypeId) next.learningTicketTypeId = "Vui lòng chọn loại vé học";
    if (!form.slotTypeIds.length) next.slotTypeIds = "Vui lòng chọn ít nhất 1 loại slot";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-amber-600 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <GitMerge size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {mode === "edit" ? "Cập nhật quy tắc tương thích" : "Thêm quy tắc tương thích"}
              </h2>
              <p className="text-xs text-orange-100">Loại vé học ↔ Loại slot</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 transition-colors cursor-pointer">
            <X size={20} className="text-white" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700">
              Loại vé học <span className="text-red-500">*</span>
            </label>
            <Select
              value={form.learningTicketTypeId}
              onValueChange={(v) => handleChange("learningTicketTypeId", v)}
            >
              <SelectTrigger className={cn(
                "w-full rounded-xl border bg-white text-sm",
                errors.learningTicketTypeId ? "border-red-400" : "border-gray-200"
              )}>
                <SelectValue placeholder="Chọn loại vé học" />
              </SelectTrigger>
              <SelectContent>
                {ticketTypes.filter((t) => t.isActive).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    <span className="font-mono font-bold text-purple-700 mr-2">{t.code}</span>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.learningTicketTypeId && (
              <p className="text-xs text-red-500">{errors.learningTicketTypeId}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Loại slot <span className="text-red-500">*</span>
              {mode === "create" && (
                <span className="text-xs font-normal text-gray-400">(chọn được nhiều)</span>
              )}
            </label>
            <div className={cn(
              "rounded-xl border bg-gray-50 p-2.5 space-y-1 max-h-52 overflow-y-auto",
              errors.slotTypeIds ? "border-red-400" : "border-gray-200"
            )}>
              {slotTypes.filter((s) => s.isActive).map((s) => {
                const checked = form.slotTypeIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none",
                      checked
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-white border border-transparent"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSlotType(s.id)}
                      className="w-4 h-4 accent-blue-600 cursor-pointer flex-shrink-0"
                    />
                    <span className="font-mono font-bold text-blue-700 text-xs w-32 flex-shrink-0">{s.code}</span>
                    <span className="text-sm text-gray-700">{s.name}</span>
                  </label>
                );
              })}
            </div>
            {errors.slotTypeIds && <p className="text-xs text-red-500">{errors.slotTypeIds}</p>}
          </div>

          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              Kết quả tương thích
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange("isCompatible", true)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer",
                  form.isCompatible
                    ? "bg-emerald-50 border-emerald-400 text-emerald-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                <CheckCircle size={16} className="inline mr-1.5" />
                Tương thích
              </button>
              <button
                type="button"
                onClick={() => handleChange("isCompatible", false)}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all cursor-pointer",
                  !form.isCompatible
                    ? "bg-red-50 border-red-400 text-red-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                )}
              >
                <XCircle size={16} className="inline mr-1.5" />
                Không tương thích
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-gray-300 text-sm text-gray-600 font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-sm text-white font-semibold hover:shadow-lg transition-all cursor-pointer"
            >
              {mode === "edit" ? "Lưu thay đổi" : "Thêm rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function TicketCompatibilityPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<TicketTypeCompatibility[]>([]);
  const [ticketTypes, setTicketTypes] = useState<LearningTicketType[]>([]);
  const [slotTypes, setSlotTypes] = useState<SlotType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<TicketTypeCompatibility | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TicketTypeCompatibility | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [compats, tts, sts] = await Promise.all([
        getTicketTypeCompatibilities(),
        getLearningTicketTypes(),
        getSlotTypes(),
      ]);
      setItems(compats);
      setTicketTypes(tts);
      setSlotTypes(sts);
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải dữ liệu.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setModalMode("create");
    setEditTarget(null);
    setModalOpen(true);
  };

  const openEdit = (item: TicketTypeCompatibility) => {
    setModalMode("edit");
    setEditTarget(item);
    setModalOpen(true);
  };

  const handleSubmit = async (form: FormData) => {
    setSaving(true);
    try {
      if (modalMode === "create") {
        let created = 0;
        let skipped = 0;
        const errors: string[] = [];

        await Promise.allSettled(
          form.slotTypeIds.map(async (slotTypeId) => {
            try {
              await createTicketTypeCompatibility({
                learningTicketTypeId: form.learningTicketTypeId,
                slotTypeId,
                isCompatible: form.isCompatible,
              });
              created++;
            } catch (err: any) {
              // 409 = đã tồn tại, bỏ qua
              const status = err?.status ?? err?.response?.status;
              const msg: string = err?.message ?? "";
              if (status === 409 || msg.includes("MappingExists") || msg.includes("already exists")) {
                skipped++;
              } else {
                errors.push(msg || "Lỗi không xác định");
              }
            }
          })
        );

        if (errors.length > 0) {
          toast({
            title: "Một số quy tắc lỗi",
            description: `Tạo được ${created}, bỏ qua ${skipped} trùng, lỗi ${errors.length}.`,
            variant: "destructive",
          });
        } else if (created === 0 && skipped > 0) {
          toast({
            title: "Tất cả đã tồn tại",
            description: `${skipped} quy tắc đã có trong hệ thống, không cần tạo lại.`,
          });
        } else {
          const msg = skipped > 0
            ? `Đã thêm ${created} quy tắc. Bỏ qua ${skipped} quy tắc trùng.`
            : `Đã thêm ${created} quy tắc tương thích.`;
          toast({ title: "Thành công", description: msg });
        }

        if (created > 0) {
          setModalOpen(false);
          await load();
        }
      } else if (editTarget) {
        await updateTicketTypeCompatibility(editTarget.id, {
          learningTicketTypeId: form.learningTicketTypeId,
          slotTypeId: form.slotTypeIds[0] ?? "",
          isCompatible: form.isCompatible,
        });
        toast({ title: "Thành công", description: "Đã cập nhật quy tắc tương thích." });
        setModalOpen(false);
        await load();
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message ?? "Có lỗi xảy ra.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteTicketTypeCompatibility(deleteTarget.id);
      toast({ title: "Đã xóa", description: "Đã xóa quy tắc tương thích." });
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err?.message ?? "Không thể xóa.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const editInitial = editTarget
    ? {
        learningTicketTypeId: editTarget.learningTicketTypeId,
        slotTypeIds: [editTarget.slotTypeId],
        isCompatible: editTarget.isCompatible,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GitMerge size={24} className="text-orange-600" />
            Tương thích vé học ↔ Slot
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ma trận tương thích: vé nào học được lớp nào — mặc định tất cả pass nếu không có rule
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 text-sm text-white font-semibold hover:shadow-lg hover:shadow-orange-500/25 transition-all cursor-pointer"
        >
          <Plus size={16} /> Thêm rule
        </button>
      </div>

      {/* Info banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
        <strong>Chính sách mặc định:</strong> Nếu vé hoặc slot không có type, hoặc chưa có quy tắc nào →{" "}
        <span className="font-bold text-emerald-700">tương thích = true</span>.
        Chỉ khi có quy tắc với <code className="bg-amber-100 px-1 rounded">isCompatible = false</code> thì mới từ chối.
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="animate-spin text-orange-500" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <GitMerge size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Chưa có compatibility rule nào</p>
            <p className="text-sm mt-1">Mọi ticket đều compatible với mọi slot (default-pass)</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Loại vé học</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">→</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Loại slot</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Kết quả</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold font-mono">
                      {item.learningTicketTypeCode ?? item.learningTicketTypeId.slice(0, 8)}
                    </span>
                    {item.learningTicketTypeName && (
                      <span className="ml-2 text-gray-500 text-xs">{item.learningTicketTypeName}</span>
                    )}
                  </td>
                  <td className="px-2 py-3.5 text-gray-400 font-bold">→</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold font-mono">
                      {item.slotTypeCode ?? item.slotTypeId.slice(0, 8)}
                    </span>
                    {item.slotTypeName && (
                      <span className="ml-2 text-gray-500 text-xs">{item.slotTypeName}</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <CompatibleBadge value={item.isCompatible} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-500 hover:text-orange-600 transition-colors cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(item)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <FormModal
        open={modalOpen && !saving}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        mode={modalMode}
        initial={editInitial}
        ticketTypes={ticketTypes}
        slotTypes={slotTypes}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Xóa quy tắc tương thích"
        message="Bạn có chắc muốn xóa quy tắc này?"
        confirmText="Xóa"
        isLoading={deleting}
      />
    </div>
  );
}
