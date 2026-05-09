"use client";

import { useEffect, useMemo, useState } from "react";
import {
  X,
  UserPlus,
  User,
  Users,
  CheckCircle2,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  Lock,
  Building2,
  AlertCircle,
} from "lucide-react";
import {
  USER_ENDPOINTS,
  PROFILE_ENDPOINTS,
  PLACEMENT_TEST_ENDPOINTS,
} from "@/constants/apiURL";
import { getAccessToken } from "@/lib/store/authToken";
import { useToast } from "@/hooks/use-toast";
import type { PlacementTest } from "@/types/placement-test";

interface CreateAccountProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  test: PlacementTest | null;
  leadInfo: {
    contactName: string;
    email: string;
    phone: string;
    branchId: string;
    branchName: string;
    children: Array<{ id: string; name: string }>;
  } | null;
  onSuccess: () => void;
}

type Step = "account" | "parent-profile" | "student-profile" | "convert" | "done";

interface ExistingParentContext {
  userId: string;
  email: string;
  phoneNumber: string;
  displayName: string;
  parentProfileId?: string;
  parentProfileDisplayName?: string;
}

export default function CreateAccountProfileModal({
  isOpen,
  onClose,
  test,
  leadInfo,
  onSuccess,
}: CreateAccountProfileModalProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<Step>("account");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [convertStatus, setConvertStatus] = useState<"idle" | "success" | "failed">("idle");
  const [convertMessage, setConvertMessage] = useState<string>("");
  const [existingParentContext, setExistingParentContext] =
    useState<ExistingParentContext | null>(null);
  const [isCheckingExistingContext, setIsCheckingExistingContext] =
    useState(false);
  const [hasUsedExistingContext, setHasUsedExistingContext] = useState(false);

  const initialAccountForm = useMemo(
    () => ({
      email: leadInfo?.email || "",
      username: leadInfo?.email?.split("@")[0] || "",
      phoneNumber: leadInfo?.phone || "",
      role: "Parent" as const,
      password: "123456",
      branchId: leadInfo?.branchId || "",
      name: leadInfo?.contactName || "",
    }),
    [leadInfo],
  );

  const initialParentProfileForm = useMemo(
    () => ({
      displayName: leadInfo?.contactName || "",
      pinHash: "1234",
    }),
    [leadInfo],
  );

  const initialStudentProfileForm = useMemo(
    () => ({
      displayName: test?.childName || "",
    }),
    [test],
  );

  // Account form data
  const [accountForm, setAccountForm] = useState(initialAccountForm);

  // Created user data
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [createdParentProfileId, setCreatedParentProfileId] = useState<string | null>(null);
  const [createdStudentProfileId, setCreatedStudentProfileId] = useState<string | null>(null);

  // Parent profile form
  const [parentProfileForm, setParentProfileForm] = useState(initialParentProfileForm);

  // Student profile form
  const [studentProfileForm, setStudentProfileForm] = useState(initialStudentProfileForm);

  const getApiMessage = (payload: any, fallback: string) => {
    return (
      payload?.message ||
      payload?.detail ||
      payload?.title ||
      payload?.error ||
      payload?.errors?.[0] ||
      fallback
    );
  };

  const toLower = (value: unknown) => String(value || "").toLowerCase();

  const normalizeText = (value: unknown) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const normalizePhone = (value: unknown) => {
    const digits = String(value || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("84")) return digits.slice(2);
    if (digits.startsWith("0")) return digits.slice(1);
    return digits;
  };

  const isSamePhone = (left: unknown, right: unknown) => {
    const normalizedLeft = normalizePhone(left);
    const normalizedRight = normalizePhone(right);

    if (!normalizedLeft || !normalizedRight) return false;

    return (
      normalizedLeft === normalizedRight ||
      normalizedLeft.endsWith(normalizedRight) ||
      normalizedRight.endsWith(normalizedLeft)
    );
  };

  const extractItems = (payload: any): any[] => {
    if (Array.isArray(payload?.data?.users?.items)) return payload.data.users.items;
    if (Array.isArray(payload?.data?.items)) return payload.data.items;
    if (Array.isArray(payload?.data?.profiles)) return payload.data.profiles;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.profiles)) return payload.profiles;
    if (Array.isArray(payload)) return payload;
    return [];
  };

  const findMatchedParentUser = (items: any[], email: string, phone: string) => {
    const normalizedEmail = normalizeText(email);

    return (
      items.find((item) => {
        const itemEmail = normalizeText(item?.email);
        if (normalizedEmail && itemEmail && itemEmail === normalizedEmail) {
          return true;
        }

        if (phone && isSamePhone(item?.phoneNumber || item?.phone, phone)) {
          return true;
        }

        return false;
      }) || null
    );
  };

  const findExistingParentContext = async (
    emailInput: string,
    phoneInput: string,
  ): Promise<ExistingParentContext | null> => {
    const token = getAccessToken();
    if (!token) return null;

    const normalizedEmail = String(emailInput || "").trim();
    const normalizedPhoneInput = String(phoneInput || "").trim();

    if (!normalizedEmail && !normalizedPhoneInput) {
      return null;
    }

    const candidateUsers = new Map<string, any>();
    const searchTerms = Array.from(
      new Set([normalizedEmail, normalizedPhoneInput].filter(Boolean)),
    );

    const fetchParentUsers = async (search?: string) => {
      const params = new URLSearchParams({
        role: "Parent",
        pageNumber: "1",
        pageSize: "100",
      });
      if (search) params.append("search", search);

      const response = await fetch(`${USER_ENDPOINTS.GET_ALL}?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json().catch(() => ({}));
      const items = extractItems(payload);

      items.forEach((item: any) => {
        const id = String(item?.id || item?.userId || "").trim();
        if (id) {
          candidateUsers.set(id, item);
        }
      });
    };

    for (const term of searchTerms) {
      await fetchParentUsers(term);
    }

    if (candidateUsers.size === 0) {
      await fetchParentUsers();
    }

    const matchedUser = findMatchedParentUser(
      Array.from(candidateUsers.values()),
      normalizedEmail,
      normalizedPhoneInput,
    );

    if (!matchedUser) {
      return null;
    }

    const userId = String(matchedUser?.id || matchedUser?.userId || "").trim();
    if (!userId) {
      return null;
    }

    let parentProfile =
      Array.isArray(matchedUser?.profiles) && matchedUser.profiles.length > 0
        ? matchedUser.profiles.find(
            (profile: any) => normalizeText(profile?.profileType) === "parent",
          )
        : null;

    if (!parentProfile) {
      const profileParams = new URLSearchParams({
        profileType: "Parent",
        userId,
        pageNumber: "1",
        pageSize: "50",
      });

      const profileResponse = await fetch(
        `${PROFILE_ENDPOINTS.GET_ALL}?${profileParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (profileResponse.ok) {
        const profilePayload = await profileResponse.json().catch(() => ({}));
        const profileItems = extractItems(profilePayload);
        parentProfile =
          profileItems.find(
            (profile: any) => normalizeText(profile?.profileType) === "parent",
          ) || null;
      }
    }

    const parentProfileId = String(
      parentProfile?.id || parentProfile?.profileId || "",
    ).trim();

    return {
      userId,
      email: String(matchedUser?.email || normalizedEmail || "").trim(),
      phoneNumber: String(
        matchedUser?.phoneNumber || matchedUser?.phone || normalizedPhoneInput || "",
      ).trim(),
      displayName: String(
        matchedUser?.name ||
          matchedUser?.fullName ||
          matchedUser?.username ||
          leadInfo?.contactName ||
          "",
      ).trim(),
      parentProfileId: parentProfileId || undefined,
      parentProfileDisplayName: String(
        parentProfile?.displayName || parentProfile?.fullName || "",
      ).trim(),
    };
  };

  const handleUseExistingParentContext = (skipParentProfile: boolean) => {
    if (!existingParentContext) return;

    setHasUsedExistingContext(true);
    setError(null);
    setCreatedUserId(existingParentContext.userId);
    setAccountForm((prev) => ({
      ...prev,
      email: existingParentContext.email || prev.email,
      phoneNumber: existingParentContext.phoneNumber || prev.phoneNumber,
      name: existingParentContext.displayName || prev.name,
    }));

    if (skipParentProfile && existingParentContext.parentProfileId) {
      setCreatedParentProfileId(existingParentContext.parentProfileId);
      setParentProfileForm((prev) => ({
        ...prev,
        displayName:
          existingParentContext.parentProfileDisplayName ||
          existingParentContext.displayName ||
          prev.displayName,
      }));
      setCurrentStep("student-profile");
      toast({
        title: "Đã dùng tài khoản phụ huynh hiện có",
        description:
          "Bỏ qua bước tạo tài khoản và profile phụ huynh. Tiếp tục tạo profile học viên cho bé.",
        variant: "success",
      });
      return;
    }

    setCurrentStep("parent-profile");
    toast({
      title: "Đã dùng tài khoản phụ huynh hiện có",
      description: "Tiếp tục tạo profile phụ huynh cho tài khoản hiện có.",
      variant: "success",
    });
  };

  const translateAccountError = (payload: any, fallback: string) => {
    const code = String(payload?.code || "").trim();
    const title = String(payload?.title || "").trim();
    const detail = String(payload?.detail || payload?.message || "").trim();

    if (code === "Users.EmailNotUnique" || title === "Users.EmailNotUnique") {
      return "Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.";
    }

    if (
      code === "Users.PhoneNumberNotUnique" ||
      code === "Users.PhoneNotUnique" ||
      title === "Users.PhoneNumberNotUnique" ||
      title === "Users.PhoneNotUnique"
    ) {
      return "Số điện thoại đã tồn tại trong hệ thống. Vui lòng dùng số khác.";
    }

    const normalized = `${toLower(detail)} ${toLower(title)}`;
    if (normalized.includes("email") && normalized.includes("not unique")) {
      return "Email đã tồn tại trong hệ thống. Vui lòng dùng email khác.";
    }
    if (
      (normalized.includes("phone") ||
        normalized.includes("sđt") ||
        normalized.includes("so dien thoai")) &&
      normalized.includes("not unique")
    ) {
      return "Số điện thoại đã tồn tại trong hệ thống. Vui lòng dùng số khác.";
    }

    return getApiMessage(payload, fallback);
  };

  const handleConvertToEnrolled = async (studentProfileId: string) => {
    const token = getAccessToken();

    if (!token) {
      throw new Error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
    }

    if (!test?.id || !studentProfileId) {
      throw new Error("Thiếu dữ liệu test hoặc hồ sơ học viên để chuyển đổi.");
    }

    const response = await fetch(
      PLACEMENT_TEST_ENDPOINTS.CONVERT_TO_ENROLLED(test.id),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentProfileId }),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(
        getApiMessage(data, "Không thể chuyển đổi thành học viên")
      );
    }

    return getApiMessage(data, "Đã chuyển đổi thành học viên thành công.");
  };

  // Reset form when leadInfo changes
  const resetForm = () => {
    setCurrentStep("account");
    setError(null);
    setConvertStatus("idle");
    setConvertMessage("");
    setExistingParentContext(null);
    setIsCheckingExistingContext(false);
    setHasUsedExistingContext(false);
    setCreatedUserId(null);
    setCreatedParentProfileId(null);
    setCreatedStudentProfileId(null);
    setAccountForm(initialAccountForm);
    setParentProfileForm(initialParentProfileForm);
    setStudentProfileForm(initialStudentProfileForm);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [
    isOpen,
    initialAccountForm,
    initialParentProfileForm,
    initialStudentProfileForm,
  ]);

  useEffect(() => {
    if (!isOpen || currentStep !== "account") return;

    const email = String(accountForm.email || "").trim();
    const phone = String(accountForm.phoneNumber || "").trim();

    if (!email && !phone) {
      setExistingParentContext(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setIsCheckingExistingContext(true);
      try {
        const detected = await findExistingParentContext(email, phone);
        if (!cancelled) {
          setExistingParentContext(detected);
        }
      } catch (lookupError) {
        console.warn("Could not lookup existing parent context:", lookupError);
        if (!cancelled) {
          setExistingParentContext(null);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingExistingContext(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    isOpen,
    currentStep,
    accountForm.email,
    accountForm.phoneNumber,
  ]);

  const handleCreateAccount = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();
      const response = await fetch(USER_ENDPOINTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: accountForm.email,
          username: accountForm.username,
          phoneNumber: accountForm.phoneNumber,
          role: accountForm.role,
          password: accountForm.password,
          branchId: accountForm.branchId,
          name: accountForm.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(translateAccountError(data, "Không thể tạo tài khoản"));
      }

      // Extract user ID from response
      const userId =
        data.data?.id || data.data?.userId || data.id || data.userId;
      if (!userId) {
        throw new Error("Không nhận được ID tài khoản từ server");
      }

      setCreatedUserId(userId);
      setCreatedParentProfileId(null);
      setHasUsedExistingContext(false);
      setCurrentStep("parent-profile");
      toast({
        title: "Tạo tài khoản thành công",
        description: "Đã tạo tài khoản phụ huynh. Đang chuyển sang bước tạo profile phụ huynh.",
        variant: "success",
      });
    } catch (err: any) {
      const message = err?.message || "Có lỗi xảy ra khi tạo tài khoản";
      const normalizedMessage = toLower(message);
      const looksLikeDuplicate =
        normalizedMessage.includes("đã tồn tại") ||
        normalizedMessage.includes("not unique");

      if (looksLikeDuplicate) {
        try {
          const detected = await findExistingParentContext(
            accountForm.email,
            accountForm.phoneNumber,
          );
          if (detected) {
            setExistingParentContext(detected);
            setError(
              detected.parentProfileId
                ? `${message} Hệ thống đã tìm thấy tài khoản và profile phụ huynh. Bạn có thể dùng tài khoản hiện có để bỏ qua 2 bước đầu.`
                : `${message} Hệ thống đã tìm thấy tài khoản phụ huynh. Bạn có thể dùng tài khoản hiện có để tiếp tục.`,
            );
          } else {
            setError(message);
          }
        } catch {
          setError(message);
        }
      } else {
        setError(message);
      }

      toast({
        title: "Tạo tài khoản thất bại",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateParentProfile = async () => {
    if (!createdUserId) {
      setError(
        "Chưa có userId từ bước tạo tài khoản. Bạn đang ở chế độ test Tiếp tục."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();
      const response = await fetch(PROFILE_ENDPOINTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: createdUserId,
          profileType: "Parent",
          displayName: parentProfileForm.displayName,
          pinHash: parentProfileForm.pinHash,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getApiMessage(data, "Không thể tạo profile phụ huynh"));
      }

      const parentProfileId =
        data.data?.id || data.data?.profileId || data.id;
      if (!parentProfileId) {
        throw new Error("Không nhận được ID profile phụ huynh từ server");
      }

      setCreatedParentProfileId(parentProfileId);
      setCurrentStep("student-profile");
      toast({
        title: "Tạo profile phụ huynh thành công",
        description: "Đã tạo profile phụ huynh. Tiếp tục tạo profile học viên.",
        variant: "success",
      });
    } catch (err: any) {
      const message = err?.message || "Có lỗi xảy ra khi tạo profile phụ huynh";
      setError(message);
      toast({
        title: "Tạo profile phụ huynh thất bại",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStudentProfile = async () => {
    if (!createdUserId) {
      setError(
        "Chưa có userId từ bước tạo tài khoản. Bạn đang ở chế độ test Tiếp tục."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = getAccessToken();

      // Create student profile
      const response = await fetch(PROFILE_ENDPOINTS.CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: createdUserId,
          profileType: "Student",
          displayName: studentProfileForm.displayName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getApiMessage(data, "Không thể tạo profile học viên"));
      }

      const studentProfileIdRaw =
        data.data?.id || data.data?.profileId || data.id;
      const studentProfileId = studentProfileIdRaw
        ? String(studentProfileIdRaw)
        : "";

      if (!studentProfileId) {
        throw new Error("Không nhận được ID profile học viên từ server");
      }

      setCreatedStudentProfileId(studentProfileId);

      // Link student to parent if both profiles exist
      if (createdParentProfileId && studentProfileId) {
        try {
          await fetch(PROFILE_ENDPOINTS.LINK, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              parentProfileId: createdParentProfileId,
              studentProfileId: studentProfileId,
            }),
          });
        } catch (linkErr) {
          console.warn("Could not link student to parent:", linkErr);
        }
      }

      setCurrentStep("convert");
      toast({
        title: "Thành công",
        description: "Đã tạo profile học viên. Đang chuyển sang bước chuyển thành học viên.",
        variant: "success",
      });
    } catch (err: any) {
      const message = err?.message || "Có lỗi xảy ra khi tạo profile học viên";
      setError(message);
      toast({
        title: "Tạo profile học viên thất bại",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertStep = async () => {
    if (!createdStudentProfileId) {
      setError("Không có student profile để chuyển đổi thành học viên.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const message = await handleConvertToEnrolled(createdStudentProfileId);
      setConvertStatus("success");
      setConvertMessage(message);
      toast({
        title: "Chuyển đổi thành học viên thành công",
        description: message,
        variant: "success",
      });
      setCurrentStep("done");
    } catch (err: any) {
      const message = err?.message || "Không thể chuyển đổi thành học viên";
      setConvertStatus("failed");
      setConvertMessage(message);
      setError(message);
      toast({
        title: "Chuyển đổi thành học viên thất bại",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (currentStep === "convert" && convertStatus === "idle" && !isSubmitting) {
      handleConvertStep();
    }
  }, [currentStep, convertStatus, isSubmitting]);

  const handleClose = () => {
    if (currentStep === "done") {
      onSuccess();
    }
    resetForm();
    onClose();
  };

  if (!isOpen || !test) return null;

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: "account", label: "Tạo tài khoản", icon: UserPlus },
    { key: "parent-profile", label: "Profile Phụ huynh", icon: User },
    { key: "student-profile", label: "Profile Học viên", icon: Users },
    { key: "convert", label: "Chuyển thành học viên", icon: UserPlus },
    { key: "done", label: "Hoàn tất", icon: CheckCircle2 },
  ];

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-9999 p-3 animate-in fade-in duration-200" onClick={handleClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 via-red-600 to-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
              <UserPlus size={20} />
            </div>
            <span>Tạo tài khoản & Profile</span>
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-all hover:scale-110 text-white hover:shadow-lg cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-3 bg-gradient-to-b from-gray-50 to-white border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === stepIndex;
              const isCompleted = idx < stepIndex;
              return (
                <div key={step.key} className="flex items-center flex-1 gap-1.5">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap text-xs ${
                      isActive
                        ? "bg-red-100 text-red-700 border-2 border-red-500 shadow-md scale-105"
                        : isCompleted
                          ? "bg-gradient-to-r from-red-400 to-red-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} className="flex-shrink-0" />
                    ) : (
                      <Icon size={14} className="flex-shrink-0" />
                    )}
                    <span className="hidden sm:inline text-xs">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 rounded-full transition-all ${
                        isCompleted ? "bg-gradient-to-r from-red-400 to-red-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-lg text-red-700 text-xs font-medium shadow-sm animate-in slide-in-from-top duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Step 1: Create Account */}
          {currentStep === "account" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-rose-50 to-red-50 border-l-4 border-rose-400 rounded-lg p-3 text-xs text-rose-700 shadow-sm">
                <p className="font-medium">Hướng dẫn:</p>
                <p className="mt-1">Tạo tài khoản đăng nhập cho phụ huynh từ thông tin lead. Mật khẩu mặc định là <strong>123456</strong>.</p>
                <p className="mt-1">Nếu lead có 2 bé và phụ huynh đã có tài khoản/profile, bạn có thể bỏ qua bước này để tránh tạo trùng.</p>
              </div>

              <div className="space-y-2">
                {isCheckingExistingContext && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin shrink-0" />
                    <span>Đang kiểm tra tài khoản/profile phụ huynh đã tồn tại...</span>
                  </div>
                )}

                {existingParentContext?.parentProfileId && (
                  <div className="rounded-lg border border-emerald-200 bg-linear-to-r from-emerald-50 to-green-50 p-3 text-xs text-emerald-800 shadow-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Đã tìm thấy tài khoản + profile phụ huynh</p>
                        <p className="mt-0.5">Lead này có thể là bé thứ 2 của cùng phụ huynh. Bạn có thể bỏ qua 2 bước đầu và đi tiếp.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                      <div className="rounded-md border border-emerald-200 bg-white px-2 py-1.5">
                        <p className="text-emerald-600 font-medium">Email</p>
                        <p className="text-gray-700 truncate">{existingParentContext.email || "-"}</p>
                      </div>
                      <div className="rounded-md border border-emerald-200 bg-white px-2 py-1.5">
                        <p className="text-emerald-600 font-medium">Số điện thoại</p>
                        <p className="text-gray-700 truncate">{existingParentContext.phoneNumber || "-"}</p>
                      </div>
                      <div className="rounded-md border border-emerald-200 bg-white px-2 py-1.5">
                        <p className="text-emerald-600 font-medium">Profile phụ huynh</p>
                        <p className="text-gray-700 truncate">{existingParentContext.parentProfileDisplayName || existingParentContext.displayName || "-"}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleUseExistingParentContext(true)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 bg-white font-semibold hover:bg-emerald-100 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Bỏ qua 2 bước đầu
                      </button>
                    </div>
                  </div>
                )}

                {existingParentContext && !existingParentContext.parentProfileId && (
                  <div className="rounded-lg border border-amber-200 bg-linear-to-r from-amber-50 to-yellow-50 p-3 text-xs text-amber-800 shadow-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle size={14} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Đã tìm thấy tài khoản phụ huynh</p>
                        <p className="mt-0.5">Tài khoản phụ huynh đã tồn tại nhưng chưa thấy profile phụ huynh. Bạn có thể dùng tài khoản hiện có để tiếp tục.</p>
                      </div>
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleUseExistingParentContext(false)}
                        disabled={isSubmitting}
                        className="px-3 py-1.5 rounded-md border border-amber-300 text-amber-800 bg-white font-semibold hover:bg-amber-100 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        Dùng tài khoản hiện có
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <User size={12} />
                    </div>
                    Họ tên
                  </label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nhập họ tên"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <Mail size={12} />
                    </div>
                    Email
                  </label>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(e) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <User size={12} />
                    </div>
                    Username
                  </label>
                  <input
                    type="text"
                    value={accountForm.username}
                    onChange={(e) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        username: e.target.value,
                      }))
                    }
                    placeholder="Tên đăng nhập"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <Phone size={12} />
                    </div>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={accountForm.phoneNumber}
                    onChange={(e) =>
                      setAccountForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    placeholder="+84..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-gray-100 rounded-lg text-gray-600">
                      <Lock size={12} />
                    </div>
                    Mật khẩu (mặc định)
                  </label>
                  <input
                    type="text"
                    value={accountForm.password}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600 font-mono text-center"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <Building2 size={12} />
                    </div>
                    Chi nhánh
                  </label>
                  <input
                    type="text"
                    value={leadInfo?.branchName || accountForm.branchId}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleCreateAccount}
                  disabled={
                    isSubmitting || !accountForm.email || !accountForm.username
                  }
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {isSubmitting ? "Đang tạo..." : "Tạo tài khoản"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Create Parent Profile */}
          {currentStep === "parent-profile" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400 rounded-lg p-3 text-xs text-emerald-700 shadow-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  <p>
                    <span className="font-semibold">✓ Hoàn tất!</span>{" "}
                    {hasUsedExistingContext
                      ? "Đã dùng tài khoản phụ huynh hiện có. Tiếp tục tạo profile phụ huynh."
                      : "Tài khoản đã được tạo thành công. Tiếp tục tạo profile phụ huynh."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <User size={12} />
                    </div>
                    Tên hiển thị (Display Name)
                  </label>
                  <input
                    type="text"
                    value={parentProfileForm.displayName}
                    onChange={(e) =>
                      setParentProfileForm((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên hiển thị"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <Lock size={12} />
                    </div>
                    Mã PIN (để chuyển đổi profile)
                  </label>
                  <input
                    type="text"
                    value={parentProfileForm.pinHash}
                    onChange={(e) =>
                      setParentProfileForm((prev) => ({
                        ...prev,
                        pinHash: e.target.value,
                      }))
                    }
                    placeholder="Nhập mã PIN 4 số"
                    maxLength={6}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-400"
                  />
                  <p className="text-xs text-gray-500">VD: 1234 hoặc 5678</p>
                </div>
              </div>

              <div className="flex justify-between pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep("account")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleCreateParentProfile}
                  disabled={
                    isSubmitting || !parentProfileForm.displayName || !createdUserId
                  }
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <User size={16} />
                  )}
                  {isSubmitting
                    ? "Đang tạo..."
                    : "Tạo profile phụ huynh"}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Create Student Profile */}
          {currentStep === "student-profile" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400 rounded-lg p-3 text-xs text-emerald-700 shadow-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  <p>
                    <span className="font-semibold">✓ Hoàn tất!</span>{" "}
                    {hasUsedExistingContext && createdParentProfileId
                      ? "Đã dùng profile phụ huynh hiện có. Bây giờ tạo profile cho học viên."
                      : "Profile phụ huynh đã được tạo thành công. Bây giờ tạo profile cho học viên."}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                    <div className="p-1 bg-red-100 rounded-lg text-red-600">
                      <Users size={12} />
                    </div>
                    Tên hiển thị học viên (Display Name)
                  </label>
                  <input
                    type="text"
                    value={studentProfileForm.displayName}
                    onChange={(e) =>
                      setStudentProfileForm((prev) => ({
                        ...prev,
                        displayName: e.target.value,
                      }))
                    }
                    placeholder="Nhập tên hiển thị học viên"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-500 outline-none transition-all bg-white hover:border-gray-400"
                  />
                </div>
              </div>
              
              <div className="flex justify-between pt-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep("parent-profile")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleCreateStudentProfile}
                  disabled={
                    isSubmitting || !studentProfileForm.displayName || !createdUserId
                  }
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Users size={16} />
                  )}
                  {isSubmitting
                    ? "Đang tạo..."
                    : "Tạo profile học viên"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Convert To Enrolled */}
          {currentStep === "convert" && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-400 rounded-lg p-3 text-xs text-emerald-700 shadow-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  <p><span className="font-semibold">✓ Hoàn tất!</span> Profile học viên đã được tạo thành công. Hệ thống đang chuyển thành học viên.</p>
                </div>
              </div>

              <div className="rounded-lg border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-cyan-50 p-3 text-sm shadow-sm">
                {isSubmitting && (
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <Loader2 size={14} className="animate-spin flex-shrink-0" />
                    <span className="text-xs">Đang chuyển thành học viên...</span>
                  </div>
                )}
                {!isSubmitting && convertStatus === "failed" && (
                  <p className="text-rose-700 font-medium text-xs">
                    ❌ Chuyển thành học viên thất bại: {convertMessage}
                  </p>
                )}
              </div>

              {!isSubmitting && convertStatus === "failed" && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleConvertStep}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <UserPlus size={16} />
                    Thử lại chuyển đổi
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Done */}
          {currentStep === "done" && (
            <div className="text-center py-4 space-y-4 animate-in fade-in duration-500">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center mx-auto shadow-2xl animate-in zoom-in-50 duration-700">
                <CheckCircle2 size={32} className="text-white" />
              </div>
              
              <div className="space-y-1">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  Hoàn tất!
                </h3>
                <p className="text-sm text-gray-600">
                  {hasUsedExistingContext
                    ? "Đã dùng tài khoản phụ huynh hiện có và hoàn tất tạo profile học viên"
                    : "Tài khoản và profile đã được tạo thành công"}
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-left text-xs space-y-2 shadow-sm">
                <div className="font-semibold text-gray-900 text-center mb-3">📋 Trạng thái</div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">✓</div>
                  <p className="text-gray-700">
                    {hasUsedExistingContext
                      ? "Profile học viên được tạo và liên kết với tài khoản phụ huynh hiện có"
                      : <>
                          Tài khoản và profile được tạo với trạng thái <strong className="text-amber-600">chưa kích hoạt</strong>
                        </>}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">✓</div>
                  <p className="text-gray-700">Admin sẽ kiểm tra và kích hoạt các profile trong danh sách chờ</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">✓</div>
                  <p className="text-gray-700">Phụ huynh sẽ nhận email để xác minh profile</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">✓</div>
                  <p className="text-emerald-700 font-medium">Chuyển đổi thành học viên: ✓ Thành công</p>
                </div>
              </div>

              <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-left space-y-2 shadow-sm">
                <div className="font-bold text-gray-900 flex items-center gap-1.5 text-sm">
                  <Lock size={14} className="text-red-600" />
                  Thông tin tài khoản phụ huynh
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-mono font-semibold text-gray-800 text-xs">
                      {hasUsedExistingContext
                        ? existingParentContext?.email || accountForm.email
                        : accountForm.email}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200 text-sm">
                    <span className="text-gray-600">
                      {hasUsedExistingContext ? "Trạng thái:" : "Mật khẩu:"}
                    </span>
                    <span className="font-mono font-semibold text-gray-800 text-xs">
                      {hasUsedExistingContext
                        ? "Đã dùng tài khoản hiện có"
                        : accountForm.password}
                    </span>
                  </div>
                </div>
                {hasUsedExistingContext && (
                  <p className="text-xs text-amber-700">
                    Mật khẩu của tài khoản phụ huynh được giữ nguyên như trước đó.
                  </p>
                )}
              </div>

              <button
                onClick={handleClose}
                className="w-full mt-3 px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-sm hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                Đóng & Hoàn tất
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}