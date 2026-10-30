import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "accent" | "neutral";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

// Estados accesibles: siempre texto legible + color suave de fondo
const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-success-soft text-success border-success/30",
  warning: "bg-warning-soft text-warning border-warning/30",
  danger: "bg-danger-soft text-danger border-danger/30",
  accent: "bg-accent-soft text-ink border-accent/30 font-medium",
  neutral: "bg-background text-muted border-line",
};

export default function Badge({
  variant = "neutral",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
