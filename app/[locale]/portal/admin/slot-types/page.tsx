'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Layers, Pencil, Plus, Search, Trash2, XCircle } from 'lucide-react';

type SlotDayGroup = 'None' | 'Weekday' | 'Weekend';
type SlotTimeBand = 'None' | 'Morning' | 'Afternoon' | 'Evening';
type SlotTeacherType = 'None' | 'Standard' | 'Native';
type SlotUsageType = 'None' | 'Standard' | 'Makeup' | 'Remedial' | 'Review' | 'Custom';
type ActiveFilter = 'all' | 'active' | 'inactive';

type SlotType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  dayGroup?: SlotDayGroup | null;
  timeBand?: SlotTimeBand | null;
  teacherType?: SlotTeacherType | null;
  usageType?: SlotUsageType | null;
  isActive: boolean;
};

type SlotTypeForm = {
  code: string;
  name: string;
  description: string;
  dayGroup: SlotDayGroup;
  timeBand: SlotTimeBand;
  teacherType: SlotTeacherType;
  usageType: SlotUsageType;
  isActive: boolean;
};

type ApiEnvelope<T> = {
  isSuccess?: boolean;
  data?: T;
  detail?: string;
  title?: string;
  errors?: Array<{ description?: string; code?: string }>;
};

type Option<T extends string> = {
  value: T;
  label: string;
  description?: string;
};

const emptyForm: SlotTypeForm = {
  code: '',
  name: '',
  description: '',
  dayGroup: 'None',
  timeBand: 'None',
  teacherType: 'None',
  usageType: 'None',
  isActive: true,
};

const dayGroupOptions: Array<Option<SlotDayGroup>> = [
  { value: 'None', label: 'Không gắn tag', description: 'Chưa xác định ngày thường hay cuối tuần.' },
  { value: 'Weekday', label: 'Ngày thường', description: 'Slot diễn ra từ thứ Hai đến thứ Sáu.' },
  { value: 'Weekend', label: 'Cuối tuần', description: 'Slot diễn ra vào thứ Bảy hoặc Chủ nhật.' },
];

const timeBandOptions: Array<Option<SlotTimeBand>> = [
  { value: 'None', label: 'Không gắn tag', description: 'Chưa xác định khung giờ.' },
  { value: 'Morning', label: 'Sáng', description: 'Các slot buổi sáng.' },
  { value: 'Afternoon', label: 'Chiều', description: 'Các slot buổi chiều.' },
  { value: 'Evening', label: 'Tối', description: 'Các slot buổi tối.' },
];

const teacherTypeOptions: Array<Option<SlotTeacherType>> = [
  { value: 'None', label: 'Không gắn tag', description: 'Chưa xác định loại giáo viên.' },
  { value: 'Standard', label: 'Giáo viên thường', description: 'Lớp với giáo viên tiêu chuẩn.' },
  { value: 'Native', label: 'Giáo viên nước ngoài', description: 'Lớp với giáo viên nước ngoài.' },
];

const usageTypeOptions: Array<Option<SlotUsageType>> = [
  { value: 'None', label: 'Không gắn tag', description: 'Chưa xác định mục đích slot.' },
  { value: 'Standard', label: 'Lớp thường', description: 'Slot học theo chương trình chính.' },
  { value: 'Makeup', label: 'Lớp bù', description: 'Slot dùng để học bù.' },
  { value: 'Remedial', label: 'Phụ đạo', description: 'Slot hỗ trợ học sinh cần củng cố.' },
  { value: 'Review', label: 'Ôn tập', description: 'Slot dùng để ôn tập hoặc tổng kết.' },
  { value: 'Custom', label: 'Khác', description: 'Loại slot đặc biệt do vận hành tự định nghĩa.' },
];

const labelMaps = {
  dayGroup: Object.fromEntries(dayGroupOptions.map((option) => [option.value, option.label])),
  timeBand: Object.fromEntries(timeBandOptions.map((option) => [option.value, option.label])),
  teacherType: Object.fromEntries(teacherTypeOptions.map((option) => [option.value, option.label])),
  usageType: Object.fromEntries(usageTypeOptions.map((option) => [option.value, option.label])),
} as Record<keyof Pick<SlotType, 'dayGroup' | 'timeBand' | 'teacherType' | 'usageType'>, Record<string, string>>;

const dayGroupValueMap: Record<string, SlotDayGroup> = {
  '0': 'None',
  '1': 'Weekday',
  '2': 'Weekend',
  None: 'None',
  Weekday: 'Weekday',
  Weekend: 'Weekend',
};

const timeBandValueMap: Record<string, SlotTimeBand> = {
  '0': 'None',
  '1': 'Morning',
  '2': 'Afternoon',
  '3': 'Evening',
  None: 'None',
  Morning: 'Morning',
  Afternoon: 'Afternoon',
  Evening: 'Evening',
};

const teacherTypeValueMap: Record<string, SlotTeacherType> = {
  '0': 'None',
  '1': 'Standard',
  '2': 'Native',
  None: 'None',
  Standard: 'Standard',
  Native: 'Native',
};

const usageTypeValueMap: Record<string, SlotUsageType> = {
  '0': 'None',
  '1': 'Standard',
  '2': 'Makeup',
  '3': 'Remedial',
  '4': 'Review',
  '5': 'Custom',
  None: 'None',
  Standard: 'Standard',
  Makeup: 'Makeup',
  Remedial: 'Remedial',
  Review: 'Review',
  Custom: 'Custom',
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function normalizeEnum<T extends string>(value: unknown, options: Array<Option<T>>, fallback: T): T {
  return options.some((option) => option.value === value) ? (value as T) : fallback;
}

function normalizeSlotEnum<T extends string>(value: unknown, map: Record<string, T>, fallback: T) {
  return map[String(value)] ?? fallback;
}

function normalizeSlotType(item: SlotType): SlotType {
  return {
    ...item,
    dayGroup: normalizeSlotEnum(item.dayGroup, dayGroupValueMap, 'None'),
    timeBand: normalizeSlotEnum(item.timeBand, timeBandValueMap, 'None'),
    teacherType: normalizeSlotEnum(item.teacherType, teacherTypeValueMap, 'None'),
    usageType: normalizeSlotEnum(item.usageType, usageTypeValueMap, 'None'),
  };
}

function cleanToken(token: string) {
  const normalized = token.replace(/^Bearer\s+/i, '').trim();
  if (!normalized || normalized === 'null' || normalized === 'undefined' || normalized.length < 10) return null;
  return normalized;
}

function findToken(value: unknown, depth = 0): string | null {
  if (depth > 5 || value == null) return null;
  if (typeof value === 'string') return cleanToken(value);
  if (typeof value !== 'object') return null;

  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, nestedValue] of entries) {
    if (/access.*token|jwt|id.*token/i.test(key) && typeof nestedValue === 'string') {
      const token = cleanToken(nestedValue);
      if (token) return token;
    }
  }

  for (const [, nestedValue] of entries) {
    const token = findToken(nestedValue, depth + 1);
    if (token) return token;
  }

  return null;
}

function readStoredToken(storage: Storage, key: string) {
  const rawValue = storage.getItem(key);
  if (!rawValue) return null;
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return findToken(JSON.parse(trimmed) as unknown);
    } catch {
      return null;
    }
  }

  return cleanToken(trimmed);
}

function getClientAccessToken() {
  if (typeof window === 'undefined') return null;
  const keys = ['accessToken', 'access_token', 'authToken', 'token', 'jwt', 'idToken'];

  for (const key of keys) {
    const token = readStoredToken(window.localStorage, key) ?? readStoredToken(window.sessionStorage, key);
    if (token) return token;
  }

  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key || !/auth|token|jwt/i.test(key)) continue;
      const token = readStoredToken(storage, key);
      if (token) return token;
    }
  }

  return null;
}

function buildRequestHeaders(initHeaders?: HeadersInit) {
  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = getClientAccessToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: buildRequestHeaders(init?.headers),
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    const validationMessage = payload?.errors?.find((error) => error.description)?.description;
    throw new Error(validationMessage ?? payload?.detail ?? payload?.title ?? 'Không thể xử lý yêu cầu.');
  }

  return ((payload?.data ?? payload) as T) ?? ({} as T);
}

function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: T[] }).items)) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

function TagBadge({ label, tone = 'slate' }: { label: string; tone?: 'slate' | 'red' | 'emerald' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-3 py-1 text-xs font-bold',
        tone === 'slate' && 'border-slate-200 bg-slate-50 text-slate-600',
        tone === 'red' && 'border-red-100 bg-red-50 text-red-700',
        tone === 'emerald' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
      )}
    >
      {label}
    </span>
  );
}

function getUsageBadge(slotType: SlotType): { label: string; tone: 'slate' | 'red' } {
  const usageType = slotType.usageType ?? 'None';
  if (usageType === 'None' && slotType.teacherType === 'Native') {
    return { label: 'Khác', tone: 'red' };
  }

  return {
    label: labelMaps.usageType[usageType] ?? 'Không gắn tag',
    tone: usageType === 'None' ? 'slate' : 'red',
  };
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<Option<T>>;
  onChange: (value: T) => void;
}) {
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <label className="space-y-2">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {selected.description && <span className="block text-sm leading-5 text-slate-500">{selected.description}</span>}
    </label>
  );
}

export default function SlotTypesPage() {
  const [slotTypes, setSlotTypes] = useState<SlotType[]>([]);
  const [form, setForm] = useState<SlotTypeForm>(emptyForm);
  const [editingItem, setEditingItem] = useState<SlotType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SlotType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSlotTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await apiRequest<unknown>('/api/slot-types');
      setSlotTypes(extractItems<SlotType>(payload).map(normalizeSlotType));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách loại slot.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSlotTypes();
  }, [loadSlotTypes]);

  const counts = useMemo(
    () => ({
      total: slotTypes.length,
      active: slotTypes.filter((item) => item.isActive).length,
      inactive: slotTypes.filter((item) => !item.isActive).length,
      missingTags: slotTypes.filter(
        (item) => item.dayGroup === 'None' || item.timeBand === 'None' || item.teacherType === 'None' || item.usageType === 'None',
      ).length,
    }),
    [slotTypes],
  );

  const filteredSlotTypes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return slotTypes.filter((item) => {
      const matchKeyword = !keyword || item.code.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword);
      const matchStatus = activeFilter === 'all' || (activeFilter === 'active' ? item.isActive : !item.isActive);
      return matchKeyword && matchStatus;
    });
  }, [activeFilter, searchTerm, slotTypes]);

  function openCreateForm() {
    setEditingItem(null);
    setForm(emptyForm);
    setIsFormOpen(true);
    setError(null);
    setMessage(null);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditingItem(null);
    setForm(emptyForm);
  }

  function startEdit(item: SlotType) {
    const normalized = normalizeSlotType(item);
    setEditingItem(normalized);
    setForm({
      code: normalized.code,
      name: normalized.name,
      description: normalized.description ?? '',
      dayGroup: normalizeEnum(normalized.dayGroup, dayGroupOptions, 'None'),
      timeBand: normalizeEnum(normalized.timeBand, timeBandOptions, 'None'),
      teacherType: normalizeEnum(normalized.teacherType, teacherTypeOptions, 'None'),
      usageType: normalizeEnum(normalized.usageType, usageTypeOptions, 'None'),
      isActive: normalized.isActive,
    });
    setIsFormOpen(true);
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.code.trim() || !form.name.trim()) {
      setError('Vui lòng nhập đầy đủ mã và tên loại slot.');
      return;
    }

    const body = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      dayGroup: form.dayGroup,
      timeBand: form.timeBand,
      teacherType: form.teacherType,
      usageType: form.usageType,
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      if (editingItem) {
        await apiRequest(`/api/slot-types/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        setMessage('Đã cập nhật loại slot.');
      } else {
        await apiRequest('/api/slot-types', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        setMessage('Đã tạo loại slot mới.');
      }

      closeForm();
      await loadSlotTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được loại slot.');
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError(null);
    setMessage(null);
    try {
      await apiRequest(`/api/slot-types/${deleteTarget.id}`, { method: 'DELETE' });
      setMessage('Đã xóa loại slot.');
      setDeleteTarget(null);
      await loadSlotTypes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được loại slot.');
    }
  }

  return (
    <div className="h-full w-full max-w-none space-y-6 p-6 text-slate-900">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200">
            <Layers className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Loại slot buổi học</h1>
            <p className="mt-2 flex items-center gap-2 text-lg text-slate-600">
              <span className="text-red-600">✣</span>
              Danh sách slot type và metadata dùng để tự động khớp với vé học
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 px-7 text-base font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700"
        >
          <Plus className="h-5 w-5" />
          Tạo loại slot mới
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <Layers className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-500">Tổng loại slot</p>
              <p className="text-3xl font-extrabold text-slate-950">{counts.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-500">Đang hoạt động</p>
              <p className="text-3xl font-extrabold text-slate-950">{counts.active}</p>
            </div>
          </div>
        </div>
      </section>

      {(message || error) && (
        <section className={cn('rounded-2xl border px-5 py-4 text-sm font-bold', error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
          {error ?? message}
        </section>
      )}

      <section className="rounded-3xl border border-red-100 bg-white/70 p-6 shadow-sm">
        <div className="flex flex-wrap gap-3">
          {[
            { value: 'all' as const, label: 'Tất cả trạng thái', count: counts.total },
            { value: 'active' as const, label: 'Đang hoạt động', count: counts.active },
            { value: 'inactive' as const, label: 'Tạm dừng', count: counts.inactive },
          ].map((tab) => {
            const selected = activeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  'inline-flex h-14 items-center gap-3 rounded-2xl border px-6 text-base font-bold transition',
                  selected
                    ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-100'
                    : 'border-red-100 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50',
                )}
              >
                {tab.label}
                <span className={cn('rounded-full px-2.5 py-1 text-sm', selected ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600')}>
                  {tab.count}
                </span>
              </button>
            );
          })}
          <span className="inline-flex h-14 items-center gap-3 rounded-2xl border border-red-100 bg-white px-6 text-base font-bold text-red-600">
            Thiếu tag
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-sm">{counts.missingTags}</span>
          </span>
        </div>
        <div className="my-6 h-px bg-red-100" />
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm loại slot..."
            className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-4 text-lg outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50/70 px-6 py-5">
          <h2 className="text-xl font-extrabold text-slate-950">Danh sách loại slot</h2>
          <p className="text-lg font-medium text-slate-600">{filteredSlotTypes.length} loại slot</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-base">
            <thead className="bg-red-50/40 text-left text-sm font-extrabold text-slate-600">
              <tr>
                <th className="px-6 py-4">Loại slot</th>
                <th className="px-6 py-4">Nhóm ngày</th>
                <th className="px-6 py-4">Khung giờ</th>
                <th className="px-6 py-4">Giáo viên</th>
                <th className="px-6 py-4">Mục đích</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-slate-500">
                    Đang tải danh sách loại slot...
                  </td>
                </tr>
              ) : filteredSlotTypes.length ? (
                filteredSlotTypes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-950">{item.name}</p>
                          <p className="mt-1 text-sm font-semibold text-slate-500">{item.code}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><TagBadge label={labelMaps.dayGroup[item.dayGroup ?? 'None'] ?? 'Không gắn tag'} tone={item.dayGroup === 'None' ? 'slate' : 'red'} /></td>
                    <td className="px-6 py-5"><TagBadge label={labelMaps.timeBand[item.timeBand ?? 'None'] ?? 'Không gắn tag'} tone={item.timeBand === 'None' ? 'slate' : 'red'} /></td>
                    <td className="px-6 py-5"><TagBadge label={labelMaps.teacherType[item.teacherType ?? 'None'] ?? 'Không gắn tag'} tone={item.teacherType === 'None' ? 'slate' : 'red'} /></td>
                    <td className="px-6 py-5"><TagBadge {...getUsageBadge(item)} /></td>
                    <td className="px-6 py-5">
                      <span className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold', item.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700')}>
                        {item.isActive ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        {item.isActive ? 'Đang hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-4 text-slate-400">
                        <button type="button" onClick={() => startEdit(item)} className="transition hover:text-red-600" title="Sửa">
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={() => setDeleteTarget(item)} className="transition hover:text-red-600" title="Xóa">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-slate-500">
                    Chưa có loại slot phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-950">{editingItem ? 'Sửa loại slot' : 'Tạo loại slot mới'}</h2>
                <p className="mt-1 text-sm text-slate-500">Gắn metadata để hệ thống tự động tính compatibility.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800">Mã loại slot</span>
                  <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="VD: STANDARD-WEEKEND" className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800">Tên hiển thị</span>
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Lớp thường cuối tuần" className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50" />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Mô tả</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Ghi chú ngắn về loại slot này." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50" />
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <SelectField label="Nhóm ngày" value={form.dayGroup} options={dayGroupOptions} onChange={(value) => setForm((current) => ({ ...current, dayGroup: value }))} />
                <SelectField label="Khung giờ" value={form.timeBand} options={timeBandOptions} onChange={(value) => setForm((current) => ({ ...current, timeBand: value }))} />
                <SelectField label="Loại giáo viên" value={form.teacherType} options={teacherTypeOptions} onChange={(value) => setForm((current) => ({ ...current, teacherType: value }))} />
                <SelectField label="Mục đích sử dụng" value={form.usageType} options={usageTypeOptions} onChange={(value) => setForm((current) => ({ ...current, usageType: value }))} />
              </div>
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-5 py-4">
                <span>
                  <span className="block text-base font-extrabold text-slate-900">Trạng thái</span>
                  <span className="text-sm text-slate-500">Bật nếu loại slot đang dùng trong vận hành.</span>
                </span>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500" />
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={closeForm} className="h-12 rounded-2xl border border-slate-200 px-6 font-bold text-slate-700 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving} className="h-12 rounded-2xl bg-red-600 px-7 font-bold text-white hover:bg-red-700 disabled:bg-slate-300">
                  {isSaving ? 'Đang lưu...' : editingItem ? 'Lưu thay đổi' : 'Tạo loại slot'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/40 p-4">
          <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-red-600 px-6 py-5 text-white">
              <h2 className="text-xl font-extrabold">Xóa loại slot</h2>
              <p className="mt-1 text-sm text-white/80">Thao tác này chỉ nên dùng khi dữ liệu chưa được sử dụng.</p>
            </div>
            <div className="space-y-4 p-6">
              <p className="text-base text-slate-600">
                Bạn có chắc muốn xóa <span className="font-extrabold text-slate-950">{deleteTarget.name}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="h-12 rounded-2xl border border-slate-200 px-6 font-bold text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  className="h-12 rounded-2xl bg-red-600 px-7 font-bold text-white hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
