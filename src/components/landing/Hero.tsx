"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { TICKER_ITEMS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección Hero con titular monumental, CTAs dobles y cinta continua en movimiento
export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
        {/* Badge superior */}
        <div className="flex justify-center mb-6">
          <Badge variant="accent" className="px-3.5 py-1 text-xs">
            <Sparkles size={13} className="text-accent" />
            <span>{t("Reserva de coworking")}</span>
          </Badge>
        </div>

        {/* Titular enorme estilo Optimus */}
        <h1 className="mx-auto max-w-4xl font-heading text-5xl font-semibold tracking-tight text-ink sm:text-6xl md:text-7xl leading-[1.05]">
          {t("Reserva tu espacio. Trabaja sin fricción.")}
        </h1>

        {/* Subtítulo descriptivo */}
        <p className="mx-auto mt-6 max-w-2xl text-base text-muted sm:text-lg leading-relaxed">
          {t(
            "Gestiona la disponibilidad y reserva de entornos de trabajo compartido de forma controlada, inmediata y segura."
          )}
        </p>

        {/* Botones duales */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a href="#planes">
            <Button variant="primary" size="lg" className="shadow-sm">
              <span>{t("Empezar a reservar")}</span>
              <ArrowRight size={16} />
            </Button>
          </a>

          <a href="#como-funciona">
            <Button variant="secondary" size="lg">
              {t("Ver cómo funciona")}
            </Button>
          </a>
        </div>
      </div>

      {/* Cinta horizontal continua en movimiento (Ticker) */}
      <div className="mt-20 border-y border-line bg-surface py-4 overflow-hidden">
        <div className="flex w-max animate-ticker gap-12 whitespace-nowrap">
          {/* Primer bloque de métricas */}
          {TICKER_ITEMS.map((item) => (
            <div key={`ticker-1-${item.id}`} className="flex items-center gap-3 text-xs font-medium text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>{t(item.translationKey)}</span>
            </div>
          ))}

          {/* Duplicado para efecto infinito sin saltos */}
          {TICKER_ITEMS.map((item) => (
            <div key={`ticker-2-${item.id}`} className="flex items-center gap-3 text-xs font-medium text-ink">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span>{t(item.translationKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
