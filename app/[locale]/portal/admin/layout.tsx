// app/[locale]/portal/layout.tsx
import type { ReactNode } from "react";
import Sidebar from "@/components/portal/sidebar";
import PortalHeader from "@/components/portal/header";
import { normalizeRole, type Role } from "@/lib/role";
import { getSession } from "@/lib/auth";
import { BACKEND_BRANCH_ENDPOINTS } from "@/constants/apiURL";
import type { GetAllBranchesApiResponse } from "@/types/branch";
import { cookies } from "next/headers";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PortalLayout({ children, params }: Props) {
  // Next 15: params là Promise nên phải await
  const session = await getSession();

  if (!session || !session.role) {
    return <div className="min-h-dvh bg-slate-50">{children}</div>;
  }

  // ✅ Từ đây trở xuống, chắc chắn đã có session + role → safe cho TypeScript
  const role: Role = normalizeRole(session.role);
  const user = session.user;

  // Fetch branches for Admin role - Gọi trực tiếp backend API từ server component
  let branches = undefined;
  if (role === "Admin") {
    try {
      // Lấy token từ cookie
      const cookieStore = await cookies();
      const accessToken = cookieStore.get("kidzgo.accessToken")?.value;
      
      if (!accessToken) {
        console.log("No access token found in cookies");
      } else {
        // Gọi trực tiếp backend API (không qua Next.js API route)
        const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
        const apiUrl = `${BASE_URL}${BACKEND_BRANCH_ENDPOINTS.GET_ALL}/all?isActive=true`;
        console.log("Fetching branches from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          cache: "no-store", // Không cache để luôn lấy data mới nhất
        });

        const data: GetAllBranchesApiResponse = await response.json();
        console.log("Branch API Response:", data);
        
        if (data.isSuccess && data.data) {
          branches = data.data.branches;
          console.log("Fetched branches successfully:", branches?.length, "branches");
        } else {
          console.log("No branches data or API failed:", data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  }
  
  console.log("Admin Layout - Role:", role, "Branches count:", branches ? branches.length : 0);

  return (
    <div className="h-dvh w-full">
      <div className="flex h-full">
        {/* Sidebar: desktop chiếm chỗ thật, mobile overlay ở trong chính component */}
        <Sidebar role={role} branches={branches} />

        {/* Cột nội dung: container cuộn chính */}
        <section className="flex min-w-0 flex-1 flex-col">
          {/* Header sticky trong cùng container */}
          <PortalHeader
            role={role}
            userName={user?.name}
            avatarUrl={user?.avatar}
          />

          {/* Nội dung cuộn dưới header */}
          <div className="grow px-4 sm:px-6 py-6 min-w-0 overflow-y-auto">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
}
