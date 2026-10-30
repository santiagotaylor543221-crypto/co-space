"use client";

import Link from "next/link";
import Brand from "@/components/layout/brand";
import LogoutButton from "@/components/layout/logout-button";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n";

// Barra de navegación pública secundaria con tokens semánticos claros
export default function PublicNavbar() {
  const { t } = useI18n();

  return (
    <header className="flex items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 shadow-xs sm:px-6">
      <Brand />
      <nav aria-label={t("Navegación principal")} className="flex items-center gap-4 text-xs text-muted sm:gap-6">
        <Link href="/dashboard" className="transition hover:text-ink font-medium">
          {t("Catálogo")}
        </Link>
        <Link href="/login" className="transition hover:text-ink font-medium">
          {t("Iniciar sesión")}
        </Link>
        <LogoutButton />
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
