"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";

const spaces = [
  {
    image: "coworking",
    title: "Escritorios flexibles",
    description: "Instálate con tu portátil y avanza en tus proyectos a tu ritmo.",
  },
  {
    image: "meeting",
    title: "Salas de reuniones",
    description: "Reúne a tu equipo para planear, presentar o tomar decisiones juntos.",
  },
  {
    image: "booth",
    title: "Cabinas privadas",
    description: "Encuentra un lugar tranquilo para llamadas y videollamadas.",
  },
];

export default function Spaces() {
  const { t } = useI18n();

  return (
    <section id="espacios" aria-labelledby="spaces-title" className="scroll-mt-24 border-y border-line bg-surface py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 id="spaces-title" className="font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("Encuentra tu espacio")}
        </h2>
        <ul
          aria-labelledby="spaces-title"
          tabIndex={0}
          className="mt-8 grid snap-x snap-mandatory auto-cols-[min(82%,22rem)] grid-flow-col gap-5 overflow-x-auto pb-4 md:grid-flow-row md:grid-cols-3 md:overflow-visible md:pb-0"
        >
          {spaces.map(({ image, title, description }) => (
            <li key={image} className="snap-start overflow-hidden rounded-2xl border border-line bg-background">
              <div className="relative aspect-[3/2] bg-accent-soft">
                <Image
                  src={`/images/landing/${image}.webp`}
                  alt=""
                  fill
                  sizes="(min-width: 1280px) 392px, (min-width: 768px) 33vw, (min-width: 480px) 352px, 82vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <h3 className="font-heading text-xl font-semibold">{t(title)}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{t(description)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
