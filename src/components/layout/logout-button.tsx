"use client";

import { useRef, useState, type FormEvent } from "react";
import { LogOut } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { publishSessionChange, replaceDocument, responseError, withSessionLock } from "@/lib/auth/client";
import { LOGIN_PATH } from "@/lib/auth/paths";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const { t } = useI18n();
  const pending = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fallback = "No se pudo cerrar la sesión. Intenta de nuevo.";

  async function logout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setLoading(true);
    setError("");

    try {
      const response = await withSessionLock(() => fetch("/api/auth/logout", { method: "POST", cache: "no-store" }));
      if (!response.ok) throw new Error(await responseError(response, fallback));
      publishSessionChange();
      replaceDocument(LOGIN_PATH);
    } catch (error) {
      setError(error instanceof Error ? error.message : fallback);
      pending.current = false;
      setLoading(false);
    }
  }

  return (
    <form action="/api/auth/logout" method="post" onSubmit={logout}>
      <button
        type="submit"
        disabled={loading}
        className={`inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-ink ${className}`}
      >
        <LogOut size={14} />
        <span>{t("Cerrar sesión")}</span>
      </button>
      {error && <p role="alert" className="mt-1 text-xs text-danger">{t(error)}</p>}
    </form>
  );
}
