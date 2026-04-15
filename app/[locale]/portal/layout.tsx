// app/[locale]/portal/layout.tsx
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function PortalLayout({ children, params }: Props) {
  return (
    <div className="portal-zoom">
      {children}
    </div>
  );
}
