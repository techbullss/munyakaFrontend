"use client";

import * as Toast from "@radix-ui/react-toast";
import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Info } from "lucide-react";

export type ToastVariant = "success" | "error" | "info";

// Add this global declaration so you don’t need `as any`
declare global {
  interface Window {
    showToast: (msg: string, type?: ToastVariant) => void;
  }
}

export function Toaster() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<ToastVariant>("info");

  // Register the global toast function only in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.showToast = (msg: string, type: ToastVariant = "info") => {
        setMessage(msg);
        setVariant(type);
        setOpen(true);
      };
    }
  }, []);

  const styles = {
    success: "bg-green-600 text-white border-green-500",
    error: "bg-red-600 text-white border-red-500",
    info: "bg-blue-600 text-white border-blue-500",
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-white" />,
    error: <XCircle className="h-5 w-5 text-white" />,
    info: <Info className="h-5 w-5 text-white" />,
  };

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${styles[variant]} animate-slide-in`}
        duration={3000}
      >
        {icons[variant]}
        <Toast.Title className="text-sm font-medium">{message}</Toast.Title>
      </Toast.Root>

      <Toast.Viewport className="fixed bottom-5 right-5 z-[9999] w-[320px] max-w-full outline-none" />
    </Toast.Provider>
  );
}
