import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-slate-800/60", className)}
      {...props}
    />
  );
}

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "error" | "success";
  title?: string;
}

export function Alert({ variant = "info", title, className, children, ...props }: AlertProps) {
  const styles = {
    info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    error: "bg-rose-500/10 border-rose-500/30 text-rose-300",
    success: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
  };

  return (
    <div className={cn("p-4 rounded-xl border text-xs leading-relaxed flex flex-col gap-1", styles[variant], className)} {...props}>
      {title && <h5 className="font-semibold tracking-tight text-sm text-slate-100">{title}</h5>}
      <div>{children}</div>
    </div>
  );
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, description, children, maxWidth = "md" }: ModalProps) {
  if (!isOpen) return null;

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className={cn(
          "relative w-full rounded-2xl bg-slate-900 border border-slate-800 p-6 apple-shadow z-10 space-y-4",
          widthStyles[maxWidth]
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
            {description && <p className="text-xs text-slate-400 mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
