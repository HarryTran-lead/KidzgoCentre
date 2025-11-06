// app/auth/layout.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import AuthBackground from "@/components/auth/AuthBackground";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      {/* Pastel animated background */}
      <AuthBackground />

      <div className="relative z-10 min-h-screen flex flex-col ">
        {/* Top bar (nhẹ nhàng, có thể bỏ nếu không cần) */}

        <main className="flex-1 grid place-items-center px-4 pt-6 pb-2">
          {children}
        </main>
      </div>
    </div>
  );
}
