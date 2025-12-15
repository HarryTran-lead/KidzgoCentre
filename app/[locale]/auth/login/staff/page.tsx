// app/[locale]/auth/login/staff/page.tsx
import StaffLoginCard from "@/components/auth/StaffLoginCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { localizePath, type Locale } from "@/lib/i18n";
import { authenticateDemoAccount } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Server action: nhận thêm locale, rồi bind ở dưới
async function loginAction(locale: Locale, formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const branch = String(formData.get("branch") ?? "");
  const jar = await cookies();

  // Validation: Kiểm tra chi nhánh đã chọn
  if (!branch) {
    redirect(localizePath("/auth/login/staff?error=no-branch", locale));
  }

  // Xoá sạch mọi cookie role cũ để tránh "dính" role sai
  for (const key of ["role", "session-role", "x-role"]) {
    jar.set(key, "", { path: "/", expires: new Date(0) });
  }

  const account = authenticateDemoAccount(email, password, locale);

  // Sai email / password → quay lại đúng trang login kèm ?error=invalid
  if (!account) {
    redirect(localizePath("/auth/login/staff?error=invalid", locale));
  }

  // Lưu session cơ bản
  jar.set("session", `user:${account.id}`, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  jar.set("user-name", account.name, {
    path: "/",
    sameSite: "lax",
  });

  jar.set("user-avatar", account.avatar ?? "", {
    path: "/",
    sameSite: "lax",
  });

  // Lưu chi nhánh đã chọn
  jar.set("user-branch", branch, {
    path: "/",
    sameSite: "lax",
  });

  // CHỈ set cookie role nếu account.role có giá trị
  if (account.role) {
    jar.set("role", account.role, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  // Với admin/teacher/staff → targetPath là /[locale]/portal/...
  redirect(account.targetPath);
}

// Next 15: params & searchParams là Promise nên phải await
export default async function StaffLoginPage(props: {
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
      case "invalid":
        errorMessage = "Email hoặc mật khẩu chưa chính xác. Vui lòng thử lại.";
        break;
      case "no-branch":
        errorMessage = "Vui lòng chọn chi nhánh trung tâm.";
        break;
      default:
        errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
    }
  } else if (Array.isArray(rawError) && rawError[0]) {
    switch (rawError[0]) {
      case "invalid":
        errorMessage = "Email hoặc mật khẩu chưa chính xác. Vui lòng thử lại.";
        break;
      case "no-branch":
        errorMessage = "Vui lòng chọn chi nhánh trung tâm.";
        break;
      default:
        errorMessage = "Đã có lỗi xảy ra. Vui lòng thử lại.";
    }
  }

  return (
    <div className="w-full">
      <StaffLoginCard
        locale={locale}
        action={loginAction.bind(null, locale)}
        errorMessage={errorMessage}
      />
    </div>
  );
}

