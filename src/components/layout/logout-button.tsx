"use client";

import { LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface LogoutButtonProps {
  className?: string;
}

// Botón de cierre de sesión con tokens semánticos
export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const { t } = useI18n();

  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={`inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ink ${className}`}
      >
        <LogOut size={14} />
        <span>{t("Cerrar sesión")}</span>
      </button>
    </form>
  );
}
