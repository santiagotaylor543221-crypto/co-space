"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const nextLanguage = language === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={language === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[10px] font-medium text-zinc-300 transition hover:border-white/20 hover:text-white"
    >
      <Languages size={12} />
      {nextLanguage.toUpperCase()}
    </button>
  );
}
