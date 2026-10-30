"use client";

import { Suspense, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, CalendarDays, ArrowLeft, Menu, X, User } from "lucide-react";
import Brand from "@/components/layout/brand";
import LogoutButton from "@/components/layout/logout-button";
import LanguageSwitcher from "@/components/layout/language-switcher";
import { useI18n } from "@/lib/i18n";

// Enlaces de navegación con detección de ruta activa envueltos en Suspense para prerendering
function PrivateNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const pathname = usePathname();

  const navigation = [
    {
      name: t("Catálogo"),
      href: "/dashboard",
      icon: LayoutGrid,
      isActive: pathname === "/dashboard" || pathname.startsWith("/dashboard/"),
    },
    {
      name: t("Mis reservas"),
      href: "/mis-reservas",
      icon: CalendarDays,
      isActive: pathname === "/mis-reservas",
    },
  ];

  return (
    <div className="space-y-1.5">
      {navigation.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition ${
              item.isActive
                ? "bg-accent-soft text-ink font-semibold"
                : "text-muted hover:bg-background hover:text-ink"
            }`}
          >
            <Icon
              size={16}
              className={item.isActive ? "text-accent" : "text-muted"}
            />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function PrivateLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background font-body text-ink flex flex-col md:flex-row">
      {/* Backdrop móvil */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-xs md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar clara (escritorio y cajón móvil) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-surface p-5 shadow-xs flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-8">
          {/* Cabecera del sidebar */}
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <Brand />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg p-1 text-muted hover:text-ink md:hidden"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          {/* Menú de navegación */}
          <nav aria-label="Navegación del panel" className="space-y-1.5">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted mb-2">
              {t("Navegación principal")}
            </p>
            <Suspense fallback={<div className="h-20 animate-pulse bg-line/40 rounded-xl" />}>
              <PrivateNavLinks onNavigate={() => setMobileMenuOpen(false)} />
            </Suspense>
          </nav>
        </div>

        {/* Pie del sidebar con perfil y volver al inicio */}
        <div className="space-y-3 pt-6 border-t border-line">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs text-muted hover:bg-background hover:text-ink transition"
          >
            <ArrowLeft size={14} />
            <span>{t("Ir al inicio")}</span>
          </Link>

          <div className="flex items-center justify-between rounded-xl bg-background border border-line p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-line text-xs font-semibold text-ink">
                <User size={15} className="text-muted" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-ink leading-none">Mi Cuenta</p>
                <p className="text-[10px] text-muted mt-1">Usuario</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Área principal con barra superior */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Barra superior clara */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-xl border border-line p-2 text-ink md:hidden"
              aria-label="Abrir navegación"
            >
              <Menu size={18} />
            </button>
            <span className="text-xs font-medium text-muted hidden sm:inline">
              CoSpace Workspace
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="h-4 w-px bg-line" />
            <LogoutButton />
          </div>
        </header>

        {/* Contenedor de contenido de cada pantalla */}
        <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
