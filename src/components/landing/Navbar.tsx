"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Brand from "@/components/layout/brand";
import LanguageSwitcher from "@/components/layout/language-switcher";
import Button from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

// Barra de navegación fija con fondo translúcido y enlaces a anclas
export default function Navbar() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: t("Espacios"), href: "#capacidades" },
    { label: t("Cómo funciona"), href: "#como-funciona" },
    { label: t("Seguridad"), href: "#seguridad" },
    { label: t("Planes"), href: "#planes" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-background/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        {/* Logotipo co-space */}
        <Brand />

        {/* Enlaces de escritorio */}
        <nav
          aria-label={t("Navegación principal")}
          className="hidden items-center gap-8 md:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-xs font-medium text-muted transition hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Acciones de escritorio */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />

          <Link href="/login">
            <Button variant="secondary" size="sm">
              {t("Iniciar sesión")}
            </Button>
          </Link>

          <a href="#planes">
            <Button variant="primary" size="sm">
              <span>{t("Reservar")}</span>
              <ArrowUpRight size={14} />
            </Button>
          </a>
        </div>

        {/* Botón menú móvil */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-line bg-surface p-2 text-ink shadow-xs"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Menú desplegable para móvil */}
      {mobileMenuOpen && (
        <div className="border-b border-line bg-surface px-6 py-6 md:hidden shadow-lg animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-ink transition hover:text-accent"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4 flex flex-col gap-2.5 pt-4 border-t border-line">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" className="w-full">
                  {t("Iniciar sesión")}
                </Button>
              </Link>
              <a href="#planes" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full">
                  {t("Reservar")}
                </Button>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
