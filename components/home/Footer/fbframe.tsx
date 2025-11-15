"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  url: string; // Ví dụ: https://www.facebook.com/kidzgoEnglish
  height?: number; // chiều cao plugin
  showFacepile?: boolean;
  hideCover?: boolean;
  tabs?: string; // "timeline" | "events" | "messages" | kết hợp
  maxWidth?: number; // tối đa 520 theo doc FB
  minWidth?: number; // tối thiểu >= 180 theo doc FB
};

/**
 * Facebook Page plugin dạng <iframe>:
 * - Đo width container bằng ResizeObserver rồi clamp trong [minWidth, maxWidth]
 * - Remount iframe khi width đổi (key={w})
 * - Khớp width param == CSS width (tránh width=100%)
 */
export default function FbFrame({
  url,
  height = 260,
  showFacepile = false,
  hideCover = false,
  tabs = "timeline",
  maxWidth = 520,
  minWidth = 280,
}: Props) {
  const holderRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [w, setW] = useState<number>(
    Math.max(minWidth, Math.min(400, maxWidth))
  );

  // Lazy mount khi vào viewport
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setMounted(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Đo width container, clamp & chỉ set khi thực sự đổi
  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const cw = Math.floor(
        el.clientWidth || el.getBoundingClientRect().width || w
      );
      const next = Math.max(minWidth, Math.min(cw, maxWidth));
      if (next !== w) setW(next);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxWidth, minWidth, w]);

  const src = useMemo(() => {
    const params = new URLSearchParams({
      href: url,
      tabs,
      width: String(w), // FB yêu cầu số → khớp với CSS width
      height: String(height),
      small_header: "false",
      adapt_container_width: "true",
      hide_cover: hideCover ? "true" : "false",
      show_facepile: showFacepile ? "true" : "false",
      lazy: "true",
    });
    return `https://www.facebook.com/plugins/page.php?${params.toString()}`;
  }, [url, tabs, w, height, hideCover, showFacepile]);

  return (
    <div
      ref={holderRef}
      className="w-full overflow-hidden rounded-xl ring-1 ring-slate-200/60 bg-white"
      style={{ contain: "content" }}
    >
      {mounted ? (
        <iframe
          key={w} // ⬅️ remount khi width đổi
          title="Facebook Page"
          src={src}
          width={w} // ⬅️ khớp param
          height={height}
          style={{
            border: "none",
            overflow: "hidden",
            display: "block",
            width: `${w}px`, // ⬅️ KHÔNG dùng 100% nữa
            margin: "0 auto", // canh giữa trong holder
          }}
          scrolling="no"
          frameBorder={0}
          loading="lazy"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <div
          style={{ height }}
          className="animate-pulse bg-slate-100"
          aria-hidden
        />
      )}
    </div>
  );
}
