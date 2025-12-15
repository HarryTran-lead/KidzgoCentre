// app/[locale]/auth/register/page.tsx
import RegisterCard from "@/components/auth/RegisterCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { localizePath, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Server action: nhận thêm locale, rồi bind ở dưới
async function registerAction(locale: Locale, formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Validation
  if (!name || !email || !password || !confirmPassword) {
    redirect(localizePath("/auth/register?error=missing", locale));
  }

  if (password !== confirmPassword) {
    redirect(localizePath("/auth/register?error=mismatch", locale));
  }

  if (password.length < 6) {
    redirect(localizePath("/auth/register?error=weak", locale));
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    redirect(localizePath("/auth/register?error=invalid-email", locale));
  }

  // Trong demo, chỉ redirect về login với thông báo thành công
  // Trong production, bạn sẽ lưu user vào database ở đây
  redirect(localizePath("/auth/login?registered=1", locale));
}

// Next 15: params & searchParams là Promise nên phải await
export default async function RegisterPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await props.params;
  const sp = await props.searchParams;

  // Đọc các loại error
  const rawError = sp?.error;
  let errorMessage: string | undefined;

  if (typeof rawError === "string") {
    switch (rawError) {
      case "missing":
        errorMessage = "Vui lòng điền đầy đủ thông tin.";
        break;
      case "mismatch":
        errorMessage = "Mật khẩu xác nhận không khớp.";
        break;
      case "weak":
        errorMessage = "Mật khẩu phải có ít nhất 6 ký tự.";
        break;
      case "invalid-email":
        errorMessage = "Email không hợp lệ.";
        break;
      default:
        errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
    }
  } else if (Array.isArray(rawError) && rawError[0]) {
    switch (rawError[0]) {
      case "missing":
        errorMessage = "Vui lòng điền đầy đủ thông tin.";
        break;
      case "mismatch":
        errorMessage = "Mật khẩu xác nhận không khớp.";
        break;
      case "weak":
        errorMessage = "Mật khẩu phải có ít nhất 6 ký tự.";
        break;
      case "invalid-email":
        errorMessage = "Email không hợp lệ.";
        break;
      default:
        errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
    }
  }

  return (
    <div className="w-full">
      <RegisterCard
        locale={locale}
        action={registerAction.bind(null, locale)}
        errorMessage={errorMessage}
      />
    </div>
  );
}

