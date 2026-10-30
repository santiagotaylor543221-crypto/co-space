"use client";

import Brand from "@/components/layout/brand";
import { useI18n } from "@/lib/i18n";

// Pie de página público secundario con tokens semánticos claros
export default function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="flex flex-col items-center justify-between gap-3 border-t border-line py-8 text-center sm:flex-row sm:text-left text-xs text-muted">
      <Brand />
      <p>{t("Trabaja mejor, a tu manera.")}</p>
      <p className="text-[11px]">
        © 2026 co-space
      </p>
    </footer>
  );
}
