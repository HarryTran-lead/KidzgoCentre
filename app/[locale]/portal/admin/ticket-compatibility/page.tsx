"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Link2,
  RotateCcw,
  Save,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TicketCompatibilityMode = "AllowAll" | "RuleBased";
type TicketCompatibilityModeInput = TicketCompatibilityMode | 0 | 1 | "0" | "1";
type SlotDayGroup = "None" | "Weekday" | "Weekend";
type SlotTimeBand = "None" | "Morning" | "Afternoon" | "Evening";
type SlotTeacherType = "None" | "Standard" | "Native";
type SlotUsageType =
  | "None"
  | "Standard"
  | "Makeup"
  | "Remedial"
  | "Review"
  | "Custom";
type OverrideValue = boolean | null;
type ActiveFilter = "all" | "active" | "inactive";

type MatrixTicketType = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  compatibilityMode?: TicketCompatibilityModeInput | null;
  allowedDayGroups?: SlotDayGroup[] | null;
  allowedTimeBands?: SlotTimeBand[] | null;
  allowedTeacherTypes?: SlotTeacherType[] | null;
  allowedUsageTypes?: SlotUsageType[] | null;
  isActive: boolean;
};

type MatrixSlotType = {
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

type MatrixCell = {
  learningTicketTypeId: string;
  slotTypeId: string;
  isCompatible?: boolean | null;
  compatible?: boolean | null;
  effectiveResult?: boolean | null;
  effectiveIsCompatible?: boolean | null;
  source?: string | null;
  reason?: string | null;
  overrideValue?: boolean | null;
  overrideIsCompatible?: boolean | null;
  manualOverride?: boolean | null;
};

type CompatibilityMatrix = {
  learningTicketTypes: MatrixTicketType[];
  slotTypes: MatrixSlotType[];
  cells: MatrixCell[];
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
};

const modeLabels: Record<TicketCompatibilityMode, string> = {
  AllowAll: "Cho phép tất cả",
  RuleBased: "Theo quy tắc",
};

const dayGroupOptions: Array<Option<SlotDayGroup>> = [
  { value: "None", label: "Không gắn tag" },
  { value: "Weekday", label: "Ngày thường" },
  { value: "Weekend", label: "Cuối tuần" },
];

const timeBandOptions: Array<Option<SlotTimeBand>> = [
  { value: "None", label: "Không gắn tag" },
  { value: "Morning", label: "Sáng" },
  { value: "Afternoon", label: "Chiều" },
  { value: "Evening", label: "Tối" },
];

const teacherTypeOptions: Array<Option<SlotTeacherType>> = [
  { value: "None", label: "Không gắn tag" },
  { value: "Standard", label: "GV thường" },
  { value: "Native", label: "GV nước ngoài" },
];

const usageTypeOptions: Array<Option<SlotUsageType>> = [
  { value: "None", label: "Không gắn tag" },
  { value: "Standard", label: "Lớp thường" },
  { value: "Makeup", label: "Lớp bù" },
  { value: "Remedial", label: "Phụ đạo" },
  { value: "Review", label: "Ôn tập" },
  { value: "Custom", label: "Khác" },
];

const labelMaps = {
  dayGroup: {
    ...Object.fromEntries(
      dayGroupOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "Ngày thường",
    "2": "Cuối tuần",
  },
  timeBand: {
    ...Object.fromEntries(
      timeBandOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "Sáng",
    "2": "Chiều",
    "3": "Tối",
  },
  teacherType: {
    ...Object.fromEntries(
      teacherTypeOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "GV thường",
    "2": "GV nước ngoài",
  },
  usageType: {
    ...Object.fromEntries(
      usageTypeOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "Lớp thường",
    "2": "Lớp bù",
    "4": "Phụ đạo",
    "8": "Ôn tập",
    "16": "Khác",
  },
  allowedDayGroups: {
    ...Object.fromEntries(
      dayGroupOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "Ngày thường",
    "2": "Cuối tuần",
  },
  allowedTimeBands: {
    ...Object.fromEntries(
      timeBandOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "Sáng",
    "2": "Chiều",
    "3": "Tối",
  },
  allowedTeacherTypes: {
    ...Object.fromEntries(
      teacherTypeOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "GV thường",
    "2": "GV nước ngoài",
  },
  allowedUsageTypes: {
    ...Object.fromEntries(
      usageTypeOptions.map((option) => [option.value, option.label]),
    ),
    "0": "Không gắn tag",
    "1": "Lớp thường",
    "2": "Lớp bù",
    "4": "Phụ đạo",
    "8": "Ôn tập",
    "16": "Khác",
  },
} as Record<string, Record<string, string>>;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

function normalizeMode(mode: unknown): TicketCompatibilityMode {
  if (mode === "RuleBased" || mode === 1 || mode === "1") return "RuleBased";
  return "AllowAll";
}

function normalizeMatrix(payload: unknown): CompatibilityMatrix {
  const source = (payload ?? {}) as Partial<CompatibilityMatrix>;
  return {
    learningTicketTypes: asArray<MatrixTicketType>(source.learningTicketTypes),
    slotTypes: asArray<MatrixSlotType>(source.slotTypes),
    cells: asArray<MatrixCell>(source.cells),
  };
}

type CompatibilityOverrideRecord = {
  learningTicketTypeId?: string | null;
  slotTypeId?: string | null;
  isCompatible?: boolean | null;
};

function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { items?: unknown[] }).items)
  ) {
    return (payload as { items: T[] }).items;
  }
  return [];
}

function mergePersistedOverrides(
  currentMatrix: CompatibilityMatrix,
  overrides: CompatibilityOverrideRecord[],
): CompatibilityMatrix {
  const overrideMap = new Map<string, boolean>();
  overrides.forEach((override) => {
    if (
      !override.learningTicketTypeId ||
      !override.slotTypeId ||
      typeof override.isCompatible !== "boolean"
    ) {
      return;
    }
    overrideMap.set(
      `${override.learningTicketTypeId}:${override.slotTypeId}`,
      override.isCompatible,
    );
  });
  if (!overrideMap.size) return currentMatrix;

  const touchedKeys = new Set<string>();
  const cells = currentMatrix.cells.map((cell) => {
    const key = `${cell.learningTicketTypeId}:${cell.slotTypeId}`;
    if (!overrideMap.has(key)) return cell;

    const isCompatible = overrideMap.get(key) ?? false;
    touchedKeys.add(key);
    return {
      ...cell,
      isCompatible,
      compatible: isCompatible,
      effectiveResult: isCompatible,
      effectiveIsCompatible: isCompatible,
      source: isCompatible ? "OverrideAllow" : "OverrideDeny",
      overrideValue: isCompatible,
      overrideIsCompatible: isCompatible,
      manualOverride: isCompatible,
    };
  });

  overrideMap.forEach((isCompatible, key) => {
    if (touchedKeys.has(key)) return;
    const [learningTicketTypeId, slotTypeId] = key.split(":");
    if (!learningTicketTypeId || !slotTypeId) return;
    cells.push({
      learningTicketTypeId,
      slotTypeId,
      isCompatible,
      compatible: isCompatible,
      effectiveResult: isCompatible,
      effectiveIsCompatible: isCompatible,
      source: isCompatible ? "OverrideAllow" : "OverrideDeny",
      overrideValue: isCompatible,
      overrideIsCompatible: isCompatible,
      manualOverride: isCompatible,
    });
  });

  return { ...currentMatrix, cells };
}

function cleanToken(token: string) {
  const normalized = token.replace(/^Bearer\s+/i, "").trim();
  if (
    !normalized ||
    normalized === "null" ||
    normalized === "undefined" ||
    normalized.length < 10
  )
    return null;
  return normalized;
}

function findToken(value: unknown, depth = 0): string | null {
  if (depth > 5 || value == null) return null;
  if (typeof value === "string") return cleanToken(value);
  if (typeof value !== "object") return null;

  const entries = Object.entries(value as Record<string, unknown>);
  for (const [key, nestedValue] of entries) {
    if (
      /access.*token|jwt|id.*token/i.test(key) &&
      typeof nestedValue === "string"
    ) {
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

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return findToken(JSON.parse(trimmed) as unknown);
    } catch {
      return null;
    }
  }

  return cleanToken(trimmed);
}

function getClientAccessToken() {
  if (typeof window === "undefined") return null;
  const keys = [
    "accessToken",
    "access_token",
    "authToken",
    "token",
    "jwt",
    "idToken",
  ];

  for (const key of keys) {
    const token =
      readStoredToken(window.localStorage, key) ??
      readStoredToken(window.sessionStorage, key);
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
  if (!headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const token = getClientAccessToken();
  if (token && !headers.has("Authorization"))
    headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: init?.cache ?? "no-store",
    credentials: "include",
    headers: buildRequestHeaders(init?.headers),
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> | null;
  if (!response.ok) {
    const validationMessage = payload?.errors?.find(
      (error) => error.description,
    )?.description;
    throw new Error(
      validationMessage ??
        payload?.detail ??
        payload?.title ??
        "Không thể xử lý yêu cầu.",
    );
  }

  return ((payload?.data ?? payload) as T) ?? ({} as T);
}

function cellCompatible(cell?: MatrixCell): boolean {
  if (!cell) return false;
  if (typeof cell.isCompatible === "boolean") return cell.isCompatible;
  if (typeof cell.compatible === "boolean") return cell.compatible;
  if (typeof cell.effectiveResult === "boolean") return cell.effectiveResult;
  if (typeof cell.effectiveIsCompatible === "boolean")
    return cell.effectiveIsCompatible;
  return false;
}

function originalOverride(cell?: MatrixCell): OverrideValue {
  if (!cell) return null;
  if (typeof cell.overrideValue === "boolean") return cell.overrideValue;
  if (typeof cell.overrideIsCompatible === "boolean")
    return cell.overrideIsCompatible;
  if (typeof cell.manualOverride === "boolean") return cell.manualOverride;
  if (cell.source === "OverrideAllow") return true;
  if (cell.source === "OverrideDeny") return false;
  return null;
}

function sourceLabel(source?: string | null) {
  switch (source) {
    case "OverrideAllow":
      return "Override cho phép";
    case "OverrideDeny":
      return "Override chặn";
    case "AllowAll":
      return "Mode AllowAll";
    case "Rule":
      return "Rule mặc định";
    case "NoTicketType":
      return "Thiếu loại vé";
    case "NoSlotType":
      return "Thiếu loại slot";
    case "None":
      return "Không mặc định";
    default:
      return source || "Không rõ nguồn";
  }
}

function TagBadge({
  label,
  tone = "slate",
}: {
  label: string;
  tone?: "slate" | "red" | "emerald";
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-bold",
        tone === "slate" && "border-slate-200 bg-slate-50 text-slate-600",
        tone === "red" && "border-red-100 bg-red-50 text-red-700",
        tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      {label}
    </span>
  );
}

function RulePills({
  values,
  field,
}: {
  values?: string[] | null;
  field: string;
}) {
  const activeValues = asArray<unknown>(values)
    .map(String)
    .filter((value) => value !== "None" && value !== "0");
  if (!activeValues.length)
    return (
      <span className="text-sm font-semibold text-slate-400">
        Không giới hạn
      </span>
    );

  return (
    <div className="flex flex-wrap gap-2">
      {activeValues.map((value) => (
        <TagBadge
          key={value}
          label={labelMaps[field]?.[value] ?? value}
          tone="red"
        />
      ))}
    </div>
  );
}

function OverrideButton({
  label,
  selected,
  onClick,
  tone,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  tone: "slate" | "emerald" | "red";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-2 text-sm font-bold transition",
        selected &&
          tone === "slate" &&
          "border-slate-300 bg-slate-100 text-slate-800",
        selected &&
          tone === "emerald" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        selected && tone === "red" && "border-red-200 bg-red-50 text-red-700",
        !selected &&
          "border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700",
      )}
    >
      {label}
    </button>
  );
}

export default function TicketCompatibilityPage() {
  const [matrix, setMatrix] = useState<CompatibilityMatrix>({
    learningTicketTypes: [],
    slotTypes: [],
    cells: [],
  });
  const [selectedTicketId, setSelectedTicketId] = useState("");
  const [ticketSearch, setTicketSearch] = useState("");
  const [slotSearch, setSlotSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [draftOverrides, setDraftOverrides] = useState<
    Record<string, OverrideValue>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMatrix = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [matrixPayload, overridesPayload] = await Promise.all([
        apiRequest<unknown>(
          "/api/ticket-type-compatibilities/matrix?onlyActive=false",
        ),
        apiRequest<unknown>("/api/ticket-type-compatibilities"),
      ]);
      const persistedOverrides =
        extractItems<CompatibilityOverrideRecord>(overridesPayload);
      setMatrix(
        mergePersistedOverrides(
          normalizeMatrix(matrixPayload),
          persistedOverrides,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không tải được matrix tương thích.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMatrix();
  }, [loadMatrix]);

  useEffect(() => {
    if (!matrix.learningTicketTypes.length) return;
    const selectedStillExists = matrix.learningTicketTypes.some(
      (ticket) => ticket.id === selectedTicketId,
    );
    if (!selectedTicketId || !selectedStillExists) {
      const firstActive =
        matrix.learningTicketTypes.find((ticket) => ticket.isActive) ??
        matrix.learningTicketTypes[0];
      setSelectedTicketId(firstActive.id);
    }
  }, [matrix.learningTicketTypes, selectedTicketId]);

  useEffect(() => {
    setDraftOverrides({});
  }, [selectedTicketId]);

  const cellMap = useMemo(() => {
    const nextMap = new Map<string, MatrixCell>();
    matrix.cells.forEach((cell) =>
      nextMap.set(`${cell.learningTicketTypeId}:${cell.slotTypeId}`, cell),
    );
    return nextMap;
  }, [matrix.cells]);

  const selectedTicket = useMemo(
    () =>
      matrix.learningTicketTypes.find(
        (ticket) => ticket.id === selectedTicketId,
      ) ?? null,
    [matrix.learningTicketTypes, selectedTicketId],
  );

  const filteredTickets = useMemo(() => {
    const keyword = ticketSearch.trim().toLowerCase();
    return matrix.learningTicketTypes.filter((ticket) => {
      if (!keyword) return true;
      return (
        ticket.code.toLowerCase().includes(keyword) ||
        ticket.name.toLowerCase().includes(keyword)
      );
    });
  }, [matrix.learningTicketTypes, ticketSearch]);

  const filteredSlots = useMemo(() => {
    const keyword = slotSearch.trim().toLowerCase();
    return matrix.slotTypes.filter((slot) => {
      const matchKeyword =
        !keyword ||
        slot.code.toLowerCase().includes(keyword) ||
        slot.name.toLowerCase().includes(keyword);
      const matchStatus =
        activeFilter === "all" ||
        (activeFilter === "active" ? slot.isActive : !slot.isActive);
      return matchKeyword && matchStatus;
    });
  }, [activeFilter, matrix.slotTypes, slotSearch]);

  const selectedCells = useMemo(() => {
    if (!selectedTicket) return [];
    return matrix.slotTypes
      .map((slot) => cellMap.get(`${selectedTicket.id}:${slot.id}`))
      .filter(Boolean) as MatrixCell[];
  }, [cellMap, matrix.slotTypes, selectedTicket]);

  const manualCount = selectedCells.filter(
    (cell) => originalOverride(cell) !== null,
  ).length;
  const draftCount = Object.keys(draftOverrides).length;
  const selectedMode = normalizeMode(selectedTicket?.compatibilityMode);
  const activeSlots = matrix.slotTypes.filter((slot) => slot.isActive).length;
  const inactiveSlots = matrix.slotTypes.length - activeSlots;

  function getCell(slotId: string) {
    if (!selectedTicket) return undefined;
    return cellMap.get(`${selectedTicket.id}:${slotId}`);
  }

  function getCurrentOverride(
    slotId: string,
    cell?: MatrixCell,
  ): OverrideValue {
    if (Object.prototype.hasOwnProperty.call(draftOverrides, slotId))
      return draftOverrides[slotId];
    return originalOverride(cell);
  }

  function setOverride(slotId: string, value: OverrideValue) {
    const baseValue = originalOverride(getCell(slotId));
    setDraftOverrides((current) => {
      const next = { ...current };
      if (value === baseValue) delete next[slotId];
      else next[slotId] = value;
      return next;
    });
    setMessage(null);
    setError(null);
  }

  async function saveOverrides() {
    if (!selectedTicket || !draftCount) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await apiRequest(
        `/api/ticket-type-compatibilities/learning-ticket-types/${selectedTicket.id}/overrides`,
        {
          method: "PUT",
          body: JSON.stringify({
            items: Object.entries(draftOverrides).map(
              ([slotTypeId, isCompatible]) => ({
                slotTypeId,
                isCompatible,
              }),
            ),
          }),
        },
      );
      setMessage("Đã lưu override cho loại vé đang chọn.");
      toast.success({
        title: "Đã lưu override",
        description: "Cấu hình tương thích vé-slot đã được cập nhật.",
      });
      setDraftOverrides({});
      await loadMatrix();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Không lưu được override.";
      setError(errorMessage);
      toast.destructive({
        title: "Lưu override thất bại",
        description: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="h-full w-full max-w-none space-y-6 p-6 text-slate-900">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200">
            <Link2 className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">
              Tương thích vé — slot
            </h1>
            <p className="mt-2 flex items-center gap-2 text-lg text-slate-600">
              <span className="text-red-600">✣</span>
              Xem matrix tương thích và chỉnh override theo từng loại vé học
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setDraftOverrides({})}
            disabled={!draftCount || isSaving}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-6 text-base font-bold text-slate-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw className="h-5 w-5" />
            Hủy đổi
          </button>
          <button
            type="button"
            onClick={() => void saveOverrides()}
            disabled={!draftCount || isSaving}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-red-600 px-7 text-base font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Save className="h-5 w-5" />
            {isSaving ? "Đang lưu..." : `Lưu ${draftCount || ""} override`}
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <p className="text-lg font-medium text-slate-500">Loại vé</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {matrix.learningTicketTypes.length}
          </p>
        </div>
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <p className="text-lg font-medium text-slate-500">Loại slot</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-950">
            {matrix.slotTypes.length}
          </p>
        </div>
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <p className="text-lg font-medium text-slate-500">Override hiện có</p>
          <p className="mt-2 text-3xl font-extrabold text-red-600">
            {manualCount}
          </p>
        </div>
      </section>

      {(message || error) && (
        <section
          className={cn(
            "rounded-2xl border px-5 py-4 text-sm font-bold",
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
        >
          {error ?? message}
        </section>
      )}

      <section className="rounded-3xl border border-red-100 bg-white/70 p-6 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
              <input
                value={ticketSearch}
                onChange={(event) => setTicketSearch(event.target.value)}
                placeholder="Tìm loại vé..."
                className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-4 text-lg outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
              />
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {filteredTickets.length ? (
                filteredTickets.map((ticket) => {
                  const selected = ticket.id === selectedTicketId;
                  return (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={cn(
                        "min-w-56 rounded-2xl border px-4 py-3 text-left transition",
                        selected
                          ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-100"
                          : "border-red-100 bg-white text-slate-700 hover:bg-red-50",
                      )}
                    >
                      <p className="font-extrabold">{ticket.name}</p>
                      <p
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          selected ? "text-white/80" : "text-slate-500",
                        )}
                      >
                        {ticket.code} ·{" "}
                        {modeLabels[normalizeMode(ticket.compatibilityMode)]}
                      </p>
                    </button>
                  );
                })
              ) : (
                <p className="py-4 text-sm text-slate-500">
                  Không tìm thấy loại vé.
                </p>
              )}
            </div>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400" />
            <input
              value={slotSearch}
              onChange={(event) => setSlotSearch(event.target.value)}
              placeholder="Tìm slot..."
              className="h-16 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-4 text-lg outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:ring-4 focus:ring-red-50"
            />
          </div>
        </div>
        <div className="my-6 h-px bg-red-100" />
        <div className="flex flex-wrap gap-3">
          {[
            {
              value: "active" as const,
              label: "Slot đang hoạt động",
              count: activeSlots,
            },
            {
              value: "all" as const,
              label: "Tất cả slot",
              count: matrix.slotTypes.length,
            },
            {
              value: "inactive" as const,
              label: "Slot tạm dừng",
              count: inactiveSlots,
            },
          ].map((tab) => {
            const selected = activeFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  "inline-flex h-14 items-center gap-3 rounded-2xl border px-6 text-base font-bold transition",
                  selected
                    ? "border-red-600 bg-red-600 text-white shadow-lg shadow-red-100"
                    : "border-red-100 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-sm",
                    selected
                      ? "bg-white/20 text-white"
                      : "bg-red-50 text-red-600",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {selectedTicket && (
        <section className="rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Loại vé đang chọn
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                {selectedTicket.name}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <TagBadge label={selectedTicket.code} />
                <TagBadge label={modeLabels[selectedMode]} tone="red" />
                <TagBadge
                  label={
                    selectedTicket.isActive ? "Đang hoạt động" : "Tạm dừng"
                  }
                  tone={selectedTicket.isActive ? "emerald" : "red"}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-4">
              <div>
                <p className="mb-2 text-sm font-bold text-slate-500">
                  Nhóm ngày
                </p>
                <RulePills
                  values={selectedTicket.allowedDayGroups}
                  field="allowedDayGroups"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-500">
                  Khung giờ
                </p>
                <RulePills
                  values={selectedTicket.allowedTimeBands}
                  field="allowedTimeBands"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-500">
                  Giáo viên
                </p>
                <RulePills
                  values={selectedTicket.allowedTeacherTypes}
                  field="allowedTeacherTypes"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-bold text-slate-500">
                  Mục đích
                </p>
                <RulePills
                  values={selectedTicket.allowedUsageTypes}
                  field="allowedUsageTypes"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-red-100 bg-red-50/70 px-6 py-5">
          <h2 className="text-xl font-extrabold text-slate-950">
            Danh sách slot và kết quả tương thích
          </h2>
          <p className="text-lg font-medium text-slate-600">
            {filteredSlots.length} slot
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-base">
            <thead className="bg-red-50/40 text-left text-sm font-extrabold text-slate-600">
              <tr>
                <th className="px-6 py-4">Loại slot</th>
                <th className="px-6 py-4">Metadata</th>
                <th className="px-6 py-4">Kết quả</th>
                <th className="px-6 py-4">Nguồn</th>
                <th className="px-6 py-4">Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    Đang tải matrix tương thích...
                  </td>
                </tr>
              ) : !selectedTicket ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    Chưa có loại vé để hiển thị matrix.
                  </td>
                </tr>
              ) : filteredSlots.length ? (
                filteredSlots.map((slot) => {
                  const cell = getCell(slot.id);
                  const hasDraft = Object.prototype.hasOwnProperty.call(
                    draftOverrides,
                    slot.id,
                  );
                  const currentOverride = getCurrentOverride(slot.id, cell);
                  const effectiveCompatible =
                    currentOverride === null
                      ? cellCompatible(cell)
                      : currentOverride;

                  return (
                    <tr key={slot.id} className="hover:bg-slate-50">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-600 text-white">
                            <Link2 className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-950">
                              {slot.name}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-500">
                              {slot.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex max-w-lg flex-wrap gap-2">
                          <TagBadge
                            label={
                              labelMaps.dayGroup[
                                String(slot.dayGroup ?? "None")
                              ] ?? "Không gắn tag"
                            }
                            tone={
                              String(slot.dayGroup ?? "None") === "None" ||
                              String(slot.dayGroup ?? "None") === "0"
                                ? "slate"
                                : "red"
                            }
                          />
                          <TagBadge
                            label={
                              labelMaps.timeBand[
                                String(slot.timeBand ?? "None")
                              ] ?? "Không gắn tag"
                            }
                            tone={
                              String(slot.timeBand ?? "None") === "None" ||
                              String(slot.timeBand ?? "None") === "0"
                                ? "slate"
                                : "red"
                            }
                          />
                          <TagBadge
                            label={
                              labelMaps.teacherType[
                                String(slot.teacherType ?? "None")
                              ] ?? "Không gắn tag"
                            }
                            tone={
                              String(slot.teacherType ?? "None") === "None" ||
                              String(slot.teacherType ?? "None") === "0"
                                ? "slate"
                                : "red"
                            }
                          />
                          <TagBadge
                            label={
                              labelMaps.usageType[
                                String(slot.usageType ?? "None")
                              ] ?? "Không gắn tag"
                            }
                            tone={
                              String(slot.usageType ?? "None") === "None" ||
                              String(slot.usageType ?? "None") === "0"
                                ? "slate"
                                : "red"
                            }
                          />
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold",
                            effectiveCompatible
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-red-200 bg-red-50 text-red-700",
                          )}
                        >
                          {effectiveCompatible ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {effectiveCompatible ? "Có thể học" : "Không thể học"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <TagBadge
                          label={
                            hasDraft ? "Chưa lưu" : sourceLabel(cell?.source)
                          }
                          tone={
                            hasDraft || cell?.source?.startsWith("Override")
                              ? "red"
                              : "slate"
                          }
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex min-w-[24rem] flex-wrap gap-2">
                          <OverrideButton
                            label="Theo mặc định"
                            tone="slate"
                            selected={currentOverride === null}
                            onClick={() => setOverride(slot.id, null)}
                          />
                          <OverrideButton
                            label="Luôn cho phép"
                            tone="emerald"
                            selected={currentOverride === true}
                            onClick={() => setOverride(slot.id, true)}
                          />
                          <OverrideButton
                            label="Luôn chặn"
                            tone="red"
                            selected={currentOverride === false}
                            onClick={() => setOverride(slot.id, false)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-14 text-center text-slate-500"
                  >
                    Không có slot phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
