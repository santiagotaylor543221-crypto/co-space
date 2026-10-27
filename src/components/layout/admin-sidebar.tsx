import Link from "next/link";
import Brand from "@/components/layout/brand";
import LogoutButton from "@/components/layout/logout-button";

export default function AdminSidebar() {
  return (
    <aside className="flex w-full shrink-0 items-center justify-between border-b border-white/5 bg-[#0c0c0e] px-4 py-4 md:sticky md:top-0 md:h-screen md:w-[220px] md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-5 md:py-6">
      <div className="flex items-center gap-2">
        <Brand />
        <span className="rounded border border-white/20 px-1.5 py-0.5 text-[9px] tracking-widest text-gray-400">
          ADMIN
        </span>
      </div>

      <nav aria-label="Menú de administración" className="flex items-center gap-2 md:flex-col md:items-stretch">
        <p className="hidden px-2 text-[9px] tracking-[0.2em] text-gray-600 md:mb-2 md:block">
          MENÚ PRINCIPAL
        </p>
        <Link
          href="/admin"
          aria-current="page"
          className="rounded-lg bg-white/5 px-3 py-2.5 text-xs text-white"
        >
          Reservas
        </Link>
        <Link
          href="/"
          className="rounded-lg px-3 py-2.5 text-xs text-gray-500 transition-colors hover:bg-white/[0.03] hover:text-gray-300"
        >
          Volver al sitio
        </Link>
        <LogoutButton className="rounded-lg px-3 py-2.5 text-xs hover:bg-white/[0.03]" />
      </nav>

      <div className="hidden items-center gap-3 border-t border-white/5 pt-4 md:flex">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
          AD
        </div>
        <div className="leading-tight">
          <p className="text-[11px] text-gray-200">Administrador</p>
          <p className="text-[9px] text-gray-600">Nivel: ADMIN</p>
        </div>
      </div>
    </aside>
  );
}
