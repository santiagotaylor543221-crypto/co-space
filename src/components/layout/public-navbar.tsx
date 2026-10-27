"use client";

import Link from "next/link";
import Brand from "@/components/layout/brand";
import LogoutButton from "@/components/layout/logout-button";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n";

export default function PublicNavbar() {
  const { t } = useI18n();

  return (
    <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
      <Brand />
      <nav aria-label={t("Navegación principal")} className="flex items-center gap-4 text-[11px] text-zinc-300 sm:gap-5">
        <Link href="/dashboard" className="transition hover:text-white">
          {t("Catálogo")}
        </Link>
        <Link href="/login" className="transition hover:text-white">
          {t("Iniciar sesión")}
        </Link>
        <LogoutButton />
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
