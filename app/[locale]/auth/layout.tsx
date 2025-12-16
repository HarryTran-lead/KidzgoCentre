// app/auth/layout.tsx
import type { ReactNode } from "react";
import AuthBackground from "@/components/auth/AuthBackground";
import Navbar from "@/components/home/Header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <Navbar />
      {/* Pastel animated background */}
      <AuthBackground />

      <div className="relative z-10 min-h-screen flex flex-col ">
        {/* Top bar (nhẹ nhàng, có thể bỏ nếu không cần) */}

        <main className="flex-1 grid place-items-center">
          {children}
        </main>
      </div>
    </div>
  );
}
