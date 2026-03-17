"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ResetPasswordCard from "@/components/auth/ResetPasswordCard";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { type Locale } from "@/lib/i18n";

function ResetPasswordContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const locale = (params?.locale as Locale) ?? "vi";

  return (
    <div className="w-full">
      <ResetPasswordCard token={token} locale={locale} />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-sm p-8 rounded-2xl bg-white shadow-xl flex items-center justify-center">
          <LoadingSpinner color="green" size="8" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
