import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Spaces from "@/components/landing/Spaces";
import HowItWorks from "@/components/landing/HowItWorks";
import Management from "@/components/landing/Management";
import PricingSection from "@/components/landing/PricingSection";
import FinalCta from "@/components/landing/FinalCta";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Spaces />
        <HowItWorks />
        <Management />
        <PricingSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
