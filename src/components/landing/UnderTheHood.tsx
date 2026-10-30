"use client";

import { Code2, Cpu } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { TECH_PILLARS, TECH_BADGES, ZOD_CODE_SNIPPET } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección técnica "Bajo el capó": ADN técnico, badges de tecnologías y bloque de código oscuro de contraste
export default function UnderTheHood() {
  const { t } = useI18n();

  return (
    <section id="tecnologia" className="py-24 border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            {t("Bajo el capó")}
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {t("Construido para no fallar")}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {t(
              "Arquitectura moderna enfocada en fiabilidad, validación estricta en el borde y despliegues reproducibles."
            )}
          </p>
        </div>

        {/* 3 Tarjetas de ADN técnico */}
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {TECH_PILLARS.map((pillar) => (
            <Card key={pillar.id} className="rounded-3xl p-7">
              <h3 className="font-heading text-base font-semibold text-ink">
                {t(pillar.titleKey)}
              </h3>
              <p className="mt-2.5 text-xs leading-relaxed text-muted">
                {t(pillar.descKey)}
              </p>
            </Card>
          ))}
        </div>

        {/* Fila de badges de tecnologías */}
        <div className="mt-12 flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5 mr-2">
            <Cpu size={14} className="text-accent" />
            Stack:
          </span>
          {TECH_BADGES.map((badge) => (
            <Badge key={badge} variant="neutral" className="px-3 py-1 font-mono text-xs">
              {badge}
            </Badge>
          ))}
        </div>

        {/* Tarjeta oscura contrastante con snippet de código Zod estático (#111111) */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-[#111111] p-6 text-white shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
              <Code2 size={15} className="text-accent" />
              <span>src/schemas/booking.ts</span>
            </div>
            <span className="text-[10px] uppercase font-mono text-zinc-500">
              {t("Esquema Zod validado en servidor")}
            </span>
          </div>

          <pre className="overflow-x-auto font-mono text-xs text-zinc-300 leading-relaxed">
            <code>{ZOD_CODE_SNIPPET}</code>
          </pre>
        </div>
      </div>
    </section>
  );
}
