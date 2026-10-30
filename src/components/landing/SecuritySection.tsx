"use client";

import { Shield, KeyRound, Lock } from "lucide-react";
import Card from "@/components/ui/card";
import { SECURITY_PILLARS } from "@/data/landing";
import { useI18n } from "@/lib/i18n";

// Sección Seguridad en el borde con 3 tarjetas enfocadas en middleware proxy y doble JWT
export default function SecuritySection() {
  const { t } = useI18n();

  const getIcon = (name: string) => {
    switch (name) {
      case "shield":
        return <Shield size={22} className="text-accent" />;
      case "key":
        return <KeyRound size={22} className="text-accent" />;
      case "lock":
        return <Lock size={22} className="text-accent" />;
      default:
        return <Shield size={22} className="text-accent" />;
    }
  };

  return (
    <section id="seguridad" className="py-24 border-b border-line bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            {t("Seguridad en el borde")}
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            {t("Protección estricta antes de llegar a tus datos")}
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {SECURITY_PILLARS.map((pillar) => (
            <Card
              key={pillar.id}
              className="flex flex-col justify-between rounded-3xl p-8 hover:border-accent/40 transition duration-300"
            >
              <div>
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft border border-accent/20">
                  {getIcon(pillar.iconName)}
                </div>

                <h3 className="font-heading text-lg font-semibold text-ink">
                  {t(pillar.titleKey)}
                </h3>

                <p className="mt-3 text-xs leading-relaxed text-muted">
                  {t(pillar.descKey)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
