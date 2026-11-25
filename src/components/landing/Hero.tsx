"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function Hero() {
  const { t } = useI18n();

  return (
    <section className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-14 md:grid-cols-2 md:py-20 lg:px-8">
      <div>
        <h1 className="max-w-xl font-heading text-5xl leading-[1.05] font-semibold tracking-tight text-ink lg:text-7xl">
          {t("Un espacio para cada forma de trabajar")}
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
          {t("Reserva un escritorio para concentrarte, una sala para reunirte con tu equipo o una cabina para tu próxima llamada.")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/dashboard" className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-ink hover:bg-accent/90">
            {t("Empezar a reservar")}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a href="#espacios" className="rounded-xl border border-line bg-surface px-6 py-3 text-sm font-medium text-ink hover:bg-accent-soft">
            {t("Explorar espacios")}
          </a>
        </div>
      </div>

      <div
        className="hero-photo relative aspect-[5/4] overflow-hidden rounded-3xl bg-accent-soft"
        onPointerMove={(event) => {
          if (!window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
          const rect = event.currentTarget.getBoundingClientRect();
          event.currentTarget.style.setProperty("--photo-x", `${((event.clientX - rect.left) / rect.width - 0.5) * 8}px`);
          event.currentTarget.style.setProperty("--photo-y", `${((event.clientY - rect.top) / rect.height - 0.5) * 8}px`);
        }}
        onPointerLeave={(event) => {
          event.currentTarget.style.setProperty("--photo-x", "0px");
          event.currentTarget.style.setProperty("--photo-y", "0px");
        }}
      >
        <Image
          src="/images/landing/coworking.webp"
          alt={t("Personas trabajando en escritorios compartidos")}
          fill
          preload
          sizes="(min-width: 1280px) 588px, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
    </section>
  );
}
