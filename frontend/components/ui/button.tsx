import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const variantStyles = {
      primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20 active:scale-[0.98]",
      secondary: "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/80 active:scale-[0.98]",
      outline: "bg-transparent hover:bg-slate-800/60 text-slate-300 border border-slate-700 active:scale-[0.98]",
      ghost: "bg-transparent hover:bg-slate-800/60 text-slate-300 active:scale-[0.98]",
      danger: "bg-rose-600 hover:bg-rose-500 text-white shadow-sm shadow-rose-500/20 active:scale-[0.98]",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
      md: "h-9 px-4 text-sm rounded-xl gap-2",
      lg: "h-11 px-5 text-sm font-medium rounded-xl gap-2.5",
      icon: "h-9 w-9 p-0 rounded-xl justify-center items-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
