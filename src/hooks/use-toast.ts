import * as React from "react";
import { sileo } from "sileo";

type ToastVariant = "default" | "destructive";
type ToastInput = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
};

function toText(node: React.ReactNode): string | undefined {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  return undefined;
}

function toast({ title, description, variant = "default" }: ToastInput) {
  const titleText = toText(title) ?? "Notice";
  const descriptionText = toText(description);
  const api = sileo as unknown as {
    success?: (opts: { title: string; description?: string }) => void;
    error?: (opts: { title: string; description?: string }) => void;
    info?: (opts: { title: string; description?: string }) => void;
  };

  if (variant === "destructive" && api.error) {
    api.error({ title: titleText, description: descriptionText });
  } else if (api.success) {
    api.success({ title: titleText, description: descriptionText });
  } else if (api.info) {
    api.info({ title: titleText, description: descriptionText });
  }

  return {
    id: crypto.randomUUID(),
    dismiss: () => {},
    update: () => {},
  };
}

function useToast() {
  return {
    toasts: [],
    toast,
    dismiss: (_toastId?: string) => {},
  };
}

export { useToast, toast };
