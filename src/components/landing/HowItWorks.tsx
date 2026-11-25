"use client";

import { CalendarDays, LayoutGrid, TicketCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const steps = [
  {
    icon: LayoutGrid,
    title: "Elige tu espacio",
    description: "Consulta el tipo de espacio, su capacidad y los detalles antes de elegir.",
  },
  {
    icon: CalendarDays,
    title: "Reserva tu horario",
    description: "Selecciona una fecha y elige una franja disponible de 1 a 4 horas.",
  },
  {
    icon: TicketCheck,
    title: "Consulta tu reserva",
    description: "Revisa en Mis reservas dónde y a qué hora tienes agendado tu espacio.",
  },
];

export default function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id="como-funciona" className="scroll-mt-24 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("Cómo funciona")}
        </h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-6">
              <Icon size={24} aria-hidden="true" className="mb-5" />
              <h3 className="font-heading text-xl font-semibold">{t(title)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{t(description)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
