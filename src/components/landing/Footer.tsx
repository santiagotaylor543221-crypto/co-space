"use client";

import Link from "next/link";
import Brand from "@/components/layout/brand";
import { useI18n } from "@/lib/i18n";

const links = [
  { href: "#espacios", label: "Espacios" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#administracion", label: "Administración" },
  { href: "#planes", label: "Planes" },
  { href: "/login", label: "Iniciar sesión" },
];

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-line bg-surface py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Brand />
        <nav aria-label={t("Navegación del pie de página")} className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
          {links.map(({ href, label }) => (
            <Link key={href} href={href} className="hover:text-ink">{t(label)}</Link>
          ))}
        </nav>
        <p className="text-xs text-muted">© 2026 co-space</p>
      </div>
    </footer>
  );
}
