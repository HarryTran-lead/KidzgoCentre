"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      <div className="fixed bottom-4 right-4 z-[999999] flex flex-col gap-2 w-auto max-w-sm">
        {toasts.map((toast) => {
          const { id, title, description, action, type, variant, duration, ...props } = toast;
          // Map toast type to variant if variant is not provided
          const toastVariant: "default" | "destructive" | "success" | "warning" | "info" = variant || (
            type === "success" ? "success" :
            type === "warning" ? "warning" :
            type === "info" ? "info" :
            type === "destructive" ? "destructive" :
            "default"
          );
          
          return (
            <Toast 
              key={id} 
              {...props} 
              variant={toastVariant}
              duration={duration}
            >
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
              {action}
            </Toast>
          );
        })}
      </div>
      <ToastViewport />
    </ToastProvider>
  );
}
