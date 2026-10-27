import type { ReactNode } from "react";
import AdminSidebar from "@/components/layout/admin-sidebar";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#08080a] text-gray-200 md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
