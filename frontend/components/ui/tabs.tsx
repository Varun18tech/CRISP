import React from "react";
import { cn } from "@/lib/utils";

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn("inline-flex items-center gap-1 rounded-xl bg-slate-900/90 p-1 border border-slate-800", className)}>
      {children}
    </div>
  );
}

interface TabTriggerProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export function TabTrigger({ active, onClick, children, className }: TabTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer",
        active
          ? "bg-slate-800 text-slate-100 shadow-sm border border-slate-700/80"
          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40",
        className
      )}
    >
      {children}
    </button>
  );
}
