"use client";

import { Calendar, Clock, MapPin, CheckCircle2 } from "lucide-react";
import Badge from "@/components/ui/badge";
import { HOW_IT_WORKS_STEPS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección Cómo Funciona con pasos romanos (I, II, III) y tarjeta decorativa simulando una reserva
export default function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="como-funciona" className="py-24 border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Columna izquierda: Pasos I, II, III */}
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              {t("Flujo simple")}
            </p>
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
              {t("Cómo funciona")}
            </h2>
            <p className="mt-4 text-sm text-muted leading-relaxed">
              {t(
                "Diseñado para que reservar un entorno de trabajo tome menos de un minuto, desde cualquier dispositivo y sin fricción."
              )}
            </p>

            <div className="mt-12 space-y-8">
              {HOW_IT_WORKS_STEPS.map((step) => (
                <div key={step.id} className="flex items-start gap-5">
                  {/* Número romano en acento */}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent-soft font-heading text-base font-semibold text-ink border border-accent/20">
                    {step.roman}
                  </span>
                  <div>
                    <h3 className="font-heading text-base font-semibold text-ink">
                      {t(step.titleKey)}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted">
                      {t(step.descKey)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna derecha: Tarjeta decorativa simulando vista de reserva */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-line bg-background p-6 shadow-sm">
              {/* Cabecera del mock */}
              <div className="flex items-center justify-between pb-4 border-b border-line">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  <span className="text-xs font-semibold text-ink">{t("Simulación de Reserva")}</span>
                </div>
                <Badge variant="success">
                  <CheckCircle2 size={12} />
                  <span>{t("Confirmado")}</span>
                </Badge>
              </div>

              {/* Vista previa del espacio */}
              <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-heading text-sm font-semibold text-ink">
                    {t("Escritorio Nómade 04")}
                  </h4>
                  <span className="font-heading text-sm font-semibold text-ink">
                    12 € <span className="text-[10px] text-muted font-normal">/ hora</span>
                  </span>
                </div>

                <div className="space-y-2 text-xs text-muted">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-muted" />
                    <span>Planta 1 • Zona Silencio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-muted" />
                    <span>Hoy, 10:00 - 12:00 (2h)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-muted" />
                    <span>Acceso inmediato con credencial digital</span>
                  </div>
                </div>
              </div>

              {/* Desglose de tarifa simulado */}
              <div className="mt-4 rounded-xl bg-surface border border-line px-4 py-3 text-xs">
                <div className="flex justify-between text-muted mb-1.5">
                  <span>2 horas x 12 €</span>
                  <span>24 €</span>
                </div>
                <div className="flex justify-between font-semibold text-ink pt-1.5 border-t border-line">
                  <span>Total</span>
                  <span>24 €</span>
                </div>
              </div>

              {/* Botón simulado */}
              <div className="mt-5">
                <div className="w-full text-center rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-ink shadow-xs">
                  {t("Confirmado")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
