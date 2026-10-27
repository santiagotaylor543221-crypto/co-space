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
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
        <Brand />
        <nav aria-label={t("Navegación principal")} className="flex items-center gap-5 text-[11px] text-zinc-300">
          <Link href="/dashboard" onClick={closeAccountMenu} className="transition hover:text-white">
            {t("Catálogo")}
          </Link>
          <Link href="/mis-reservas" onClick={closeAccountMenu} className="transition hover:text-white">
            {t("Mis reservas")}
          </Link>
          <details ref={accountMenuRef} className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 transition hover:text-white [&::-webkit-details-marker]:hidden">
              {t("Mi cuenta")}
              <ChevronDown size={12} className="transition group-open:rotate-180" />
            </summary>
            <div className="absolute right-0 top-full z-10 mt-3 flex min-w-36 flex-col gap-1 rounded-xl border border-white/10 bg-[#111113] p-1.5 shadow-xl">
              <Link
                href="/mis-reservas"
                onClick={closeAccountMenu}
                className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                {t("Mis reservas")}
              </Link>
              <Link
                href="/"
                onClick={closeAccountMenu}
                className="rounded-lg px-3 py-2 text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                {t("Ir al inicio")}
              </Link>
              <LogoutButton className="w-full rounded-lg px-3 py-2 text-left text-[11px] hover:bg-white/5" />
            </div>
          </details>
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
