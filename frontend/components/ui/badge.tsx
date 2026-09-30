import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "danger" | "critical" | "info";
  size?: "sm" | "md";
}

export function Badge({ className, variant = "default", size = "md", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-800 text-slate-200 border-slate-700",
    secondary: "bg-slate-800/60 text-slate-300 border-slate-700/60",
    outline: "bg-transparent text-slate-300 border-slate-700",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    critical: "bg-rose-500/15 text-rose-400 border-rose-500/30 font-medium",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 rounded-md",
    md: "text-xs px-2.5 py-1 rounded-lg",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-medium border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
