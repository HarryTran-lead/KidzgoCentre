"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  /** Ví dụ: https://www.facebook.com/kidzgoEnglish */
  url: string;
  /** Chiều rộng khung hiển thị bên ngoài. "100%" để responsive. */
  width?: number | "100%";
  /** Chiều cao khung plugin (px). */
  height?: number;
  showFacepile?: boolean;
  hideCover?: boolean;
  /** Tabs: "timeline" | "events" | "messages" | kết hợp */
  tabs?: "timeline" | "events" | "messages" | string;
};

/**
 * Facebook Page plugin - bản iframe thuần.
 * - Không nạp SDK -> không spam error lên console
 * - Lazy mount khi vào viewport -> nhẹ main thread
 * - sandbox để cô lập script bên trong iframe
 */
export default function FbFrame({
  url,
  width = "100%",
  height = 260,
  showFacepile = false,
  hideCover = false,
  tabs = "timeline",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const holderRef = useRef<HTMLDivElement | null>(null);

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

  // Lưu ý: width trong URL của FB phải là số.
  const widthParam = typeof width === "number" ? width : 500;

  const src =
    "https://www.facebook.com/plugins/page.php" +
    `?href=${encodeURIComponent(url)}` +
    `&tabs=${encodeURIComponent(tabs)}` +
    `&width=${widthParam}` +
    `&height=${height}` +
    `&small_header=false` +
    `&adapt_container_width=true` +
    `&hide_cover=${hideCover ? "true" : "false"}` +
    `&show_facepile=${showFacepile ? "true" : "false"}` +
    `&lazy=true`;

  return (
    <div
      ref={holderRef}
      className="w-full overflow-hidden rounded-xl ring-1 ring-slate-200/60 bg-white"
      style={{ contain: "content" }}
    >
      {mounted ? (
        <iframe
          title="Facebook Page"
          src={src}
          width={typeof width === "number" ? width : "100%"}
          height={height}
          style={{ border: "none", overflow: "hidden", display: "block" }}
          scrolling="no"
          frameBorder={0}
          loading="lazy"
          sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
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