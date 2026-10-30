import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement>;

// Tarjeta base con superficie blanca, borde fino y sombra suave
export default function Card({ className = "", ...props }: CardProps) {
  return (
    <article
      className={`rounded-2xl border border-line bg-surface p-6 shadow-xs text-ink transition-all ${className}`}
      {...props}
    />
  );
}
