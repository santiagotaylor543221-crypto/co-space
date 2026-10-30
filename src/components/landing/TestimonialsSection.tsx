"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import Card from "@/components/ui/card";
import Badge from "@/components/ui/badge";
import { TESTIMONIALS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección Testimonios: tarjeta grande con carrusel simple accionado por useState
export default function TestimonialsSection() {
  const { t } = useI18n();
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = TESTIMONIALS[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? TESTIMONIALS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === TESTIMONIALS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section className="py-24 border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            {t("Experiencias")}
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("Lo que dicen los equipos")}
          </h2>
        </div>

        {/* Tarjeta de testimonio grande */}
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-sm">
            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
              <div className="space-y-6 max-w-2xl">
                <Quote size={36} className="text-accent/30" />

                <p className="font-heading text-xl sm:text-2xl font-medium text-ink leading-relaxed">
                  “{t(current.quoteKey)}”
                </p>

                <div className="pt-2">
                  <div className="font-heading text-base font-semibold text-ink">
                    {current.author}
                  </div>
                  <div className="text-xs text-muted">
                    {t(current.roleKey)} • <span className="text-ink font-medium">{current.company}</span>
                  </div>
                </div>
              </div>

              {/* Métrica de impacto y controles */}
              <div className="flex flex-col items-start md:items-end justify-between gap-6 shrink-0 border-t md:border-t-0 md:border-l border-line pt-6 md:pt-0 md:pl-8">
                <div className="text-left md:text-right">
                  <Badge variant="accent" className="mb-2">
                    {t(current.metricLabelKey)}
                  </Badge>
                  <div className="font-heading text-3xl font-semibold text-ink">
                    {current.metricValue}
                  </div>
                </div>

                {/* Botones de navegación */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Testimonio anterior"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-background text-ink hover:bg-line/40 transition"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-xs font-mono text-muted px-2">
                    {currentIndex + 1} / {TESTIMONIALS.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Siguiente testimonio"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-background text-ink hover:bg-line/40 transition"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
