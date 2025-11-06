// app/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic"; // để luôn đọc cookie mới nhất

export default async function Root() {
  const jar = await cookies();
  const cookieLocale =
    (jar.get("locale")?.value as Locale | undefined) ?? DEFAULT_LOCALE;

  // Ví dụ: /en hoặc /vi
  redirect(`/${cookieLocale}`);
}
