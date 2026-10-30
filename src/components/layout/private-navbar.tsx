"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import Brand from "@/components/layout/brand";
import LogoutButton from "@/components/layout/logout-button";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n";

export default function PrivateNavbar() {
  const accountMenuRef = useRef<HTMLDetailsElement>(null);
  const { t } = useI18n();

  const closeAccountMenu = () => {
    if (accountMenuRef.current) {
      accountMenuRef.current.open = false;
    }
  };

  return (
    <header className="px-4 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-line bg-surface px-5 py-4 shadow-xs sm:px-6">
        <Brand />
        <nav aria-label={t("Navegación principal")} className="flex items-center gap-5 text-xs text-muted">
          <Link href="/dashboard" onClick={closeAccountMenu} className="transition hover:text-ink font-medium">
            {t("Catálogo")}
          </Link>
          <Link href="/mis-reservas" onClick={closeAccountMenu} className="transition hover:text-ink font-medium">
            {t("Mis reservas")}
          </Link>
          <details ref={accountMenuRef} className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 transition hover:text-ink font-medium [&::-webkit-details-marker]:hidden">
              {t("Mi cuenta")}
              <ChevronDown size={14} className="transition group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-10 mt-3 flex min-w-40 flex-col gap-1 rounded-2xl border border-line bg-surface p-2 shadow-lg">
              <Link
                href="/mis-reservas"
                onClick={closeAccountMenu}
                className="rounded-xl px-3 py-2 text-xs text-muted transition hover:bg-background hover:text-ink"
              >
                {t("Mis reservas")}
              </Link>
              <Link
                href="/"
                onClick={closeAccountMenu}
                className="rounded-xl px-3 py-2 text-xs text-muted transition hover:bg-background hover:text-ink"
              >
                {t("Ir al inicio")}
              </Link>
              <div className="border-t border-line my-1" />
              <LogoutButton className="w-full rounded-xl px-3 py-2 text-left text-xs hover:bg-background" />
            </div>
          </details>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
