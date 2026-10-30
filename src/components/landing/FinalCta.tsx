"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

// CTA final de alto contraste sobre bloque oscuro #111111
export default function FinalCta() {
  const { t } = useI18n();

  return (
    <section className="py-24 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#111111] px-8 py-16 text-center text-white sm:px-16 sm:py-24 shadow-2xl">
          {/* Titular */}
          <h2 className="mx-auto max-w-2xl font-heading text-3xl font-semibold tracking-tight text-white sm:text-5xl leading-tight">
            {t("¿Listo para reservar sin complicaciones?")}
          </h2>

          {/* Subtítulo */}
          <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base text-zinc-400 leading-relaxed">
            {t(
              "Únete a co-space y gestiona tus reservas con la máxima seguridad y velocidad."
            )}
          </p>

          {/* Botones de acción */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button variant="primary" size="lg" className="shadow-md">
                <span>{t("Crear cuenta")}</span>
                <ArrowRight size={16} />
              </Button>
            </Link>

            <a href="#contacto">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition"
              >
                {t("Contactar")}
              </button>
            </a>
          </div>

          {/* Garantías sutiles */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-accent" />
              <span>{t("Sin tarjeta de crédito")}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-accent" />
              <span>{t("Configuración instantánea")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
