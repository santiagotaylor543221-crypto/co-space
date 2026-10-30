import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/layout/language-switcher";

// Layout limpio y centrado para pantallas de autenticación
export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4 py-12 font-body text-ink">
      {/* Selector de idioma flotante en la esquina */}
      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
