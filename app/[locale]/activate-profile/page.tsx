// app/[locale]/activate-profile/page.tsx
import { Suspense } from 'react';
import ActivateProfileClient from './ActivateProfileClient';
import type { Locale } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default async function ActivateProfilePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  // params consumed to satisfy Next.js dynamic segment; locale is available if needed
  await params;

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
        </div>
      }
    >
      <ActivateProfileClient />
    </Suspense>
  );
}
