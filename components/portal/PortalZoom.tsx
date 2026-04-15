"use client";
import { useEffect } from "react";

export default function PortalZoom() {
  useEffect(() => {
    document.documentElement.style.zoom = "0.7";
    return () => {
      document.documentElement.style.zoom = "";
    };
  }, []);
  return null;
}
