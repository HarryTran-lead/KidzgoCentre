// app/[locale]/auth/login/page.tsx
import LoginCard from "@/components/auth/LoginCard";
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
  const jar = await cookies();

  // Xoá sạch mọi cookie role cũ để tránh “dính” role sai
  for (const key of ["role", "session-role", "x-role"]) {
    jar.set(key, "", { path: "/", expires: new Date(0) });
  }

  const account = authenticateDemoAccount(email, password, locale);

  // Sai email / password → quay lại đúng trang login kèm ?error=invalid
  if (!account) {
    redirect(localizePath("/auth/login?error=invalid", locale));
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

  // CHỈ set cookie role nếu account.role có giá trị
  // ACC-FAMILY có role = null → KHÔNG set role => /portal hiển thị AccountChooser
  if (account.role) {
    jar.set("role", account.role, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }

  // Với admin/teacher/staff → targetPath là /[locale]/portal/...
  // Với FAMILY → targetPath là /[locale]/portal (AccountChooser)
  redirect(account.targetPath);
}

// Next 15: params & searchParams là Promise nên phải await
export default async function LoginPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await props.params;
  const sp = await props.searchParams;

  // Đọc ?error=invalid (string hoặc string[])
  const rawError = sp?.error;
  const hasError =
    typeof rawError === "string"
      ? rawError === "invalid"
      : Array.isArray(rawError)
      ? rawError[0] === "invalid"
      : false;

  return (
    <div className="w-full">
      <LoginCard
        locale={locale}
        action={loginAction.bind(null, locale)}
        errorMessage={
          hasError
            ? "Email hoặc mật khẩu chưa chính xác. Vui lòng thử lại."
            : undefined
        }
      />
    </div>
  );
}
