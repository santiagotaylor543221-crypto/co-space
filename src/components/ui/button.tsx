import type { ButtonHTMLAttributes } from "react";

// Variantes de botones con tokens semánticos
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variants: Record<ButtonVariant, string> = {
  // Contraste accesible: texto ink (#111111) sobre acento (#FF5B2E)
  primary: "bg-accent text-ink hover:bg-accent/90 shadow-xs font-semibold",
  secondary: "border border-line bg-surface text-ink hover:bg-background shadow-xs font-medium",
  danger: "bg-danger-soft text-danger border border-danger/20 hover:bg-danger-soft/80 font-medium",
  ghost: "text-muted hover:text-ink hover:bg-line/30 font-medium",
};

const sizes: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-xs rounded-xl",
  lg: "px-6 py-3 text-sm rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 transition duration-150 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
