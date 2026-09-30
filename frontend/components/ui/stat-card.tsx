import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: string;
  isPositive?: boolean;
  icon?: LucideIcon;
  variant?: "default" | "critical" | "warning" | "success" | "accent";
  className?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  change,
  isPositive,
  icon: Icon,
  variant = "default",
  className,
}: StatCardProps) {
  const iconGlowStyles = {
    default: "bg-slate-800 text-slate-300 border-slate-700/80",
    critical: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    accent: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  };

  return (
    <Card className={cn("p-5 relative overflow-hidden group hover:border-slate-700 transition-all", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 tracking-wider uppercase">{title}</p>
          <div className="text-2xl font-bold text-slate-100 tracking-tight">{value}</div>
        </div>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl border transition-colors", iconGlowStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtitle || change) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {change && (
            <span
              className={cn(
                "font-semibold px-1.5 py-0.5 rounded",
                isPositive
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-rose-500/15 text-rose-400"
              )}
            >
              {change}
            </span>
          )}
          {subtitle && <span className="text-slate-400">{subtitle}</span>}
        </div>
      )}
    </Card>
  );
}
