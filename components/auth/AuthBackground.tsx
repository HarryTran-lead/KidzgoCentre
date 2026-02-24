"use client";

import { motion } from "framer-motion";

export default function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Base soft gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-rose-100 via-sky-50 to-amber-100" />

      {/* Decorative moving blobs - red and gray tones */}
      <motion.div
        className="absolute -top-24 -left-20 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(220, 38, 38, 0.15), transparent)" }}
        animate={{ y: [0, 20, 0], x: [0, 16, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-28 -right-24 h-96 w-96 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(75, 85, 99, 0.12), transparent)" }}
        animate={{ y: [0, -24, 0], x: [0, -14, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
      />
      <motion.div
        className="absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(closest-side, rgba(156, 163, 175, 0.1), transparent)" }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
      />

      {/* Tiny dotted pattern overlay */}
      <svg className="absolute inset-0 opacity-[0.08]" width="100%" height="100%">
        <defs>
          <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#dc2626" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}
