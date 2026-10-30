"use client";

import Brand from "@/components/layout/brand";
import { FOOTER_COLUMNS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Pie de página con logotipo, columnas de enlaces y copyright
export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-line bg-surface py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Columna de marca */}
          <div className="lg:col-span-5 space-y-4">
            <Brand />
            <p className="max-w-sm text-xs leading-relaxed text-muted">
              {t(
                "Plataforma de reserva y gestión de espacios de coworking seguros, rápidos y type-safe."
              )}
            </p>
            <p className="text-[11px] text-muted pt-4">
              © 2026 co-space. {t("Todos los derechos reservados.")}
            </p>
          </div>

          {/* Columnas de navegación */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            {FOOTER_COLUMNS.map((column) => (
              <div key={column.id}>
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-ink mb-4">
                  {t(column.titleKey)}
                </h4>
                <ul className="space-y-2.5 text-xs text-muted">
                  {column.links.map((link) => (
                    <li key={link.labelKey}>
                      <a
                        href={link.href}
                        className="transition hover:text-ink"
                      >
                        {t(link.labelKey)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
