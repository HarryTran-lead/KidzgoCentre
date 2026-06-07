'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Pencil, Plus, Search, Trash2, WalletCards, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

type TicketCompatibilityMode = 'None' | 'AllowAll' | 'RuleBased';
type SlotDayGroup = 'None' | 'Weekday' | 'Weekend';
type SlotTimeBand = 'None' | 'Morning' | 'Afternoon' | 'Evening';
type SlotTeacherType = 'None' | 'Standard' | 'Native';
type SlotUsageType = 'None' | 'Standard' | 'Makeup' | 'Remedial' | 'Review' | 'Custom';
type ActiveFilter = 'all' | 'active' | 'inactive';
type RuleField = 'allowedDayGroups' | 'allowedTimeBands' | 'allowedTeacherTypes' | 'allowedUsageTypes';

type LearningTicketType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  compatibilityMode?: TicketCompatibilityMode | null;
  allowedDayGroups?: SlotDayGroup[] | null;
  allowedTimeBands?: SlotTimeBand[] | null;
  allowedTeacherTypes?: SlotTeacherType[] | null;
  allowedUsageTypes?: SlotUsageType[] | null;
  isActive: boolean;
};

type LearningTicketTypeForm = {
  code: string;
  name: string;
  description: string;
  compatibilityMode: TicketCompatibilityMode;
  allowedDayGroups: SlotDayGroup[];
  allowedTimeBands: SlotTimeBand[];
  allowedTeacherTypes: SlotTeacherType[];
  allowedUsageTypes: SlotUsageType[];
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

const emptyForm: LearningTicketTypeForm = {
  code: '',
  name: '',
  description: '',
  compatibilityMode: 'AllowAll',
  allowedDayGroups: [],
  allowedTimeBands: [],
  allowedTeacherTypes: [],
  allowedUsageTypes: [],
  isActive: true,
};

const compatibilityModes: Array<Option<TicketCompatibilityMode>> = [
  { value: 'AllowAll', label: 'Cho phép tất cả', description: 'Mặc định học được mọi slot nếu không có override chặn.' },
  { value: 'RuleBased', label: 'Theo quy tắc', description: 'Tự khớp theo ngày, khung giờ, giáo viên và mục đích.' },
];

const dayGroupOptions: Array<Option<SlotDayGroup>> = [
  { value: 'Weekday', label: 'Ngày thường' },
  { value: 'Weekend', label: 'Cuối tuần' },
];

const timeBandOptions: Array<Option<SlotTimeBand>> = [
  { value: 'Morning', label: 'Sáng' },
  { value: 'Afternoon', label: 'Chiều' },
  { value: 'Evening', label: 'Tối' },
];

const teacherTypeOptions: Array<Option<SlotTeacherType>> = [
  { value: 'Standard', label: 'GV thường' },
  { value: 'Native', label: 'GV nước ngoài' },
];

const usageTypeOptions: Array<Option<SlotUsageType>> = [
  { value: 'Standard', label: 'Lớp thường' },
  { value: 'Makeup', label: 'Lớp bù' },
  { value: 'Remedial', label: 'Phụ đạo' },
  { value: 'Review', label: 'Ôn tập' },
  { value: 'Custom', label: 'Khác' },
];

const modeLabels: Record<TicketCompatibilityMode, string> = {
  None: 'Mặc định',
  AllowAll: 'Cho phép tất cả',
  RuleBased: 'Theo quy tắc',
};

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
  '4': 'Evening',
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
  '4': 'Remedial',
  '8': 'Review',
  '16': 'Custom',
  None: 'None',
  Standard: 'Standard',
  Makeup: 'Makeup',
  Remedial: 'Remedial',
  Review: 'Review',
  Custom: 'Custom',
};

const labelMaps = {
  allowedDayGroups: Object.fromEntries(dayGroupOptions.map((option) => [option.value, option.label])),
  allowedTimeBands: Object.fromEntries(timeBandOptions.map((option) => [option.value, option.label])),
  allowedTeacherTypes: Object.fromEntries(teacherTypeOptions.map((option) => [option.value, option.label])),
  allowedUsageTypes: Object.fromEntries(usageTypeOptions.map((option) => [option.value, option.label])),
} as Record<RuleField, Record<string, string>>;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function asArray<T extends string>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

function normalizeEnumArray<T extends string>(value: unknown, map: Record<string, T>) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => map[String(item)]).filter((item): item is T => Boolean(item) && item !== 'None');
}

function normalizeMode(mode: unknown): TicketCompatibilityMode {
  return mode === 'AllowAll' || mode === 'RuleBased' || mode === 'None' ? mode : 'None';
}

function normalizeTicketType(item: LearningTicketType): LearningTicketType {
  return {
    ...item,
    compatibilityMode: normalizeMode(item.compatibilityMode),
    allowedDayGroups: normalizeEnumArray(item.allowedDayGroups, dayGroupValueMap),
    allowedTimeBands: normalizeEnumArray(item.allowedTimeBands, timeBandValueMap),
    allowedTeacherTypes: normalizeEnumArray(item.allowedTeacherTypes, teacherTypeValueMap),
    allowedUsageTypes: normalizeEnumArray(item.allowedUsageTypes, usageTypeValueMap),
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
    cache: init?.cache ?? 'no-store',
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

function renderRules(item: LearningTicketType) {
  const groups: Array<{ label: string; field: RuleField; values?: string[] | null }> = [
    { label: 'Ngày', field: 'allowedDayGroups', values: item.allowedDayGroups },
    { label: 'Giờ', field: 'allowedTimeBands', values: item.allowedTimeBands },
    { label: 'GV', field: 'allowedTeacherTypes', values: item.allowedTeacherTypes },
    { label: 'Mục đích', field: 'allowedUsageTypes', values: item.allowedUsageTypes },
  ];

  return (
    <div className="flex max-w-xl flex-wrap gap-2">
      {groups.map((group) => {
        const values = asArray(group.values).filter((value) => value !== 'None');
        return (
          <span key={group.field} className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {group.label}: {values.length ? values.map((value) => labelMaps[group.field][value] ?? value).join(', ') : 'Không giới hạn'}
          </span>
        );
      })}
    </div>
  );
}

function MultiSelect({
  disabled,
  label,
  options,
  values,
  onToggle,
}: {
  disabled?: boolean;
  label: string;
  options: Array<Option<string>>;
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-4', disabled && 'bg-slate-50 opacity-70')}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-800">{label}</p>
        <span className="text-xs font-semibold text-slate-400">{values.length ? `${values.length} chọn` : 'Không giới hạn'}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(option.value)}
              className={cn(
                'rounded-xl border px-3 py-2 text-sm font-bold transition',
                selected
                  ? 'border-red-200 bg-red-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50',
                disabled && 'cursor-not-allowed hover:border-slate-200 hover:bg-white',
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function LearningTicketTypesPage() {
  const [ticketTypes, setTicketTypes] = useState<LearningTicketType[]>([]);
  const [form, setForm] = useState<LearningTicketTypeForm>(emptyForm);
  const [editingItem, setEditingItem] = useState<LearningTicketType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LearningTicketType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTicketTypes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = await apiRequest<unknown>('/api/learning-ticket-types');
      setTicketTypes(extractItems<LearningTicketType>(payload).map(normalizeTicketType));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không tải được danh sách loại vé.';
      setError(errorMessage);
      toast.destructive({ title: 'Tải loại vé thất bại', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTicketTypes();
  }, [loadTicketTypes]);

  const counts = useMemo(
    () => ({
      total: ticketTypes.length,
      active: ticketTypes.filter((item) => item.isActive).length,
      inactive: ticketTypes.filter((item) => !item.isActive).length,
    }),
    [ticketTypes],
  );

  const filteredTicketTypes = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return ticketTypes.filter((item) => {
      const matchKeyword = !keyword || item.code.toLowerCase().includes(keyword) || item.name.toLowerCase().includes(keyword);
      const matchStatus = activeFilter === 'all' || (activeFilter === 'active' ? item.isActive : !item.isActive);
      return matchKeyword && matchStatus;
    });
  }, [activeFilter, searchTerm, ticketTypes]);

  const isRuleMode = form.compatibilityMode === 'RuleBased';
  const ruleBasedWithoutRules =
    isRuleMode &&
    !form.allowedDayGroups.length &&
    !form.allowedTimeBands.length &&
    !form.allowedTeacherTypes.length &&
    !form.allowedUsageTypes.length;

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

  function startEdit(item: LearningTicketType) {
    const normalized = normalizeTicketType(item);
    setEditingItem(normalized);
    setForm({
      code: normalized.code,
      name: normalized.name,
      description: normalized.description ?? '',
      compatibilityMode: normalizeMode(normalized.compatibilityMode),
      allowedDayGroups: asArray<SlotDayGroup>(normalized.allowedDayGroups),
      allowedTimeBands: asArray<SlotTimeBand>(normalized.allowedTimeBands),
      allowedTeacherTypes: asArray<SlotTeacherType>(normalized.allowedTeacherTypes),
      allowedUsageTypes: asArray<SlotUsageType>(normalized.allowedUsageTypes),
      isActive: normalized.isActive,
    });
    setIsFormOpen(true);
    setMessage(null);
    setError(null);
  }

  function toggleRule(field: RuleField, value: string) {
    setForm((current) => {
      const values = current[field] as string[];
      const nextValues = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
      return { ...current, [field]: nextValues } as LearningTicketTypeForm;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.code.trim() || !form.name.trim()) {
      const warningMessage = 'Vui lòng nhập đầy đủ mã và tên loại vé.';
      setError(warningMessage);
      toast.warning({ title: 'Thiếu thông tin', description: warningMessage });
      return;
    }

    const body = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      compatibilityMode: form.compatibilityMode,
      allowedDayGroups: isRuleMode ? form.allowedDayGroups : [],
      allowedTimeBands: isRuleMode ? form.allowedTimeBands : [],
      allowedTeacherTypes: isRuleMode ? form.allowedTeacherTypes : [],
      allowedUsageTypes: isRuleMode ? form.allowedUsageTypes : [],
      isActive: form.isActive,
    };

    setIsSaving(true);
    try {
      if (editingItem) {
        await apiRequest(`/api/learning-ticket-types/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        const successMessage = 'Đã cập nhật loại vé học.';
        setMessage(successMessage);
        toast.success({ title: 'Cập nhật thành công', description: successMessage });
      } else {
        await apiRequest('/api/learning-ticket-types', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        const successMessage = 'Đã tạo loại vé học mới.';
        setMessage(successMessage);
        toast.success({ title: 'Tạo thành công', description: successMessage });
      }

      closeForm();
      await loadTicketTypes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không lưu được loại vé học.';
      setError(errorMessage);
      toast.destructive({ title: 'Lưu loại vé thất bại', description: errorMessage });
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setError(null);
    setMessage(null);
    try {
      await apiRequest(`/api/learning-ticket-types/${deleteTarget.id}`, { method: 'DELETE' });
      const successMessage = 'Đã xóa loại vé học.';
      setMessage(successMessage);
      toast.success({ title: 'Xóa thành công', description: successMessage });
      setDeleteTarget(null);
      await loadTicketTypes();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không xóa được loại vé học.';
      setError(errorMessage);
      toast.destructive({ title: 'Xóa loại vé thất bại', description: errorMessage });
    }
  }

  return (
    <div className="h-full w-full max-w-none space-y-6 p-6 text-slate-900">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200">
            <WalletCards className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">Loại vé học</h1>
            <p className="mt-2 flex items-center gap-2 text-lg text-slate-600">
              <span className="text-red-600">✣</span>
              Danh sách loại vé và cấu hình rule tương thích mặc định
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 px-7 text-base font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700"
        >
          <Plus className="h-5 w-5" />
          Tạo loại vé mới
        </button>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white">
              <WalletCards className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-500">Tổng loại vé</p>
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
        </div>
        <div className="my-6 h-px bg-red-100" />
        <div className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Tìm kiếm loại vé..."
            className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-4 text-lg outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50/70 px-6 py-5">
          <h2 className="text-xl font-extrabold text-slate-950">Danh sách loại vé học</h2>
          <p className="text-lg font-medium text-slate-600">{filteredTicketTypes.length} loại vé</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-base">
            <thead className="bg-red-50/40 text-left text-sm font-extrabold text-slate-600">
              <tr>
                <th className="px-6 py-4">Loại vé</th>
                <th className="px-6 py-4">Compatibility Mode</th>
                <th className="px-6 py-4">Rule mặc định</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-slate-500">
                    Đang tải danh sách loại vé...
                  </td>
                </tr>
              ) : filteredTicketTypes.length ? (
                filteredTicketTypes.map((item) => {
                  const mode = normalizeMode(item.compatibilityMode);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                            <WalletCards className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-950">{item.name}</p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">{item.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-bold text-red-700">
                          {modeLabels[mode]}
                        </span>
                      </td>
                      <td className="px-6 py-5">{renderRules(item)}</td>
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-slate-500">
                    Chưa có loại vé phù hợp với bộ lọc.
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
                <h2 className="text-2xl font-extrabold text-slate-950">{editingItem ? 'Sửa loại vé học' : 'Tạo loại vé học mới'}</h2>
                <p className="mt-1 text-sm text-slate-500">Cấu hình mode mặc định và rule auto-match.</p>
              </div>
              <button type="button" onClick={closeForm} className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800">Mã loại vé</span>
                  <input value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} placeholder="VD: WEEKEND" className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50" />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-bold text-slate-800">Tên hiển thị</span>
                  <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Vé học cuối tuần" className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-base outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50" />
                </label>
              </div>
              <label className="space-y-2">
                <span className="text-sm font-bold text-slate-800">Mô tả</span>
                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} placeholder="Ghi chú ngắn để nhân sự vận hành hiểu phạm vi sử dụng." className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50" />
              </label>
              <div className="grid gap-3 md:grid-cols-3">
                {compatibilityModes.map((mode) => {
                  const selected = form.compatibilityMode === mode.value;
                  return (
                    <button key={mode.value} type="button" onClick={() => setForm((current) => ({ ...current, compatibilityMode: mode.value }))} className={cn('rounded-2xl border p-4 text-left transition', selected ? 'border-red-600 bg-red-50 ring-4 ring-red-50' : 'border-slate-200 hover:border-red-200 hover:bg-red-50')}>
                      <span className="block text-base font-extrabold text-slate-950">{mode.label}</span>
                      <span className="mt-2 block text-sm leading-5 text-slate-500">{mode.description}</span>
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <MultiSelect disabled={!isRuleMode} label="Nhóm ngày được học" options={dayGroupOptions} values={form.allowedDayGroups} onToggle={(value) => toggleRule('allowedDayGroups', value)} />
                <MultiSelect disabled={!isRuleMode} label="Khung giờ được học" options={timeBandOptions} values={form.allowedTimeBands} onToggle={(value) => toggleRule('allowedTimeBands', value)} />
                <MultiSelect disabled={!isRuleMode} label="Loại giáo viên" options={teacherTypeOptions} values={form.allowedTeacherTypes} onToggle={(value) => toggleRule('allowedTeacherTypes', value)} />
                <MultiSelect disabled={!isRuleMode} label="Mục đích slot" options={usageTypeOptions} values={form.allowedUsageTypes} onToggle={(value) => toggleRule('allowedUsageTypes', value)} />
              </div>
              {ruleBasedWithoutRules && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm font-semibold text-amber-800">
                  RuleBased nhưng chưa giới hạn rule nào, kết quả sẽ gần giống Cho phép tất cả.
                </div>
              )}
              <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-5 py-4">
                <span>
                  <span className="block text-base font-extrabold text-slate-900">Trạng thái</span>
                  <span className="text-sm text-slate-500">Bật nếu loại vé đang dùng trong vận hành.</span>
                </span>
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} className="h-5 w-5 rounded border-slate-300 text-red-600 focus:ring-red-500" />
              </label>
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onClick={closeForm} className="h-12 rounded-2xl border border-slate-200 px-6 font-bold text-slate-700 hover:bg-slate-50">
                  Hủy
                </button>
                <button type="submit" disabled={isSaving} className="h-12 rounded-2xl bg-red-600 px-7 font-bold text-white hover:bg-red-700 disabled:bg-slate-300">
                  {isSaving ? 'Đang lưu...' : editingItem ? 'Lưu thay đổi' : 'Tạo loại vé'}
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
              <h2 className="text-xl font-extrabold">Xóa loại vé học</h2>
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
