import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (currency === "INR") {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // USD fallback
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRiskLevelColor(level: string): { bg: string; text: string; border: string; badgeBg: string } {
  switch (level?.toLowerCase()) {
    case "critical":
      return {
        bg: "bg-rose-500/10 dark:bg-rose-500/15",
        text: "text-rose-600 dark:text-rose-400",
        border: "border-rose-500/30",
        badgeBg: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    case "very high":
      return {
        bg: "bg-orange-500/10 dark:bg-orange-500/15",
        text: "text-orange-600 dark:text-orange-400",
        border: "border-orange-500/30",
        badgeBg: "bg-orange-500/20 text-orange-300 border-orange-500/40",
      };
    case "high":
      return {
        bg: "bg-amber-500/10 dark:bg-amber-500/15",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-500/30",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    case "moderate":
    case "medium":
      return {
        bg: "bg-yellow-500/10 dark:bg-yellow-500/15",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-500/30",
        badgeBg: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40",
      };
    case "low":
    default:
      return {
        bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        text: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500/30",
        badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
      };
  }
}
