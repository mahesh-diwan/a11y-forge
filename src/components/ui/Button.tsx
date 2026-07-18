import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "text-[#000] font-semibold",
  secondary: "border border-[var(--border)] text-[var(--text)] hover:border-[var(--accent)]",
  ghost: "text-[var(--muted)] hover:text-[var(--text)]",
  danger: "bg-[var(--fail)] text-white font-semibold",
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
  return (
    <button
      className={cn(
        "group inline-flex items-center justify-center gap-2 font-mono disabled:opacity-35 disabled:cursor-not-allowed min-h-11",
        SIZES[size],
        VARIANTS[variant],
        className
      )}
      style={{ background: variant === "primary" ? "var(--accent)" : undefined, ...style }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 border-2 border-current border-t-transparent" />
      ) : null}
      {loading ? (loadingLabel || children) : children}
      {!loading && icon ? (
        <span className="flex h-7 w-7 items-center justify-center bg-black/10 text-current">
          {icon}
        </span>
      ) : null}
    </button>
  );
}
