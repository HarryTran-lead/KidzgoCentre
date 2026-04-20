"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import ResetPinCard from "@/components/auth/ResetPinCard";
import LoadingSpinner from "@/components/ui/loadingSpinner";
import { type Locale } from "@/lib/i18n";

function ResetPinContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const locale = (params?.locale as Locale) ?? "vi";

  return (
    <div className="w-full">
      <ResetPinCard token={token} locale={locale} />
    </div>
  );
}

export default function ResetPinPage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full max-w-sm items-center justify-center rounded-2xl bg-white p-8 shadow-xl">
          <LoadingSpinner color="green" size="8" />
        </div>
      }
    >
      <ResetPinContent />
    </Suspense>
  );
}
