import type { ReactNode } from "react";
import PrivateNavbar from "@/components/layout/private-navbar";

export default function PrivateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      <PrivateNavbar />
      <main className="mx-auto w-full max-w-5xl px-4">{children}</main>
    </div>
  );
}
