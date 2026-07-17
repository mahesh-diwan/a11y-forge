import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "text-[#141210] font-semibold active:scale-[0.97]",
  secondary: "border border-[var(--color-border)] text-[var(--color-text)] hover:border-[var(--color-focus)] active:scale-[0.97]",
  ghost: "text-[var(--color-muted)] hover:text-[var(--color-text)] active:scale-[0.97]",
  danger: "bg-[var(--color-fail)] text-white font-semibold active:scale-[0.97]",
};

const SIZES: Record<Size, string> = {
  sm: "px-4 py-2 text-[11px]",
  md: "px-5 py-2.5 text-xs",
  lg: "px-6 py-3 text-sm",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  children?: ReactNode;
}

export function Button({ variant = "primary", size = "md", icon, loading, loadingLabel, className, children, style, disabled, ...props }: ButtonProps) {
  const isPill = variant === "primary";

  return (
    <button
      className={cn(
        "group inline-flex items-center justify-center gap-2 font-mono transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] disabled:opacity-35 disabled:cursor-not-allowed min-h-11",
        isPill ? "rounded-full px-5 py-2.5" : SIZES[size],
        VARIANTS[variant],
        className
      )}
      style={{ background: variant === "primary" ? "var(--color-pass)" : undefined, ...style }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {loading ? (loadingLabel || children) : children}
      {!loading && icon ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/10 text-current transition-all duration-250 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-110 group-active:scale-95">
          {icon}
        </span>
      ) : null}
    </button>
  );
}
