import type { ReactNode } from "react";
import PublicFooter from "@/components/layout/public-footer";
import PublicNavbar from "@/components/layout/public-navbar";

// Layout para páginas públicas secundarias con los nuevos tokens claros
export default function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-background px-4 py-4 text-ink flex flex-col font-body">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col">
        <PublicNavbar />
        <main className="flex-1 py-8">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
