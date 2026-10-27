import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLElement>;

export default function Card({ className = "", ...props }: CardProps) {
  return (
    <article
      className={`rounded-xl border border-white/10 bg-white/[0.03] ${className}`}
      {...props}
    />
  );
}
