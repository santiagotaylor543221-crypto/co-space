"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import Card from "@/components/ui/card";
import Button from "@/components/ui/button";
import Badge from "@/components/ui/badge";
import { PRICING_PLANS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección Planes: 3 tarjetas con toggle mensual/anual simple y plan Pro destacado
export default function PricingSection() {
  const { t } = useI18n();
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="planes" className="py-24 border-b border-line bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            {t("Precios transparentes")}
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {t("Planes a tu medida")}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {t("Comienza gratis o escala a salas privadas y privilegios de equipo.")}
          </p>

          {/* Toggle Mensual / Anual */}
          <div className="mt-10 inline-flex items-center rounded-2xl border border-line bg-surface p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                !isAnnual
                  ? "bg-accent text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t("Facturación mensual")}
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                isAnnual
                  ? "bg-accent text-ink shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              <span>{t("Facturación anual")}</span>
              <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-ink font-medium">
                {t("Ahorra 2 meses")}
              </span>
            </button>
          </div>
        </div>

        {/* 3 Tarjetas de planes */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:items-stretch">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const isPro = plan.isPopular;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 sm:p-10 transition-all duration-300 ${
                  isPro
                    ? "border-2 border-accent bg-surface shadow-md"
                    : "border border-line bg-surface hover:border-line/80 shadow-xs"
                }`}
              >
                <div>
                  {/* Badge para el plan más popular */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading text-xl font-semibold text-ink">
                      {t(plan.nameKey)}
                    </h3>
                    {isPro && (
                      <Badge variant="accent">
                        {t("Más popular")}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted leading-relaxed mb-6">
                    {t(plan.descKey)}
                  </p>

                  {/* Precio */}
                  <div className="flex items-baseline gap-1 pb-6 border-b border-line mb-6">
                    <span className="font-heading text-4xl font-semibold text-ink sm:text-5xl">
                      {price} €
                    </span>
                    <span className="text-xs text-muted">/ {isAnnual ? "mes (anual)" : "mes"}</span>
                  </div>

                  {/* Lista de características */}
                  <ul className="space-y-3 text-xs text-ink">
                    {plan.featureKeys.map((featureKey) => (
                      <li key={featureKey} className="flex items-start gap-2.5">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-soft text-ink mt-0.5">
                          <Check size={11} strokeWidth={2.5} />
                        </span>
                        <span>{t(featureKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Botón CTA */}
                <div className="mt-8 pt-6 border-t border-line">
                  <Link href="/register" className="w-full">
                    <Button
                      variant={isPro ? "primary" : "secondary"}
                      className="w-full py-3"
                    >
                      {t(plan.ctaKey)}
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
