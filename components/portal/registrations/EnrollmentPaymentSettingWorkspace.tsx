"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { type ChangeEvent, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  ImageUp,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/lightswind/select";
import { Switch } from "@/components/lightswind/switch";
import { buildFileUrl, FILE_ENDPOINTS } from "@/constants/apiURL";
import { useBranchFilter } from "@/hooks/useBranchFilter";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEnrollmentPaymentSetting } from "@/hooks/useEnrollmentPaymentSetting";
import { useToast } from "@/hooks/use-toast";
import { isUploadSuccess, uploadFile } from "@/lib/api/fileService";
import { getAllBranchesPublic } from "@/lib/api/branchService";
import type { EnrollmentPaymentSetting, UpsertPaymentSettingRequest } from "@/types/registration";

type ScopeMode = "global" | "branch";

type BranchOption = {
  id: string;
  label: string;
};

type FormValues = {
  paymentMethod: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode: string;
  bankBin: string;
  vietQrTemplate: string;
  logoUrl: string;
  newStudentPolicyLines: string;
  reservationPolicyLines: string;
  isActive: boolean;
};

type Props = {
  defaultScope: ScopeMode;
};

const DEFAULT_FORM_VALUES: FormValues = {
  paymentMethod: "Tiền mặt / Chuyển khoản",
  accountName: "",
  accountNumber: "",
  bankName: "",
  bankCode: "",
  bankBin: "",
  vietQrTemplate: "compact2",
  logoUrl: "",
  newStudentPolicyLines: "",
  reservationPolicyLines: "",
  isActive: true,
};

const DEFAULT_PAYMENT_METHOD_OPTIONS = [
  "Tiền mặt / Chuyển khoản",
  "Chuyển khoản",
  "Tiền mặt",
];

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toNullableTrimmed(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePreviewUrl(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "";

  if (raw.startsWith(FILE_ENDPOINTS.BLOB_VIEW) || raw.startsWith("/api/files/serve")) {
    return raw;
  }

  if (/^(?:data|blob):/i.test(raw)) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);
      if (typeof window !== "undefined" && parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search || ""}${parsed.hash || ""}`;
      }

      if (parsed.hostname.toLowerCase().endsWith(".private.blob.vercel-storage.com")) {
        return `${FILE_ENDPOINTS.BLOB_VIEW}?pathname=${encodeURIComponent(parsed.pathname)}`;
      }
    } catch {
      return buildFileUrl(raw);
    }
  }

  return buildFileUrl(raw);
}

function buildAbsoluteAppUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (typeof window === "undefined") return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${window.location.origin}${normalizedPath}`;
}

function toPersistLogoUrl(value?: string | null): string {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^(?:data|blob):/i.test(raw)) {
    return raw;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const parsed = new URL(raw);

      if (parsed.hostname.toLowerCase().endsWith(".private.blob.vercel-storage.com")) {
        return buildAbsoluteAppUrl(
          `${FILE_ENDPOINTS.BLOB_VIEW}?pathname=${encodeURIComponent(parsed.pathname)}`,
        );
      }

      // Do not persist localhost origin to avoid backend PDF renderer resolving to wrong host.
      if (
        (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
        parsed.pathname.startsWith(FILE_ENDPOINTS.BLOB_VIEW)
      ) {
        return `${parsed.pathname}${parsed.search || ""}`;
      }

      return raw;
    } catch {
      return raw;
    }
  }

  if (raw.startsWith(FILE_ENDPOINTS.BLOB_VIEW)) {
    return buildAbsoluteAppUrl(raw);
  }

  return raw;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        reject(new Error("Không thể chuyển logo sang data URL."));
        return;
      }
      resolve(result);
    };
    reader.onerror = () => reject(reader.error || new Error("Không thể đọc logo."));
    reader.readAsDataURL(blob);
  });
}

async function resolvePersistLogoUrl(value?: string | null): Promise<string> {
  const persisted = toPersistLogoUrl(value);
  if (!persisted) return "";

  // Keep already-embedded images as-is.
  if (/^data:image\//i.test(persisted)) {
    return persisted;
  }

  // For local/proxy URLs, embed as data URL so backend PDF renderer does not depend on localhost reachability.
  const shouldEmbedAsDataUrl =
    /^https?:\/\/(localhost|127\.0\.0\.1)/i.test(persisted) ||
    persisted.startsWith(FILE_ENDPOINTS.BLOB_VIEW) ||
    persisted.startsWith("/api/files/blob/view") ||
    persisted.startsWith("/api/files/serve");

  if (!shouldEmbedAsDataUrl) {
    return persisted;
  }

  try {
    const previewUrl = normalizePreviewUrl(persisted);
    const absolutePreviewUrl = buildAbsoluteAppUrl(previewUrl);
    const response = await fetch(absolutePreviewUrl, { method: "GET" });
    if (!response.ok) {
      return persisted;
    }

    const blob = await response.blob();
    const contentType = String(blob.type || "").toLowerCase();
    if (!contentType.startsWith("image/")) {
      return persisted;
    }

    return await blobToDataUrl(blob);
  } catch {
    return persisted;
  }
}

function toFormValues(setting: EnrollmentPaymentSetting | null): FormValues {
  if (!setting) return DEFAULT_FORM_VALUES;

  return {
    paymentMethod: setting.paymentMethod ?? DEFAULT_FORM_VALUES.paymentMethod,
    accountName: setting.accountName ?? "",
    accountNumber: setting.accountNumber ?? "",
    bankName: setting.bankName ?? "",
    bankCode: setting.bankCode ?? "",
    bankBin: setting.bankBin ?? "",
    vietQrTemplate: setting.vietQrTemplate ?? DEFAULT_FORM_VALUES.vietQrTemplate,
    logoUrl: setting.logoUrl ?? "",
    newStudentPolicyLines: Array.isArray(setting.newStudentPolicyLines)
      ? setting.newStudentPolicyLines.join("\n")
      : "",
    reservationPolicyLines: Array.isArray(setting.reservationPolicyLines)
      ? setting.reservationPolicyLines.join("\n")
      : "",
    isActive: typeof setting.isActive === "boolean" ? setting.isActive : true,
  };
}

function toPolicyLines(value: string): string[] {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractBranchOptions(response: any): BranchOption[] {
  const rawList =
    response?.data?.branches ??
    response?.data?.items ??
    response?.branches ??
    response?.items ??
    [];

  if (!Array.isArray(rawList)) {
    return [];
  }

  return rawList
    .map((item: any) => {
      const id = String(item?.id ?? "").trim();
      const name = String(item?.name ?? item?.branchName ?? "").trim();
      if (!id || !name) return null;
      return { id, label: name };
    })
    .filter((item: BranchOption | null): item is BranchOption => Boolean(item));
}

function hasVietnameseCharacter(value: string): boolean {
  return /[\u00C0-\u024F\u1E00-\u1EFF]/.test(value);
}

function toVietnameseMessage(raw: unknown, fallback: string): string {
  const message = typeof raw === "string" ? raw.trim() : "";
  if (!message) return fallback;

  const normalized = message.toLowerCase();

  if (
    normalized.includes("logo url must be an absolute http(s) url") ||
    (normalized.includes("logo url") && normalized.includes("data:image"))
  ) {
    return "Logo URL phải là đường dẫn http(s) tuyệt đối hoặc data:image hợp lệ.";
  }

  if (normalized.includes("unauthorized") || normalized.includes("token")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (normalized.includes("forbidden")) {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  if (normalized.includes("not found")) {
    return "Không tìm thấy dữ liệu cần thiết.";
  }

  if (normalized.includes("internal server error")) {
    return "Hệ thống đang bận. Vui lòng thử lại sau.";
  }

  if (!hasVietnameseCharacter(message) && /[a-z]/i.test(message)) {
    return fallback;
  }

  return message;
}

function pickErrorMessage(err: any, fallback: string): string {
  const raw =
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.message;

  return toVietnameseMessage(raw, fallback);
}

export default function EnrollmentPaymentSettingWorkspace({ defaultScope }: Props) {
  const params = useParams();
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string"
      ? localeParam
      : Array.isArray(localeParam)
        ? localeParam[0]
        : "vi";

  const globalPath = `/${locale}/portal/admin/payment-setting`;
  const branchPath = `/${locale}/portal/admin/payment-setting/branch`;

  const { toast } = useToast();
  const { user: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { selectedBranchId: branchFromSidebar, isLoaded: isBranchFilterLoaded } = useBranchFilter();

  const [scope, setScope] = useState<ScopeMode>(defaultScope);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branchOptions, setBranchOptions] = useState<BranchOption[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreviewFailed, setLogoPreviewFailed] = useState(false);
  const [qrPreviewFailed, setQrPreviewFailed] = useState(false);

  const { setting, isLoading, isSaving, fetchSetting, saveSetting } = useEnrollmentPaymentSetting();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormValues>({
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const watchedLogoUrl = watch("logoUrl");
  const watchedPaymentMethod = watch("paymentMethod");
  const watchedIsActive = watch("isActive");

  const isAdmin = currentUser?.role === "Admin";
  const canEdit = !isLoadingUser && isAdmin;

  const effectiveBranchId = scope === "branch" ? selectedBranchId || null : null;

  const logoPreviewUrl = useMemo(() => normalizePreviewUrl(watchedLogoUrl), [watchedLogoUrl]);
  const qrPreviewUrl = useMemo(
    () => normalizePreviewUrl(setting?.qrPreviewUrl ?? null),
    [setting?.qrPreviewUrl]
  );

  const paymentMethodOptions = useMemo(() => {
    const current = watchedPaymentMethod?.trim();
    const set = new Set(DEFAULT_PAYMENT_METHOD_OPTIONS);
    if (current) {
      set.add(current);
    }
    return Array.from(set);
  }, [watchedPaymentMethod]);

  useEffect(() => {
    setLogoPreviewFailed(false);
  }, [logoPreviewUrl]);

  useEffect(() => {
    setQrPreviewFailed(false);
  }, [qrPreviewUrl]);

  useEffect(() => {
    setScope(defaultScope);
  }, [defaultScope]);

  useEffect(() => {
    let isCancelled = false;

    const loadBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const response = await getAllBranchesPublic({ isActive: true, page: 1, limit: 200 });
        if (isCancelled) return;
        setBranchOptions(extractBranchOptions(response));
      } catch (err: any) {
        if (isCancelled) return;
        setBranchOptions([]);
        toast({
          title: "Không thể tải chi nhánh",
          description: pickErrorMessage(err, "Vui lòng thử lại sau."),
          type: "destructive",
        });
      } finally {
        if (!isCancelled) {
          setIsLoadingBranches(false);
        }
      }
    };

    void loadBranches();

    return () => {
      isCancelled = true;
    };
  }, [toast]);

  useEffect(() => {
    if (scope !== "branch" || selectedBranchId) return;

    if (isBranchFilterLoaded && branchFromSidebar) {
      setSelectedBranchId(branchFromSidebar);
      return;
    }

    if (branchOptions.length > 0) {
      setSelectedBranchId(branchOptions[0].id);
    }
  }, [
    branchFromSidebar,
    branchOptions,
    isBranchFilterLoaded,
    scope,
    selectedBranchId,
  ]);

  useEffect(() => {
    let isCancelled = false;

    const loadSetting = async () => {
      if (scope === "branch" && !selectedBranchId) {
        reset(DEFAULT_FORM_VALUES);
        return;
      }

      try {
        const next = await fetchSetting(effectiveBranchId);
        if (isCancelled) return;
        reset(toFormValues(next));
      } catch (err: any) {
        if (isCancelled) return;
        reset(DEFAULT_FORM_VALUES);
        toast({
          title: "Không thể tải cấu hình",
          description: pickErrorMessage(err, "Vui lòng thử lại."),
          type: "destructive",
        });
      }
    };

    void loadSetting();

    return () => {
      isCancelled = true;
    };
  }, [effectiveBranchId, fetchSetting, reset, scope, selectedBranchId, toast]);

  const onReload = async () => {
    if (scope === "branch" && !selectedBranchId) {
      toast({
        title: "Chưa chọn chi nhánh",
        description: "Vui lòng chọn chi nhánh trước khi tải cấu hình.",
        type: "warning",
      });
      return;
    }

    try {
      const next = await fetchSetting(effectiveBranchId);
      reset(toFormValues(next));
      toast({
        title: "Đã làm mới",
        description: "Dữ liệu cấu hình thanh toán đã được cập nhật.",
        type: "success",
      });
    } catch {
      // Error toast handled in effect and hook callers
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!canEdit) return;

    const accountName = values.accountName.trim();
    const accountNumber = values.accountNumber.trim();

    if (!accountName || !accountNumber) {
      toast({
        title: "Thiếu thông tin bắt buộc",
        description: "Vui lòng nhập đầy đủ tên tài khoản và số tài khoản.",
        type: "destructive",
      });
      return;
    }

    const resolvedLogoUrl = await resolvePersistLogoUrl(values.logoUrl);

    const payload: UpsertPaymentSettingRequest = {
      branchId: scope === "global" ? null : selectedBranchId || null,
      paymentMethod: values.paymentMethod.trim() || "BankTransfer",
      accountName,
      accountNumber,
      bankName: toNullableTrimmed(values.bankName),
      bankCode: toNullableTrimmed(values.bankCode),
      bankBin: toNullableTrimmed(values.bankBin),
      vietQrTemplate: values.vietQrTemplate.trim() || "compact2",
      logoUrl: toNullableTrimmed(resolvedLogoUrl),
      newStudentPolicyLines: toPolicyLines(values.newStudentPolicyLines),
      reservationPolicyLines: toPolicyLines(values.reservationPolicyLines),
      isActive: Boolean(values.isActive),
    };

    try {
      const saved = await saveSetting(payload);
      reset(toFormValues(saved));
      toast({
        title: "Lưu thành công",
        description: "Cấu hình thanh toán xác nhận ghi danh đã được cập nhật.",
        type: "success",
      });
    } catch (err: any) {
      toast({
        title: "Lưu thất bại",
        description: pickErrorMessage(err, "Vui lòng thử lại sau."),
        type: "destructive",
      });
    }
  });

  const onLogoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !canEdit) {
      return;
    }

    try {
      setIsUploadingLogo(true);
      const result = await uploadFile(file, "payment-logos", "image");

      if (!isUploadSuccess(result)) {
        toast({
          title: "Upload logo thất bại",
          description: toVietnameseMessage(
            result?.error || result?.detail || result?.title,
            "Không thể tải logo lên hệ thống."
          ),
          type: "destructive",
        });
        return;
      }

      // Keep original uploaded URL for persistence; preview is normalized separately.
      setValue("logoUrl", result.url, { shouldDirty: true, shouldValidate: true });
      toast({
        title: "Upload logo thành công",
        description: "Logo đã được tải lên. Nhấn Lưu cấu hình để áp dụng.",
        type: "success",
      });
    } catch (error: any) {
      toast({
        title: "Upload logo thất bại",
        description: pickErrorMessage(error, "Đã xảy ra lỗi khi tải logo lên."),
        type: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl bg-gray-50 p-4 md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-linear-to-r from-red-600 to-red-700 p-3 shadow-lg">
            <CreditCard size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 md:text-3xl">
              Cấu hình chuyển khoản xác nhận ghi danh
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Quản lý thông tin tài khoản, logo và VietQR hiển thị trên PDF xác nhận.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={globalPath}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors",
              scope === "global"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-600"
            )}
          >
            Tất cả chi nhánh
          </Link>
          <Link
            href={branchPath}
            className={cn(
              "rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors",
              scope === "branch"
                ? "border-red-300 bg-red-50 text-red-700"
                : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-600"
            )}
          >
            Theo chi nhánh
          </Link>
          <button
            type="button"
            onClick={onReload}
            disabled={isLoading || isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Làm mới
          </button>
        </div>
      </div>

      {scope === "branch" ? (
        <div className="rounded-2xl border border-red-200 bg-white p-4">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Building2 size={16} className="text-red-600" /> Chi nhánh áp dụng
          </label>
          <Select
            value={selectedBranchId}
            onValueChange={setSelectedBranchId}
            disabled={isLoadingBranches || isSaving}
          >
            <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200">
              <SelectValue
                placeholder={
                  isLoadingBranches ? "Đang tải danh sách chi nhánh..." : "Chọn chi nhánh"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {branchOptions.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {scope === "branch" && !selectedBranchId ? (
            <p className="mt-2 text-xs text-amber-700">Vui lòng chọn chi nhánh để tải cấu hình.</p>
          ) : null}
        </div>
      ) : null}

      {scope === "branch" && setting?.isFallbackToGlobal ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Đang dùng cấu hình tất cả chi nhánh</p>
              <p className="mt-1">
                Chi nhánh chưa có cấu hình riêng. Hệ thống đang fallback về cấu hình chung
                toàn hệ thống.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoadingUser && !isAdmin ? (
        <div className="rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-gray-700">
          Chế độ chỉnh sửa chỉ dành cho Admin. Bạn chỉ có quyền xem cấu hình hiện tại.
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Phương thức thanh toán</label>
                <input type="hidden" {...register("paymentMethod")} />
                <Select
                  value={watchedPaymentMethod || DEFAULT_FORM_VALUES.paymentMethod}
                  onValueChange={(value) => setValue("paymentMethod", value, { shouldDirty: true })}
                  disabled={!canEdit || isSaving || isLoading}
                >
                  <SelectTrigger className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50">
                    <SelectValue placeholder="Chọn phương thức thanh toán" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mẫu VietQR</label>
                <input
                  {...register("vietQrTemplate")}
                  disabled={!canEdit || isSaving || isLoading}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="VD: compact2"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Tên tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("accountName", {
                    validate: (value) =>
                      value.trim().length > 0 || "Tên tài khoản không được để trống.",
                  })}
                  disabled={!canEdit || isSaving || isLoading}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50",
                    errors.accountName
                      ? "border-red-300 focus:border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-red-300 focus:ring-red-200"
                  )}
                  placeholder="Nhập tên chủ tài khoản"
                />
                {errors.accountName ? (
                  <p className="text-xs text-red-600">{errors.accountName.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("accountNumber", {
                    validate: (value) =>
                      value.trim().length > 0 || "Số tài khoản không được để trống.",
                  })}
                  disabled={!canEdit || isSaving || isLoading}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-gray-50",
                    errors.accountNumber
                      ? "border-red-300 focus:border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:border-red-300 focus:ring-red-200"
                  )}
                  placeholder="Nhập số tài khoản"
                />
                {errors.accountNumber ? (
                  <p className="text-xs text-red-600">{errors.accountNumber.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tên ngân hàng</label>
                <input
                  {...register("bankName")}
                  disabled={!canEdit || isSaving || isLoading}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="VD: Vietcombank"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Mã ngân hàng (bankCode)</label>
                <input
                  {...register("bankCode")}
                  disabled={!canEdit || isSaving || isLoading}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="VD: VCB"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">BIN ngân hàng (bankBin)</label>
                <input
                  {...register("bankBin")}
                  disabled={!canEdit || isSaving || isLoading}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="VD: 970436"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Chính sách học viên mới (mỗi dòng 1 ý)
                </label>
                <textarea
                  rows={3}
                  {...register("newStudentPolicyLines")}
                  disabled={!canEdit || isSaving || isLoading}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="Ví dụ: Không áp dụng hoàn phí."
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Chính sách bảo lưu (mỗi dòng 1 ý)
                </label>
                <textarea
                  rows={3}
                  {...register("reservationPolicyLines")}
                  disabled={!canEdit || isSaving || isLoading}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200 disabled:cursor-not-allowed disabled:bg-gray-50"
                  placeholder="Ví dụ: Chính sách bảo lưu tối đa 01 lần."
                />
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4">
              <Switch
                checked={Boolean(watchedIsActive)}
                onCheckedChange={(checked) => setValue("isActive", checked, { shouldDirty: true })}
                disabled={!canEdit || isSaving || isLoading}
                thumbColor="#ffffff"
                trackColor="#dc2626"
              />
              <div>
                <p className="text-sm font-semibold text-gray-800">Kích hoạt hiển thị thông tin chuyển khoản</p>
                <p className="mt-1 text-sm text-gray-600">
                  Nếu tắt cấu hình này, PDF xác nhận ghi danh sẽ không hiển thị thông tin chuyển khoản.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {isLoading ? (
                <div className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
                  <Loader2 size={15} className="animate-spin" /> Đang tải cấu hình...
                </div>
              ) : null}

              {canEdit ? (
                <button
                  type="submit"
                  disabled={isSaving || isLoading || (scope === "branch" && !selectedBranchId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-red-600 to-red-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  Lưu cấu hình
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <label className="text-sm font-semibold text-gray-700">Logo</label>
              <input type="hidden" {...register("logoUrl")} />

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <label
                  htmlFor="payment-logo-upload"
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                    !canEdit || isSaving || isLoading || isUploadingLogo
                      ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                      : "border-red-200 bg-white text-red-700 hover:bg-red-50"
                  )}
                >
                  {isUploadingLogo ? <Loader2 size={15} className="animate-spin" /> : <ImageUp size={15} />}
                  Tải logo từ máy
                </label>
                <input
                  id="payment-logo-upload"
                  type="file"
                  accept="image/*"
                  disabled={!canEdit || isSaving || isLoading || isUploadingLogo}
                  className="hidden"
                  onChange={onLogoFileChange}
                />

                {canEdit && watchedLogoUrl ? (
                  <button
                    type="button"
                    onClick={() => setValue("logoUrl", "", { shouldDirty: true, shouldValidate: true })}
                    disabled={isSaving || isLoading || isUploadingLogo}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={14} /> Xóa logo
                  </button>
                ) : null}
              </div>

              <div className="mt-3 rounded-xl border border-dashed border-gray-300 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Xem trước logo
                </p>
                {logoPreviewUrl && !logoPreviewFailed ? (
                  <img
                    src={logoPreviewUrl}
                    alt="Logo preview"
                    className="h-24 w-auto rounded-lg border border-gray-200 object-contain"
                    onError={() => setLogoPreviewFailed(true)}
                  />
                ) : (
                  <p className="text-sm text-gray-500">
                    {logoPreviewUrl
                      ? "Không tải được logo. Vui lòng thử file khác."
                      : "Chưa có logo để preview."}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-2 text-sm font-semibold text-gray-700">Xem trước VietQR</p>
              {qrPreviewUrl && !qrPreviewFailed ? (
                <img
                  src={qrPreviewUrl}
                  alt="QR preview"
                  className="h-56 w-56 rounded-xl border border-gray-200 bg-white p-2 object-contain"
                  onError={() => setQrPreviewFailed(true)}
                />
              ) : (
                <p className="text-sm text-gray-500">
                  {qrPreviewUrl
                    ? "Không tải được qrPreviewUrl. Kiểm tra lại thông tin tài khoản/ngân hàng."
                    : "Backend chưa trả về qrPreviewUrl."}
                </p>
              )}
            </div>
          </div>
        </div>
      </form>

      {!isLoading && setting ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          <CheckCircle2 size={16} />
          Đã tải cấu hình {scope === "global" ? "tất cả chi nhánh" : "chi nhánh"} thành công.
        </div>
      ) : null}
    </div>
  );
}
