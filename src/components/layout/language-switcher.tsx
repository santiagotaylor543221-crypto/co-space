"use client";

import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Selector de idioma ES/EN con tokens semánticos claros
export default function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();
  const nextLanguage = language === "es" ? "en" : "es";

  return (
    <button
      type="button"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={language === "es" ? "Cambiar a inglés" : "Switch to Spanish"}
      className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1.5 text-[11px] font-medium text-muted transition hover:border-ink/30 hover:text-ink shadow-xs"
    >
      <Languages size={13} />
      <span>{nextLanguage.toUpperCase()}</span>
    </button>
  );
}
