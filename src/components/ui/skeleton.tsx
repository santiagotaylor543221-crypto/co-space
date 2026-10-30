import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

// Bloque de carga esqueleto con animación suave de pulso
export default function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-line/60 ${className}`}
      {...props}
    />
  );
}
