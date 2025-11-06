import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LoginCard from "@/components/auth/LoginCard";
import ForgotPasswordCard from "@/components/auth/ForgotPasswordCard";

export const dynamic = "force-dynamic";

async function setRole(formData: FormData) {
  "use server";
  const role = String(formData.get("role") || "customer");
  const returnTo = String(formData.get("returnTo") || `/portal/${role}`);
  (await cookies()).set("role", role, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect(returnTo);
}

type SP = { [k: string]: string | string[] | undefined };

export default function AuthPage({ searchParams }: { searchParams?: SP }) {
  const view = (searchParams?.view as string | undefined)?.toLowerCase() ?? "login";
  const returnTo = (searchParams?.returnTo as string | undefined) ?? "";

  // Nếu view không phải login hoặc forgotpass, redirect về login
  if (view !== "login" && view !== "forgotpass") {
    const keep = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams || {})) {
      if (k === "view") continue;
      if (typeof v === "string") keep.set(k, v);
    }
    const qs = keep.toString();
    redirect(`/auth?view=login${qs ? `&${qs}` : ""}`);
  }

  // Truyền các props cho ForgotPasswordCard và LoginCard
  return (
    <div className="w-full">
      {view === "forgotpass" ? (
        <ForgotPasswordCard 
          formData={{ email: "" }} 
          setFormData={() => {}}  
          onSubmit={() => {}}     
          onResend={() => {}}     
          isLoading={false}    
          apiError={null}         
          currentStep="input"    
          countdown={60}        
          canResend={true}       
        />
      ) : (
        <LoginCard 
          action={setRole} 
          returnTo={returnTo}
        />
      )}
    </div>
  );
}
