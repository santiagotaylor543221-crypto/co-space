"use client";

import { CalendarCheck, LayoutGrid, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const actions = [
  { icon: LayoutGrid, label: "Crea, edita y archiva espacios del catálogo." },
  { icon: CalendarCheck, label: "Consulta y filtra las reservas de todos los espacios." },
  { icon: Users, label: "Consulta las cuentas de miembros y administradores." },
];

export default function Management() {
  const { t } = useI18n();

  return (
    <section id="administracion" className="scroll-mt-24 px-6 lg:px-8">
      <div className="mx-auto grid max-w-[76rem] gap-8 rounded-3xl bg-accent-soft p-7 sm:p-12 md:grid-cols-2 md:items-center">
        <h2 className="max-w-lg font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
          {t("Administra tu coworking en un solo lugar")}
        </h2>
        <ul className="space-y-4 text-sm leading-relaxed">
          {actions.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-4 rounded-xl bg-surface/75 p-4">
              <Icon size={19} aria-hidden="true" className="shrink-0" />
              {t(label)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
