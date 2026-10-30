"use client";

import Card from "@/components/ui/card";
import { METRICS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección de Métricas con 4 números gigantes ilustrativos
export default function MetricsSection() {
  const { t } = useI18n();

  return (
    <section className="py-24 border-b border-line bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            {t("Métricas de confianza")}
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("Resultados que respaldan la plataforma")}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {METRICS.map((metric) => (
            <Card
              key={metric.id}
              className="flex flex-col justify-between rounded-3xl p-8 text-center sm:text-left hover:border-accent/30 transition duration-300"
            >
              <div>
                {/* Número monumental en acento */}
                <div className="font-heading text-4xl font-semibold text-accent sm:text-5xl mb-3">
                  {metric.value}
                </div>

                <h3 className="font-heading text-sm font-semibold text-ink">
                  {t(metric.labelKey)}
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {t(metric.descKey)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
