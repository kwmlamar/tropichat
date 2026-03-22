"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      theme="system"
      toastOptions={{
        className: "tropichat-toast",
        style: {
          borderRadius: "20px",
          padding: "16px 20px",
          fontSize: "0.9375rem",
          fontWeight: "500",
          backdropFilter: "blur(12px)",
        },
      }}
    />
  );
}
