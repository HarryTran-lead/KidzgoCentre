// app/[locale]/auth/login/page.tsx
import { redirect } from "next/navigation";
import { localizePath, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// Chuyển thẳng tới trang login phụ huynh (bỏ chọn card)
export default async function LoginPage(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;
  redirect(localizePath("/auth/login/parent", locale));
}
