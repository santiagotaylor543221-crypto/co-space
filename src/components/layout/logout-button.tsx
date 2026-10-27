"use client";

import { LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const { t } = useI18n();

  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={`inline-flex items-center gap-1.5 text-zinc-400 transition hover:text-white ${className}`}
      >
        <LogOut size={13} />
        {t("Cerrar sesión")}
      </button>
    </form>
  );
}
