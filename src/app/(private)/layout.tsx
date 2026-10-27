import type { ReactNode } from "react";

export default function PrivateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <>{children}</>;
}
