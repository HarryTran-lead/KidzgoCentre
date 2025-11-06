// app/[locale]/auth/login/page.tsx
import LoginCard from "@/components/auth/LoginCard";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

async function loginAction(formData: FormData) {
  "use server";
  const email = String(formData.get("email") || "");
  const _password = String(formData.get("password") || "");
  const returnTo = String(formData.get("returnTo") || "/");
  const jar = await cookies();
  jar.set("session", `user:${email}`, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
  redirect(returnTo);
}

// params & searchParams là Promise -> phải await
export default async function LoginPage(props: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await props.params;
  const sp = await props.searchParams;

  const returnTo = (sp?.returnTo as string | undefined) ?? `/${locale}/portal`;

  return (
    <div className="w-full">
      <LoginCard action={loginAction} returnTo={returnTo} locale={locale} />
    </div>
  );
}
