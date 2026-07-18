"use client";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = true }: CardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${hover ? "transition hover:border-[var(--color-border)]" : ""} ${className}`}
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
      onMouseEnter={(e) =>
        hover && (e.currentTarget.style.boxShadow = "var(--shadow-card-hover)")
      }
      onMouseLeave={(e) =>
        hover && (e.currentTarget.style.boxShadow = "var(--shadow-card)")
      }
    >
      {children}
    </div>
  );
}
