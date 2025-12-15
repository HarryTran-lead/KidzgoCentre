// app/[locale]/portal/layout.tsx
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PortalLayout({ children, params }: Props) {
  return (
    <div className="h-dvh w-full">
          {/* Nội dung cuộn dưới header */}
          <div className="grow  bg-slate-50 min-w-0 overflow-y-auto">
            {children}
      </div>
    </div>
  );
}
