import type { ReactNode } from "react";
import LanguageSwitcher from "@/components/layout/language-switcher";

export default function AuthLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#09090b] px-4 py-10">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}
