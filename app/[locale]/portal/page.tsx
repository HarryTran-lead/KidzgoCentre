// app/[locale]/portal/page.tsx (SERVER)
import { redirect } from "next/navigation";
import { localizePath, type Locale } from "@/lib/i18n";
import { getSession } from "@/lib/auth";
import { normalizeRole, ROLES, type Role } from "@/lib/role";

export default async function PortalIndex({ params }: { params: { locale: Locale } }) {
  const s = await getSession();
  const devBypass = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "1";
  const fallbackRole: Role = normalizeRole(process.env.NEXT_PUBLIC_DEV_ROLE || "ADMIN");

  const role: Role =
    s?.role ? normalizeRole(s.role) : (devBypass ? fallbackRole : (null as any));

  if (!role) {
    redirect(localizePath(`/auth/login?returnTo=/portal`, params.locale));
  }

  redirect(localizePath(ROLES[role], params.locale));
}
