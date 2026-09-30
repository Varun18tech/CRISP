import React from "react";
import { cn } from "@/lib/utils";

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
