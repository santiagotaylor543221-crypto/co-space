import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Capabilities from "@/components/landing/Capabilities";
import HowItWorks from "@/components/landing/HowItWorks";
import SecuritySection from "@/components/landing/SecuritySection";
import UnderTheHood from "@/components/landing/UnderTheHood";
import MetricsSection from "@/components/landing/MetricsSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import PricingSection from "@/components/landing/PricingSection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

// Landing page principal de co-space ensamblada de forma limpia y modular
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-ink flex flex-col font-body antialiased">
      {/* 1. Navbar fija */}
      <Navbar />

      {/* Contenido principal */}
      <main className="flex-1">
        {/* 2. Hero con titular masivo y cinta en movimiento */}
        <Hero />

        {/* 3. Capacidades numeradas 01-04 */}
        <Capabilities />

        {/* 4. Cómo funciona (I, II, III) con mock decorativo */}
        <HowItWorks />

        {/* 5. Seguridad en el borde */}
        <SecuritySection />

        {/* 6. Bajo el capó (ADN técnico y tarjeta de código estática) */}
        <UnderTheHood />

        {/* 7. Métricas ilustrativas */}
        <MetricsSection />

        {/* 8. Testimonios con navegación simple */}
        <TestimonialsSection />

        {/* 9. Planes con toggle mensual/anual */}
        <PricingSection />

        {/* 10. CTA final en bloque oscuro */}
        <FinalCta />
      </main>

      {/* 11. Footer con enlaces y derechos */}
      <Footer />
    </div>
  );
}