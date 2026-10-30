"use client";

import Link from "next/link";
import { ShieldCheck, ArrowLeft, CalendarDays } from "lucide-react";
import Brand from "@/components/layout/brand";
import LogoutButton from "@/components/layout/logout-button";
import LanguageSwitcher from "@/components/layout/language-switcher";
import Badge from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";

// Barra lateral de administración con tokens semánticos claros
export default function AdminSidebar() {
  const { t } = useI18n();

  return (
    <aside className="flex w-full shrink-0 items-center justify-between border-b border-line bg-surface px-6 py-4 shadow-xs md:sticky md:top-0 md:h-screen md:w-60 md:flex-col md:items-stretch md:border-b-0 md:border-r md:px-6 md:py-8">
      {/* Cabecera del sidebar */}
      <div className="flex items-center gap-2.5">
        <Brand />
        <Badge variant="accent" className="text-[10px] uppercase font-mono tracking-wider">
          Admin
        </Badge>
      </div>

      {/* Navegación */}
      <nav aria-label={t("Menú de administración")} className="flex items-center gap-2 md:flex-col md:items-stretch md:space-y-1.5 md:my-auto">
        <p className="hidden px-3 text-[10px] font-semibold uppercase tracking-wider text-muted md:mb-2 md:block">
          {t("MENÚ PRINCIPAL")}
        </p>

        <Link
          href="/admin"
          aria-current="page"
          className="flex items-center gap-2.5 rounded-xl bg-accent-soft px-3.5 py-2.5 text-xs font-semibold text-ink shadow-xs"
        >
          <CalendarDays size={16} className="text-accent" />
          <span>{t("Reservas")}</span>
        </Link>

        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium text-muted transition hover:bg-background hover:text-ink"
        >
          <ArrowLeft size={16} />
          <span>{t("Volver al sitio")}</span>
        </Link>

        <div className="pt-2 border-t border-line hidden md:block">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[11px] text-muted">Idioma:</span>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Pie del sidebar con administrador y logout */}
      <div className="hidden items-center justify-between border-t border-line pt-5 md:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-soft text-ink font-semibold text-xs border border-accent/20">
            <ShieldCheck size={16} className="text-accent" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold text-ink">{t("Administrador")}</p>
            <p className="text-[10px] text-muted">{t("Nivel: ADMIN")}</p>
          </div>
        </div>
        <LogoutButton />
      </div>

      {/* Acciones en móvil */}
      <div className="flex items-center gap-2 md:hidden">
        <LanguageSwitcher />
        <LogoutButton />
      </div>
    </aside>
  );
}
