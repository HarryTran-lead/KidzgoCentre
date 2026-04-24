"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SparkleNavbar from "@/components/lightswind/sparkle-navbar";

type NavItem =
  | { id: string; label: string; kind: "section" }
  | { id: string; label: string; kind: "route"; href: string };

interface SparkleNavbarWithNavigationProps {
  items: NavItem[];
  isHomePage: boolean;
  activeIndex: number;
  onSmoothScroll: (id: string) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

function getHeaderOffsetPx() {
  if (typeof window === "undefined") return 64;
  const v = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--app-header-h"
    )
  );
  return Number.isFinite(v) ? v : 64;
}

export default function SparkleNavbarWithNavigation({
  items,
  isHomePage,
  activeIndex,
  onSmoothScroll,
  onLoadingChange,
}: SparkleNavbarWithNavigationProps) {
  const router = useRouter();
  const labels = items.map((item) => item.label);

  const handleItemClick = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;

      // Trigger loading
      onLoadingChange?.(true);

      if (item.kind === "section") {
        if (isHomePage) {
          onSmoothScroll(item.id);
        } else {
          // Navigate to home with hash
          router.push(`/#${item.id}`);
        }
      } else if (item.kind === "route") {
        router.push(item.href);
      }
    },
    [items, isHomePage, router, onSmoothScroll, onLoadingChange]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const button = target.closest("button");
        if (!button) return;

        const li = button.closest("li");
        if (!li) return;

        const ul = li.parentElement;
        if (!ul) return;

        const liElements = Array.from(ul.querySelectorAll("li"));
        const index = liElements.indexOf(li);
        if (index !== -1) {
          handleItemClick(index);
        }
      }}
    >
      <SparkleNavbar 
        items={labels} 
        color="#dc2626"
        activeIndex={activeIndex}
        onItemClick={handleItemClick}
      />
    </motion.div>
  );
}
