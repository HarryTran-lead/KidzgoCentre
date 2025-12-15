// app/[locale]/portal/page.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";   // 👈 THÊM DÒNG NÀY
import { localizePath, type Locale } from "@/lib/i18n";
import { ROLES } from "@/lib/role";
import AccountChooser, { type PinState } from "@/app/[locale]/portal/student/AccountChooser";

const STUDENT_NAME = "Nguyễn Băng Ngân";
const PARENT_NAME = "Bố Khương";
const PARENT_PIN = process.env.PARENT_PORTAL_PIN ?? "2580";

async function setStudentRole(locale: Locale, _formData?: FormData) {
  "use server";
  const jar = await cookies();
  jar.set("role", "STUDENT", { path: "/", httpOnly: true, sameSite: "lax" });
  jar.set("user-name", STUDENT_NAME, { path: "/", sameSite: "lax" });
  jar.set("user-avatar", "", { path: "/", sameSite: "lax" });

  redirect(localizePath(ROLES.STUDENT, locale));
}

function setParentRole(locale: Locale) {
  return async (_prev: PinState, formData: FormData): Promise<PinState> => {
    "use server";
    const pin = String(formData.get("pin") || "").trim();

    if (pin !== PARENT_PIN) {
      return { error: "Mã PIN chưa đúng. Vui lòng thử lại." };
    }

    const jar = await cookies();
    jar.set("role", "PARENT", { path: "/", httpOnly: true, sameSite: "lax" });
    jar.set("user-name", PARENT_NAME, { path: "/", sameSite: "lax" });
    jar.set("user-avatar", "", { path: "/", sameSite: "lax" });

    redirect(localizePath(ROLES.PARENT, locale));
  };
}

export default async function PortalIndex(props: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await props.params;

  return (
    <AccountChooser
      locale={locale}
      studentName={STUDENT_NAME}
      parentName={PARENT_NAME}
      studentAction={setStudentRole.bind(null, locale)}
      parentAction={setParentRole(locale)}
    />
  );
}
