"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Card from "@/components/ui/card";
import { PRICING_PLANS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

const billingOptions = [
  { annual: false, label: "Facturación mensual" },
  { annual: true, label: "Facturación anual" },
];

export default function PricingSection() {
  const { t, language } = useI18n();
  const [isAnnual, setIsAnnual] = useState(false);
  const formatPrice = new Intl.NumberFormat(language === "es" ? "es-ES" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format;

  return (
    <section id="planes" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
            {t("Planes a tu medida")}
          </h2>
          <p className="mt-3 text-sm text-muted">
            {t("Tarifas de referencia para profesionales, equipos y empresas.")}
          </p>
          <div role="group" aria-label={t("Periodo de facturación")} className="mt-8 inline-flex rounded-xl border border-line bg-surface p-1">
            {billingOptions.map(({ annual, label }) => (
              <button
                key={label}
                type="button"
                aria-pressed={isAnnual === annual}
                onClick={() => setIsAnnual(annual)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                  isAnnual === annual ? "bg-accent text-ink" : "text-muted hover:text-ink"
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        <div aria-live="polite" className="mt-10 grid gap-5 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => {
            const price = isAnnual ? plan.annualMonthlyPrice * 12 : plan.monthlyPrice;

            return (
              <Card
                key={plan.id}
                className={`flex flex-col rounded-3xl bg-surface p-6 lg:p-8 ${
                  plan.isPopular ? "border-2 border-accent" : "border border-line"
                }`}
              >
                <h3 className="font-heading text-2xl font-semibold">{t(plan.nameKey)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(plan.descKey)}</p>

                <div className="mt-auto border-b border-line pt-6 pb-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-heading text-4xl font-semibold">{formatPrice(price)}</span>
                    <span className="text-sm text-muted">/ {t(isAnnual ? "año" : "mes")}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {isAnnual
                      ? t("Equivale a {price} al mes").replace("{price}", formatPrice(plan.annualMonthlyPrice))
                      : t("Pago mensual")}
                  </p>
                </div>

                <ul className="mt-5 space-y-3 text-sm md:min-h-32">
                  {plan.featureKeys.map((featureKey) => (
                    <li key={featureKey} className="flex items-start gap-2.5">
                      <Check size={16} aria-hidden="true" className="mt-0.5 shrink-0" />
                      {t(featureKey)}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
