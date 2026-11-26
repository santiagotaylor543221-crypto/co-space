"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, ArrowUpRight } from "lucide-react";
import Brand from "@/components/layout/brand";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n";

// Barra de navegación fija con fondo translúcido y enlaces a anclas
export default function Navbar() {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const sections = Array.from(document.querySelectorAll<HTMLElement>("main section[id]"));
      const current = sections.filter((section) => section.getBoundingClientRect().top <= 160).at(-1);
      setActiveSection(current ? `#${current.id}` : "");
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: t("Espacios"), href: "#espacios" },
    { label: t("Cómo funciona"), href: "#como-funciona" },
    { label: t("Administración"), href: "#administracion" },
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
          className="hidden items-center gap-8 lg:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeSection === link.href ? "location" : undefined}
              className="text-xs font-medium text-muted transition hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Acciones de escritorio */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />

          <Link prefetch={false} href="/login" className="rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium hover:bg-accent-soft">
            {t("Iniciar sesión")}
          </Link>

          <Link prefetch={false} href="/dashboard" className="inline-flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold hover:bg-accent/90">
            {t("Reservar")}
            <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>

        {/* Botón menú móvil */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-line bg-surface p-2 text-ink shadow-xs"
            aria-label={t(mobileMenuOpen ? "Cerrar menú" : "Abrir menú")}
            aria-expanded={mobileMenuOpen}
            aria-controls="landing-mobile-menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Menú desplegable para móvil */}
      <div id="landing-mobile-menu" hidden={!mobileMenuOpen} className="border-b border-line bg-surface px-6 py-6 lg:hidden shadow-lg animate-in slide-in-from-top-2">
        <nav className="flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              aria-current={activeSection === link.href ? "location" : undefined}
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-ink transition hover:text-accent"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-4 flex flex-col gap-2.5 pt-4 border-t border-line">
            <Link prefetch={false} href="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-xl border border-line p-3 text-center text-sm font-medium">
              {t("Iniciar sesión")}
            </Link>
            <Link prefetch={false} href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="rounded-xl bg-accent p-3 text-center text-sm font-semibold">
              {t("Reservar")}
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
