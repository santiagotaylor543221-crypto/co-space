"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function FinalCta() {
  const { t } = useI18n();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="relative isolate overflow-hidden rounded-3xl bg-stone-800 px-6 py-20 text-center text-white sm:px-12 sm:py-28">
        <Image
          src="/images/landing/closing.webp"
          alt=""
          fill
          sizes="(min-width: 1280px) 1216px, 100vw"
          className="-z-20 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-stone-950/60" aria-hidden="true" />
        <h2 className="mx-auto max-w-2xl font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("¿Listo para reservar sin complicaciones?")}
        </h2>
        <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-stone-100 sm:text-base">
          {t("Crea tu cuenta y agenda el lugar para tu próxima jornada de trabajo.")}
        </p>
        <Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-ink hover:bg-accent/90">
          {t("Crear cuenta")}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
