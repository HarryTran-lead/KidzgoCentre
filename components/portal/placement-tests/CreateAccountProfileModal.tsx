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
} from "lucide-react";
import { USER_ENDPOINTS, PROFILE_ENDPOINTS } from "@/constants/apiURL";
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

type Step = "account" | "parent-profile" | "student-profile" | "done";

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

  // Parent profile form
  const [parentProfileForm, setParentProfileForm] = useState(initialParentProfileForm);

  // Student profile form
  const [studentProfileForm, setStudentProfileForm] = useState(initialStudentProfileForm);

  // Reset form when leadInfo changes
  const resetForm = () => {
    setCurrentStep("account");
    setError(null);
    setCreatedUserId(null);
    setCreatedParentProfileId(null);
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
        throw new Error(data.message || "Không thể tạo tài khoản");
      }

      // Extract user ID from response
      const userId =
        data.data?.id || data.data?.userId || data.id || data.userId;
      if (!userId) {
        throw new Error("Không nhận được ID tài khoản từ server");
      }

      setCreatedUserId(userId);
      setCurrentStep("parent-profile");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo tài khoản");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateParentProfile = async () => {
    if (!createdUserId) return;

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
        throw new Error(data.message || "Không thể tạo profile phụ huynh");
      }

      const parentProfileId =
        data.data?.id || data.data?.profileId || data.id;
      if (!parentProfileId) {
        throw new Error("Không nhận được ID profile phụ huynh từ server");
      }

      setCreatedParentProfileId(parentProfileId);
      setCurrentStep("student-profile");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo profile phụ huynh");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateStudentProfile = async () => {
    if (!createdUserId) return;

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
        throw new Error(data.message || "Không thể tạo profile học viên");
      }

      const studentProfileId =
        data.data?.id || data.data?.profileId || data.id;

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

      setCurrentStep("done");
      toast({
        title: "Thành công",
        description: "Đã tạo tài khoản và profile thành công",
        variant: "success",
      });
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo profile học viên");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    { key: "done", label: "Hoàn tất", icon: CheckCircle2 },
  ];

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-9999 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-red-600 to-red-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <UserPlus size={24} />
            Tạo tài khoản & Profile
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === stepIndex;
              const isCompleted = idx < stepIndex;
              return (
                <div key={step.key} className="flex items-center gap-1">
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isActive
                        ? "bg-red-100 text-red-600 border border-red-700"
                        : isCompleted
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <Icon size={14} />
                    )}
                    <span className="hidden sm:inline">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <ChevronRight
                      size={14}
                      className={`mx-1 ${isCompleted ? "text-red-400" : "text-gray-300"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Step Content */}
        <div className="p-6">
          {/* Step 1: Create Account */}
          {currentStep === "account" && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
                Tạo tài khoản đăng nhập cho phụ huynh từ thông tin lead. Mật
                khẩu mặc định là <strong>123456</strong>.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <User size={14} />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Mail size={14} />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <User size={14} />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Phone size={14} />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Lock size={14} />
                    Mật khẩu (mặc định)
                  </label>
                  <input
                    type="text"
                    value={accountForm.password}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Building2 size={14} />
                    Chi nhánh
                  </label>
                  <input
                    type="text"
                    value={leadInfo?.branchName || accountForm.branchId}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleCreateAccount}
                  disabled={
                    isSubmitting || !accountForm.email || !accountForm.username
                  }
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-linear-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-700">
                <CheckCircle2 size={14} className="inline mr-1" />
                Tài khoản đã được tạo thành công! Tiếp tục tạo profile phụ
                huynh.
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <User size={14} />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Lock size={14} />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 outline-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                Profile sẽ được tạo với trạng thái <strong>chưa kích hoạt (isActive = false)</strong>.
                Admin sẽ xác nhận và kích hoạt sau.
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep("account")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Quay lại
                </button>
                <button
                  onClick={handleCreateParentProfile}
                  disabled={
                    isSubmitting || !parentProfileForm.displayName
                  }
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-linear-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
                <CheckCircle2 size={14} className="inline mr-1" />
                Profile phụ huynh đã được tạo thành công! Bây giờ tạo profile
                cho học viên.
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                    <Users size={14} />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none"
                  />
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                Profile học viên cũng sẽ được tạo với trạng thái{" "}
                <strong>chưa kích hoạt (isActive = false)</strong>. Admin sẽ xác
                nhận và kích hoạt sau.
              </div>

              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentStep("parent-profile")}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                  Quay lại
                </button>
                <button
                  onClick={handleCreateStudentProfile}
                  disabled={
                    isSubmitting || !studentProfileForm.displayName
                  }
                  className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-linear-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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

          {/* Step 4: Done */}
          {currentStep === "done" && (
            <div className="text-center py-8 space-y-4">
              <div className="w-20 h-20 rounded-full bg-linear-to-r from-red-400 to-red-500 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 size={40} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Hoàn tất!
              </h3>
              <div className="text-gray-600 space-y-1 text-sm">
                <p>
                  Tài khoản và profile đã được tạo thành công với trạng thái{" "}
                  <strong className="text-amber-600">chưa kích hoạt</strong>.
                </p>
                <p>
                  Admin sẽ xem danh sách và kích hoạt các profile này.
                </p>
                <p>
                  Sau đó phụ huynh sẽ đăng nhập và xác minh profile qua link
                  email.
                </p>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4 text-left text-sm space-y-2 mt-4">
                <div className="font-medium text-gray-800">
                  Thông tin đăng nhập:
                </div>
                <div className="grid grid-cols-2 gap-2 text-gray-600">
                  <span>Email:</span>
                  <span className="font-medium">{accountForm.email}</span>
                  <span>Mật khẩu:</span>
                  <span className="font-medium">{accountForm.password}</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="mt-4 px-8 py-2.5 rounded-lg bg-linear-to-r from-red-600 to-red-700 text-white font-medium hover:shadow-lg transition-all"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
