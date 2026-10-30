import type { ReactNode } from "react";
import AdminSidebar from "@/components/layout/admin-sidebar";

// Layout para el panel de administración con tokens semánticos claros
export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-body text-ink md:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">{children}</main>
    </div>
  );
}
