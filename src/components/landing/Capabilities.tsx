"use client";

import { Clock, LayoutGrid, CheckCircle2, ShieldCheck } from "lucide-react";
import Card from "@/components/ui/card";
import { CAPABILITIES } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección de capacidades con tarjetas numeradas grandes en color acento (01-04)
export default function Capabilities() {
  const { t } = useI18n();

  const getIcon = (name: string) => {
    switch (name) {
      case "clock":
        return <Clock size={20} className="text-muted" />;
      case "grid":
        return <LayoutGrid size={20} className="text-muted" />;
      case "check":
        return <CheckCircle2 size={20} className="text-muted" />;
      case "shield":
        return <ShieldCheck size={20} className="text-muted" />;
      default:
        return <Clock size={20} className="text-muted" />;
    }
  };

  return (
    <section id="capacidades" className="py-24 border-b border-line bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Encabezado de la sección */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            {t("Capacidades")}
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {t("Tecnología pensada para no fallar")}
          </h2>
        </div>

        {/* Grid de 4 tarjetas numeradas */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((item) => (
            <Card
              key={item.id}
              className="flex flex-col justify-between rounded-3xl p-8 hover:border-accent/40 hover:shadow-sm transition-all duration-300"
            >
              <div>
                {/* Cabecera con número grande en acento e icono */}
                <div className="flex items-center justify-between mb-8">
                  <span className="font-heading text-4xl font-semibold text-accent sm:text-5xl">
                    {item.number}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-line">
                    {getIcon(item.iconName)}
                  </div>
                </div>

                {/* Título de la capacidad */}
                <h3 className="font-heading text-lg font-semibold text-ink">
                  {t(item.titleKey)}
                </h3>

                {/* Descripción */}
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {t(item.descKey)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
