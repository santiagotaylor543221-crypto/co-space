import type { ReactNode } from "react";
import PublicFooter from "@/components/layout/public-footer";
import PublicNavbar from "@/components/layout/public-navbar";

export default function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#09090b] px-4 py-4 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-5xl flex-col">
        <PublicNavbar />
        <main className="flex-1">{children}</main>
        <PublicFooter />
      </div>
    </div>
  );
}
