import { Hero } from "@/components/landing/hero";
import { LogoRow } from "@/components/landing/logo-row";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { CTA } from "@/components/landing/cta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <LogoRow />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTA />
    </>
  );
}
