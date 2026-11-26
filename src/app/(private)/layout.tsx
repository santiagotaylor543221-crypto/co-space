import type { ReactNode } from "react";
import PageSession from "@/components/auth/page-session";
import PrivateShell from "@/components/layout/private-shell";

export default function PrivateLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <PageSession policy="private">
      <PrivateShell>{children}</PrivateShell>
    </PageSession>
  );
}
