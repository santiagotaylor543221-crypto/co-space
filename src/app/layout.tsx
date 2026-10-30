import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "co-space | Reserva de espacios de coworking",
  description: "Plataforma moderna de reserva de espacios de coworking. Rápido, seguro y sin fricción.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-ink font-body">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
